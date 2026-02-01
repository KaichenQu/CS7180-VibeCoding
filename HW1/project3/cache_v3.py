"""
PersistentLRUTTLCache V3: Production-quality generic cache implementation.

A FAANG-grade in-process cache with:
- Generic type support (K, V)
- TTL per entry with lazy + aggressive expiration
- True LRU eviction with correct ordering semantics
- Atomic file persistence with corruption recovery
- Deterministic testing via time injection

Design Decisions:
- Data Structure: OrderedDict[K, tuple[V, float | None]] for O(1) LRU operations
- Persistence: Atomic write via temp file + os.replace()
- Time: Injectable now_fn for deterministic testing
- Serialization: JSON with explicit validation and clear error messages

Author: Claude (Anthropic)
License: MIT
"""

from __future__ import annotations

import json
import os
import tempfile
from collections import OrderedDict
from typing import TypeVar, Generic, Callable, Any
from pathlib import Path

K = TypeVar('K')
V = TypeVar('V')


class SerializationError(Exception):
    """Raised when a key or value cannot be JSON-serialized."""
    pass


class PersistentLRUTTLCache(Generic[K, V]):
    """
    Thread-unsafe LRU cache with TTL and file persistence.
    
    Type Parameters:
        K: Key type (must be JSON-serializable and hashable)
        V: Value type (must be JSON-serializable)
    
    Attributes:
        max_size: Maximum number of entries before eviction
        persist_path: Path to JSON persistence file
    
    Behavior on corrupted/missing file:
        - Missing file: starts with empty cache, no error
        - Corrupted JSON: starts with empty cache, no error
        - Invalid schema: starts with empty cache, no error
        All cases are logged to stderr if you add logging; currently silent for cleaner output.
    
    Thread Safety:
        This implementation is NOT thread-safe. Callers must provide external
        synchronization (e.g., threading.Lock) for concurrent access.
    """
    
    __slots__ = ('_max_size', '_persist_path', '_now_fn', '_cache')
    
    def __init__(
        self,
        max_size: int,
        persist_path: str,
        *,
        now_fn: Callable[[], float] | None = None
    ) -> None:
        """
        Initialize the cache.
        
        Args:
            max_size: Maximum entries (must be >= 1)
            persist_path: Path to persistence file
            now_fn: Optional time function for testing (default: time.time)
        
        Raises:
            ValueError: If max_size < 1
        """
        if max_size < 1:
            raise ValueError(f"max_size must be >= 1, got {max_size}")
        
        self._max_size = max_size
        self._persist_path = Path(persist_path)
        self._now_fn = now_fn if now_fn is not None else self._default_now
        self._cache: OrderedDict[K, tuple[V, float | None]] = OrderedDict()
        
        self.load()
    
    @staticmethod
    def _default_now() -> float:
        """Default time function using time.time()."""
        import time
        return time.time()
    
    def get(self, key: K) -> V | None:
        """
        Retrieve a value by key.
        
        Semantics:
            - Returns None if key not found
            - Returns None and removes entry if expired
            - Moves entry to MRU position on successful access
        
        Args:
            key: The key to look up
        
        Returns:
            The value if found and not expired, None otherwise
        """
        if key not in self._cache:
            return None
        
        value, expires_at = self._cache[key]
        
        # Check expiration
        if expires_at is not None and self._now_fn() >= expires_at:
            del self._cache[key]
            return None
        
        # Move to MRU (most recently used)
        self._cache.move_to_end(key)
        return value
    
    def set(self, key: K, value: V, ttl_seconds: float | None = None) -> None:
        """
        Store a value with optional TTL.
        
        Semantics:
            - Validates JSON serializability before modifying cache
            - Removes existing entry (if any) before re-inserting
            - Prunes all expired entries before eviction check
            - Evicts LRU entries until size < max_size
            - New entry always goes to MRU position
        
        Args:
            key: Cache key (must be JSON-serializable and hashable)
            value: Value to store (must be JSON-serializable)
            ttl_seconds: Time-to-live in seconds, None for no expiration
        
        Raises:
            SerializationError: If key or value cannot be JSON-serialized
        """
        # Validate serializability BEFORE any mutation
        self._validate_serializable(key, "key")
        self._validate_serializable(value, "value")
        
        # Calculate expiration
        expires_at: float | None = None
        if ttl_seconds is not None:
            if ttl_seconds <= 0:
                # Zero or negative TTL means already expired; don't insert
                # But do remove existing entry if present
                self._cache.pop(key, None)
                return
            expires_at = self._now_fn() + ttl_seconds
        
        # Remove existing entry to reset LRU position
        self._cache.pop(key, None)
        
        # Aggressively prune expired entries before eviction
        self._prune_expired()
        
        # Evict LRU entries until we have space
        while len(self._cache) >= self._max_size:
            # popitem(last=False) removes the oldest (LRU) entry
            self._cache.popitem(last=False)
        
        # Insert at MRU position (end of OrderedDict)
        self._cache[key] = (value, expires_at)
    
    def delete(self, key: K) -> bool:
        """
        Remove an entry by key.
        
        Args:
            key: The key to remove
        
        Returns:
            True if key existed (regardless of expiration), False otherwise
        """
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def clear(self) -> None:
        """Remove all entries from the cache."""
        self._cache.clear()
    
    def __len__(self) -> int:
        """
        Return the count of non-expired entries.
        
        Note: This performs a full scan to ensure accuracy.
        For raw count (including potentially expired), use len(cache._cache).
        """
        now = self._now_fn()
        return sum(
            1 for _, (__, expires_at) in self._cache.items()
            if expires_at is None or now < expires_at
        )
    
    def __contains__(self, key: K) -> bool:
        """Check if key exists and is not expired (does NOT update LRU)."""
        if key not in self._cache:
            return False
        _, expires_at = self._cache[key]
        return expires_at is None or self._now_fn() < expires_at
    
    def flush(self) -> None:
        """
        Persist cache to file atomically.
        
        File format:
            {
                "version": 3,
                "max_size": <int>,
                "entries": [
                    {"key": <K>, "value": <V>, "expires_at": <float|null>},
                    ...  // ordered from LRU to MRU
                ]
            }
        
        Atomic write:
            Writes to a temp file in the same directory, then uses os.replace()
            for atomic rename. This prevents corruption on crash.
        
        Raises:
            OSError: If file cannot be written
        """
        # Build ordered entry list (LRU to MRU order)
        entries = [
            {"key": k, "value": v, "expires_at": exp}
            for k, (v, exp) in self._cache.items()
        ]
        
        data = {
            "version": 3,
            "max_size": self._max_size,
            "entries": entries
        }
        
        # Atomic write: temp file + rename
        # Create temp file in same directory to ensure same filesystem
        dir_path = self._persist_path.parent
        dir_path.mkdir(parents=True, exist_ok=True)
        
        fd, temp_path = tempfile.mkstemp(
            suffix='.tmp',
            prefix='.cache_',
            dir=dir_path
        )
        
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            os.replace(temp_path, self._persist_path)
        except:
            # Clean up temp file on error
            try:
                os.unlink(temp_path)
            except OSError:
                pass
            raise
    
    def load(self) -> None:
        """
        Load cache from persistence file.
        
        Behavior:
            - Missing file: starts empty (not an error)
            - Corrupted JSON: starts empty (not an error)
            - Invalid schema: starts empty (not an error)
            - Expired entries: discarded during load
            - Entries exceeding max_size: oldest (LRU) entries truncated
        
        LRU order is preserved from file (entries stored LRU to MRU).
        """
        self._cache.clear()
        
        if not self._persist_path.exists():
            return
        
        try:
            with open(self._persist_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Validate structure
            if not isinstance(data, dict):
                return
            
            entries = data.get("entries")
            if not isinstance(entries, list):
                return
            
            now = self._now_fn()
            
            for entry in entries:
                if not isinstance(entry, dict):
                    continue
                
                # Extract fields with validation
                if "key" not in entry or "value" not in entry:
                    continue
                
                key = entry["key"]
                value = entry["value"]
                expires_at = entry.get("expires_at")
                
                # Skip expired entries
                if expires_at is not None and now >= expires_at:
                    continue
                
                # Respect max_size during load
                if len(self._cache) >= self._max_size:
                    # Remove LRU to make space (preserves MRU entries from file)
                    self._cache.popitem(last=False)
                
                self._cache[key] = (value, expires_at)
                
        except (json.JSONDecodeError, OSError, TypeError, KeyError):
            # Any error during load: start fresh
            self._cache.clear()
    
    def _prune_expired(self) -> int:
        """
        Remove all expired entries.
        
        Returns:
            Number of entries removed
        """
        now = self._now_fn()
        expired_keys = [
            k for k, (_, expires_at) in self._cache.items()
            if expires_at is not None and now >= expires_at
        ]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)
    
    def _validate_serializable(self, obj: Any, name: str) -> None:
        """
        Validate that an object can be JSON-serialized.
        
        Args:
            obj: Object to validate
            name: Name for error message ("key" or "value")
        
        Raises:
            SerializationError: If object cannot be serialized
        """
        try:
            json.dumps(obj)
        except (TypeError, ValueError) as e:
            raise SerializationError(
                f"{name} is not JSON-serializable: {type(obj).__name__} - {e}"
            ) from e
    
    def _debug_state(self) -> dict:
        """
        Return internal state for debugging/testing.
        
        Returns dict with:
            - entries: list of (key, value, expires_at) in LRU->MRU order
            - size: current entry count
            - max_size: configured max size
        """
        return {
            "entries": [
                (k, v, exp) for k, (v, exp) in self._cache.items()
            ],
            "size": len(self._cache),
            "max_size": self._max_size
        }
    
    def __repr__(self) -> str:
        return (
            f"PersistentLRUTTLCache("
            f"max_size={self._max_size}, "
            f"current_size={len(self)}, "
            f"path={self._persist_path!r})"
        )


# =============================================================================
# DETERMINISTIC TEST SUITE
# =============================================================================

import unittest
from unittest import TestCase


class MockClock:
    """Deterministic clock for testing."""
    
    def __init__(self, start: float = 0.0):
        self._time = start
    
    def __call__(self) -> float:
        return self._time
    
    def advance(self, seconds: float) -> None:
        self._time += seconds
    
    def set(self, time: float) -> None:
        self._time = time


class TestTTLExpiry(TestCase):
    """Test 1: TTL expiry removal."""
    
    def setUp(self):
        self.clock = MockClock(1000.0)
        self.path = tempfile.mktemp(suffix='.json')
        self.cache: PersistentLRUTTLCache[str, str] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
    
    def tearDown(self):
        try:
            os.unlink(self.path)
        except OSError:
            pass
    
    def test_entry_expires_after_ttl(self):
        """Entry should be accessible before TTL, None after."""
        self.cache.set("key", "value", ttl_seconds=10.0)
        
        # Before expiration
        self.clock.advance(9.9)
        self.assertEqual(self.cache.get("key"), "value")
        
        # At exactly expiration time
        self.clock.advance(0.1)  # Now at 1010.0, expires_at = 1010.0
        self.assertIsNone(self.cache.get("key"))
    
    def test_expired_entry_removed_on_get(self):
        """get() on expired entry should remove it from cache."""
        self.cache.set("key", "value", ttl_seconds=5.0)
        self.clock.advance(10.0)
        
        # Verify entry exists in raw cache
        self.assertIn("key", self.cache._cache)
        
        # get() should return None and remove
        self.assertIsNone(self.cache.get("key"))
        self.assertNotIn("key", self.cache._cache)
    
    def test_no_ttl_never_expires(self):
        """Entry with no TTL should never expire."""
        self.cache.set("permanent", "value")
        
        self.clock.advance(1_000_000.0)  # Far future
        self.assertEqual(self.cache.get("permanent"), "value")
    
    def test_zero_ttl_not_inserted(self):
        """Zero or negative TTL should not insert entry."""
        self.cache.set("zero", "value", ttl_seconds=0)
        self.assertIsNone(self.cache.get("zero"))
        
        self.cache.set("negative", "value", ttl_seconds=-5)
        self.assertIsNone(self.cache.get("negative"))
    
    def test_ttl_update_on_set(self):
        """set() on existing key should update TTL."""
        self.cache.set("key", "v1", ttl_seconds=5.0)
        self.clock.advance(3.0)
        
        # Update with new TTL
        self.cache.set("key", "v2", ttl_seconds=10.0)
        
        # Original would expire at t=1005, we're at t=1003
        # New expires at t=1013
        self.clock.advance(5.0)  # t=1008
        self.assertEqual(self.cache.get("key"), "v2")
        
        self.clock.advance(5.0)  # t=1013
        self.assertIsNone(self.cache.get("key"))


class TestLRUOrdering(TestCase):
    """Test 2: LRU order updates on get()."""
    
    def setUp(self):
        self.clock = MockClock(1000.0)
        self.path = tempfile.mktemp(suffix='.json')
        self.cache: PersistentLRUTTLCache[str, int] = PersistentLRUTTLCache(
            max_size=3,
            persist_path=self.path,
            now_fn=self.clock
        )
    
    def tearDown(self):
        try:
            os.unlink(self.path)
        except OSError:
            pass
    
    def test_get_moves_to_mru(self):
        """get() should move entry to MRU position."""
        self.cache.set("a", 1)
        self.cache.set("b", 2)
        self.cache.set("c", 3)
        # Order: a(LRU), b, c(MRU)
        
        # Access 'a' - should move to MRU
        self.cache.get("a")
        # Order: b(LRU), c, a(MRU)
        
        # Add 'd' - should evict 'b' (new LRU)
        self.cache.set("d", 4)
        
        self.assertIsNone(self.cache.get("b"))  # Evicted
        self.assertEqual(self.cache.get("c"), 3)
        self.assertEqual(self.cache.get("a"), 1)
        self.assertEqual(self.cache.get("d"), 4)
    
    def test_set_moves_existing_to_mru(self):
        """set() on existing key should move to MRU."""
        self.cache.set("a", 1)
        self.cache.set("b", 2)
        self.cache.set("c", 3)
        # Order: a(LRU), b, c(MRU)
        
        # Update 'a' - should move to MRU
        self.cache.set("a", 100)
        # Order: b(LRU), c, a(MRU)
        
        # Add 'd' - should evict 'b'
        self.cache.set("d", 4)
        
        self.assertIsNone(self.cache.get("b"))
        self.assertEqual(self.cache.get("a"), 100)
    
    def test_failed_get_does_not_affect_lru(self):
        """get() on missing/expired key should not affect LRU order."""
        self.cache.set("a", 1)
        self.cache.set("b", 2)
        self.cache.set("c", 3)
        
        # Access missing key
        self.cache.get("nonexistent")
        
        # Add 'd' - should still evict 'a' (original LRU)
        self.cache.set("d", 4)
        self.assertIsNone(self.cache.get("a"))


class TestEvictionCorrectness(TestCase):
    """Test 3: Eviction correctness under max_size."""
    
    def setUp(self):
        self.clock = MockClock(1000.0)
        self.path = tempfile.mktemp(suffix='.json')
    
    def tearDown(self):
        try:
            os.unlink(self.path)
        except OSError:
            pass
    
    def test_evicts_lru_when_full(self):
        """Should evict LRU entry when at capacity."""
        cache: PersistentLRUTTLCache[str, int] = PersistentLRUTTLCache(
            max_size=2,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache.set("a", 1)
        cache.set("b", 2)
        cache.set("c", 3)  # Should evict 'a'
        
        self.assertIsNone(cache.get("a"))
        self.assertEqual(cache.get("b"), 2)
        self.assertEqual(cache.get("c"), 3)
        self.assertEqual(len(cache), 2)
    
    def test_multiple_evictions(self):
        """Should handle multiple sequential evictions."""
        cache: PersistentLRUTTLCache[int, str] = PersistentLRUTTLCache(
            max_size=2,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        for i in range(10):
            cache.set(i, f"value_{i}")
        
        # Only last 2 should remain
        self.assertEqual(len(cache), 2)
        self.assertIsNone(cache.get(7))
        self.assertEqual(cache.get(8), "value_8")
        self.assertEqual(cache.get(9), "value_9")
    
    def test_size_one_cache(self):
        """Cache with max_size=1 should work correctly."""
        cache: PersistentLRUTTLCache[str, str] = PersistentLRUTTLCache(
            max_size=1,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache.set("a", "1")
        self.assertEqual(cache.get("a"), "1")
        
        cache.set("b", "2")
        self.assertIsNone(cache.get("a"))
        self.assertEqual(cache.get("b"), "2")


class TestExpiredPrunedBeforeEviction(TestCase):
    """Test 4: Expired entries pruned before eviction."""
    
    def setUp(self):
        self.clock = MockClock(1000.0)
        self.path = tempfile.mktemp(suffix='.json')
        self.cache: PersistentLRUTTLCache[str, int] = PersistentLRUTTLCache(
            max_size=3,
            persist_path=self.path,
            now_fn=self.clock
        )
    
    def tearDown(self):
        try:
            os.unlink(self.path)
        except OSError:
            pass
    
    def test_expired_pruned_instead_of_valid_lru(self):
        """Expired entries should be removed before evicting valid LRU."""
        # Add entries with TTL
        self.cache.set("expire1", 1, ttl_seconds=5.0)
        self.cache.set("expire2", 2, ttl_seconds=5.0)
        self.cache.set("permanent", 3)
        # Order: expire1(LRU), expire2, permanent(MRU)
        
        # Let TTL entries expire
        self.clock.advance(10.0)
        
        # Cache is "full" with 3 entries, but 2 are expired
        self.assertEqual(len(self.cache._cache), 3)
        
        # Add new entry - should prune expired, NOT evict permanent
        self.cache.set("new", 4)
        
        self.assertEqual(self.cache.get("permanent"), 3)
        self.assertEqual(self.cache.get("new"), 4)
        self.assertIsNone(self.cache.get("expire1"))
        self.assertIsNone(self.cache.get("expire2"))
    
    def test_mixed_expired_and_eviction(self):
        """When expired pruning isn't enough, also evict LRU."""
        self.cache.set("a", 1, ttl_seconds=5.0)  # Will expire
        self.cache.set("b", 2)  # Permanent, LRU among valid
        self.cache.set("c", 3)  # Permanent, MRU among valid
        
        self.clock.advance(10.0)  # 'a' expires
        
        # Add two new entries
        self.cache.set("d", 4)  # Prunes 'a', fits
        self.cache.set("e", 5)  # Must evict 'b'
        
        self.assertIsNone(self.cache.get("a"))
        self.assertIsNone(self.cache.get("b"))
        self.assertEqual(self.cache.get("c"), 3)
        self.assertEqual(self.cache.get("d"), 4)
        self.assertEqual(self.cache.get("e"), 5)


class TestPersistenceRoundTrip(TestCase):
    """Test 5: Persistence round-trip preserves order + TTL semantics."""
    
    def setUp(self):
        self.clock = MockClock(1000.0)
        self.path = tempfile.mktemp(suffix='.json')
    
    def tearDown(self):
        try:
            os.unlink(self.path)
        except OSError:
            pass
    
    def test_basic_round_trip(self):
        """Basic save and load preserves data."""
        cache1: PersistentLRUTTLCache[str, dict] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache1.set("str", "value")
        cache1.set("int", 42)
        cache1.set("dict", {"nested": [1, 2, 3]})
        cache1.flush()
        
        # Load into new cache
        cache2: PersistentLRUTTLCache[str, dict] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        self.assertEqual(cache2.get("str"), "value")
        self.assertEqual(cache2.get("int"), 42)
        self.assertEqual(cache2.get("dict"), {"nested": [1, 2, 3]})
    
    def test_lru_order_preserved(self):
        """LRU order should be preserved across persistence."""
        cache1: PersistentLRUTTLCache[str, int] = PersistentLRUTTLCache(
            max_size=3,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache1.set("a", 1)
        cache1.set("b", 2)
        cache1.set("c", 3)
        cache1.get("a")  # Move 'a' to MRU
        # Order: b(LRU), c, a(MRU)
        cache1.flush()
        
        # Load and verify order by adding new entry
        cache2: PersistentLRUTTLCache[str, int] = PersistentLRUTTLCache(
            max_size=3,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache2.set("d", 4)  # Should evict 'b'
        
        self.assertIsNone(cache2.get("b"))
        self.assertEqual(cache2.get("c"), 3)
        self.assertEqual(cache2.get("a"), 1)
        self.assertEqual(cache2.get("d"), 4)
    
    def test_ttl_preserved_and_enforced(self):
        """TTL should be preserved and enforced after reload."""
        cache1: PersistentLRUTTLCache[str, str] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache1.set("short", "expires", ttl_seconds=10.0)
        cache1.set("long", "lasts", ttl_seconds=100.0)
        cache1.flush()
        
        # Advance time and reload
        self.clock.advance(50.0)
        
        cache2: PersistentLRUTTLCache[str, str] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        # 'short' should be discarded on load (expired)
        self.assertIsNone(cache2.get("short"))
        # 'long' should still exist
        self.assertEqual(cache2.get("long"), "lasts")
    
    def test_expired_discarded_on_load(self):
        """Expired entries should not be loaded."""
        cache1: PersistentLRUTTLCache[str, int] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache1.set("expire1", 1, ttl_seconds=5.0)
        cache1.set("expire2", 2, ttl_seconds=5.0)
        cache1.set("permanent", 3)
        cache1.flush()
        
        self.clock.advance(10.0)
        
        cache2: PersistentLRUTTLCache[str, int] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        # Should only have permanent entry
        self.assertEqual(len(cache2), 1)
        self.assertEqual(cache2.get("permanent"), 3)
    
    def test_missing_file_starts_empty(self):
        """Missing persistence file should start empty cache."""
        cache: PersistentLRUTTLCache[str, str] = PersistentLRUTTLCache(
            max_size=10,
            persist_path="/nonexistent/path/cache.json",
            now_fn=self.clock
        )
        
        self.assertEqual(len(cache), 0)
        cache.set("key", "value")
        self.assertEqual(cache.get("key"), "value")
    
    def test_corrupted_file_starts_empty(self):
        """Corrupted persistence file should start empty cache."""
        # Write garbage to file
        with open(self.path, 'w') as f:
            f.write("not valid json {{{")
        
        cache: PersistentLRUTTLCache[str, str] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        self.assertEqual(len(cache), 0)


class TestSerializationValidation(TestCase):
    """Test serialization error handling."""
    
    def setUp(self):
        self.clock = MockClock(1000.0)
        self.path = tempfile.mktemp(suffix='.json')
        self.cache: PersistentLRUTTLCache = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
    
    def tearDown(self):
        try:
            os.unlink(self.path)
        except OSError:
            pass
    
    def test_non_serializable_value_raises(self):
        """Non-JSON-serializable value should raise SerializationError."""
        with self.assertRaises(SerializationError) as ctx:
            self.cache.set("key", lambda x: x)
        
        self.assertIn("value", str(ctx.exception))
        self.assertIn("not JSON-serializable", str(ctx.exception))
    
    def test_non_serializable_key_raises(self):
        """Non-JSON-serializable key should raise SerializationError."""
        with self.assertRaises(SerializationError) as ctx:
            self.cache.set(object(), "value")
        
        self.assertIn("key", str(ctx.exception))
    
    def test_mutation_not_applied_on_error(self):
        """Cache should not be modified if serialization fails."""
        self.cache.set("existing", "value")
        
        try:
            self.cache.set("existing", lambda x: x)  # Will fail
        except SerializationError:
            pass
        
        # Original value should be preserved
        self.assertEqual(self.cache.get("existing"), "value")


class TestEdgeCases(TestCase):
    """Additional edge case tests."""
    
    def setUp(self):
        self.clock = MockClock(1000.0)
        self.path = tempfile.mktemp(suffix='.json')
    
    def tearDown(self):
        try:
            os.unlink(self.path)
        except OSError:
            pass
    
    def test_invalid_max_size(self):
        """max_size < 1 should raise ValueError."""
        with self.assertRaises(ValueError):
            PersistentLRUTTLCache(max_size=0, persist_path=self.path)
        
        with self.assertRaises(ValueError):
            PersistentLRUTTLCache(max_size=-1, persist_path=self.path)
    
    def test_delete_returns_correct_bool(self):
        """delete() should return True if key existed."""
        cache: PersistentLRUTTLCache[str, str] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache.set("key", "value")
        self.assertTrue(cache.delete("key"))
        self.assertFalse(cache.delete("key"))
        self.assertFalse(cache.delete("never_existed"))
    
    def test_clear(self):
        """clear() should remove all entries."""
        cache: PersistentLRUTTLCache[str, int] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache.set("a", 1)
        cache.set("b", 2)
        cache.set("c", 3)
        
        cache.clear()
        
        self.assertEqual(len(cache), 0)
        self.assertIsNone(cache.get("a"))
    
    def test_contains_does_not_update_lru(self):
        """'in' operator should not update LRU order."""
        cache: PersistentLRUTTLCache[str, int] = PersistentLRUTTLCache(
            max_size=2,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache.set("a", 1)
        cache.set("b", 2)
        # Order: a(LRU), b(MRU)
        
        # Check 'a' with 'in' - should NOT move to MRU
        _ = "a" in cache
        
        # Add 'c' - should evict 'a' if 'in' didn't update LRU
        cache.set("c", 3)
        
        self.assertIsNone(cache.get("a"))  # Evicted
        self.assertEqual(cache.get("b"), 2)
    
    def test_len_excludes_expired(self):
        """__len__ should only count non-expired entries."""
        cache: PersistentLRUTTLCache[str, int] = PersistentLRUTTLCache(
            max_size=10,
            persist_path=self.path,
            now_fn=self.clock
        )
        
        cache.set("a", 1, ttl_seconds=5.0)
        cache.set("b", 2, ttl_seconds=5.0)
        cache.set("c", 3)  # Permanent
        
        self.assertEqual(len(cache), 3)
        
        self.clock.advance(10.0)
        
        self.assertEqual(len(cache), 1)


def run_tests():
    """Run all tests."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestTTLExpiry))
    suite.addTests(loader.loadTestsFromTestCase(TestLRUOrdering))
    suite.addTests(loader.loadTestsFromTestCase(TestEvictionCorrectness))
    suite.addTests(loader.loadTestsFromTestCase(TestExpiredPrunedBeforeEviction))
    suite.addTests(loader.loadTestsFromTestCase(TestPersistenceRoundTrip))
    suite.addTests(loader.loadTestsFromTestCase(TestSerializationValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestEdgeCases))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


# =============================================================================
# MANUAL TEST CHECKLIST
# =============================================================================
"""
MANUAL TEST CHECKLIST
=====================

1. Basic Functionality
   □ Create cache, set a value, get it back
   □ Set with TTL, verify expiration after waiting
   □ Delete existing key (returns True)
   □ Delete non-existent key (returns False)
   □ Clear cache, verify empty

2. LRU Behavior
   □ Fill cache to max_size
   □ Access oldest entry
   □ Add new entry - verify second-oldest was evicted (not the accessed one)
   □ Update existing entry - verify it moves to MRU

3. TTL Edge Cases
   □ Set TTL=0 - entry should not be inserted
   □ Set TTL=negative - entry should not be inserted
   □ Update entry with longer TTL - verify new expiration
   □ Update entry with None TTL - verify it becomes permanent

4. Eviction Priority
   □ Fill cache with mix of TTL and permanent entries
   □ Let TTL entries expire
   □ Add new entry - verify expired were pruned, permanent not evicted

5. Persistence
   □ Add entries, flush(), verify file exists with correct JSON
   □ Restart with same path - verify data loaded
   □ Verify LRU order preserved after reload
   □ Add TTL entry, flush, wait for expiry, reload - verify entry not loaded
   □ Delete persistence file - verify cache starts empty
   □ Corrupt persistence file - verify cache starts empty (no crash)

6. Serialization
   □ Try to set non-serializable value (lambda) - verify SerializationError
   □ Try to set non-serializable key (object) - verify SerializationError
   □ Verify cache not modified on serialization error

7. Concurrency (if adding thread safety later)
   □ Concurrent reads don't corrupt
   □ Concurrent writes don't corrupt
   □ flush() during writes doesn't corrupt file

8. Performance (optional)
   □ Insert 100K entries - verify no memory leak
   □ Time get/set operations - should be O(1)
   □ Time flush with large cache - acceptable for file size
"""


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
