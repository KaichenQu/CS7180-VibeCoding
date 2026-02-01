"""
Cache V2: Production-quality implementation with TTL, LRU eviction, and file persistence.

Persistence Strategy: Explicit flush() API
- Rationale: Persisting on every mutation would cause significant I/O overhead in 
  high-throughput scenarios. An explicit flush() gives callers control over durability
  vs performance tradeoffs. For safety-critical use cases, call flush() after mutations.

Public API:
- set(key, value, ttl_seconds=None) -> None
- get(key) -> value | None
- delete(key) -> bool
- clear() -> None
- size() -> int
- flush() -> None  (persist to file)
"""

import json
import time
from collections import OrderedDict
from typing import Any, Optional
from pathlib import Path


class LRUCache:
    """
    Thread-unsafe LRU cache with TTL support and file persistence.
    
    Internal storage format:
    - _cache: OrderedDict[str, tuple[value, expires_at]]
      where expires_at is epoch seconds (float) or None for no expiration
    - OrderedDict maintains insertion/access order for LRU tracking
    """
    
    def __init__(
        self,
        max_size: int = 100,
        persistence_path: Optional[str] = None
    ):
        if max_size < 1:
            raise ValueError("max_size must be at least 1")
        
        self._max_size = max_size
        self._persistence_path = Path(persistence_path) if persistence_path else None
        self._cache: OrderedDict[str, tuple[Any, Optional[float]]] = OrderedDict()
        
        if self._persistence_path and self._persistence_path.exists():
            self._load()
    
    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve a value by key.
        
        Returns None if key doesn't exist or has expired.
        Marks entry as most recently used on successful access.
        Lazily removes expired entries on access.
        """
        if key not in self._cache:
            return None
        
        value, expires_at = self._cache[key]
        
        # Lazy expiration check
        if expires_at is not None and time.time() > expires_at:
            del self._cache[key]
            return None
        
        # Move to end (most recently used)
        self._cache.move_to_end(key)
        return value
    
    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """
        Store a value with optional TTL.
        
        If key exists, updates value, TTL, and LRU position.
        If cache is full, evicts LRU entry (after purging expired).
        
        Args:
            key: Cache key (will be converted to string)
            value: Value to store (must be JSON-serializable for persistence)
            ttl_seconds: Time-to-live in seconds, None for no expiration
        """
        key = str(key)
        expires_at = time.time() + ttl_seconds if ttl_seconds is not None else None
        
        # Remove existing key to reset LRU position
        if key in self._cache:
            del self._cache[key]
        else:
            # Only need to check capacity when adding new key
            self._ensure_capacity()
        
        self._cache[key] = (value, expires_at)
    
    def delete(self, key: str) -> bool:
        """
        Remove a key from the cache.
        
        Returns True if key existed (even if expired), False otherwise.
        """
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def clear(self) -> None:
        """Remove all entries from the cache."""
        self._cache.clear()
    
    def size(self) -> int:
        """
        Return count of non-expired entries.
        
        Note: This performs a full scan to exclude expired entries.
        For raw count including potentially expired entries, use len(cache._cache).
        """
        now = time.time()
        return sum(
            1 for _, expires_at in self._cache.values()
            if expires_at is None or expires_at > now
        )
    
    def flush(self) -> None:
        """
        Persist cache state to file.
        
        Raises ValueError if no persistence path configured.
        Expired entries are excluded from persistence.
        """
        if self._persistence_path is None:
            raise ValueError("No persistence path configured")
        
        now = time.time()
        
        # Filter out expired entries for clean persistence
        entries = {
            k: {"value": v, "expires_at": exp}
            for k, (v, exp) in self._cache.items()
            if exp is None or exp > now
        }
        
        data = {
            "version": 2,
            "max_size": self._max_size,
            "entries": entries
        }
        
        # Atomic write: write to temp file then rename
        temp_path = self._persistence_path.with_suffix('.tmp')
        with open(temp_path, 'w') as f:
            json.dump(data, f, indent=2)
        temp_path.rename(self._persistence_path)
    
    def _load(self) -> None:
        """Load cache state from file, discarding expired entries."""
        try:
            with open(self._persistence_path, 'r') as f:
                data = json.load(f)
            
            now = time.time()
            entries = data.get("entries", {})
            
            for key, entry in entries.items():
                expires_at = entry.get("expires_at")
                # Skip expired entries
                if expires_at is not None and expires_at <= now:
                    continue
                # Respect max_size during load
                if len(self._cache) >= self._max_size:
                    break
                self._cache[key] = (entry["value"], expires_at)
                
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            # Corrupted file - start fresh
            self._cache.clear()
    
    def _ensure_capacity(self) -> None:
        """
        Ensure space for one new entry by evicting if necessary.
        
        Strategy:
        1. First purge all expired entries
        2. If still at capacity, evict LRU non-expired entry
        """
        if len(self._cache) < self._max_size:
            return
        
        # Phase 1: Purge expired entries
        self._purge_expired()
        
        # Phase 2: If still full, evict LRU
        if len(self._cache) >= self._max_size:
            # popitem(last=False) removes oldest (LRU) entry
            self._cache.popitem(last=False)
    
    def _purge_expired(self) -> int:
        """Remove all expired entries. Returns count removed."""
        now = time.time()
        expired_keys = [
            k for k, (_, expires_at) in self._cache.items()
            if expires_at is not None and expires_at <= now
        ]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)
    
    def __contains__(self, key: str) -> bool:
        """Check if key exists and is not expired (does not update LRU)."""
        if key not in self._cache:
            return False
        _, expires_at = self._cache[key]
        if expires_at is not None and time.time() > expires_at:
            return False
        return True
    
    def __repr__(self) -> str:
        return f"LRUCache(max_size={self._max_size}, current_size={self.size()})"


# =============================================================================
# TEST SUITE
# =============================================================================

import tempfile
import os


def test_basic_operations():
    """Test fundamental get/set/delete/clear operations."""
    print("Test: Basic Operations")
    cache = LRUCache(max_size=10)
    
    # Set and get
    cache.set("key1", "value1")
    assert cache.get("key1") == "value1"
    
    # Update existing key
    cache.set("key1", "updated")
    assert cache.get("key1") == "updated"
    
    # Missing key returns None
    assert cache.get("missing") is None
    
    # Delete existing key
    assert cache.delete("key1") is True
    assert cache.get("key1") is None
    
    # Delete missing key
    assert cache.delete("missing") is False
    
    # Clear
    cache.set("a", 1)
    cache.set("b", 2)
    cache.clear()
    assert cache.size() == 0
    
    # Complex values
    cache.set("complex", {"nested": [1, 2, 3], "flag": True})
    assert cache.get("complex") == {"nested": [1, 2, 3], "flag": True}
    
    print("  ✓ Passed")


def test_ttl_expiration():
    """Test TTL-based expiration behavior."""
    print("Test: TTL Expiration")
    cache = LRUCache(max_size=10)
    
    # Entry with TTL
    cache.set("expires", "value", ttl_seconds=1)
    assert cache.get("expires") == "value"
    
    # Entry without TTL (permanent)
    cache.set("permanent", "forever")
    
    # Wait for expiration
    time.sleep(1.1)
    
    # Expired entry returns None (lazy deletion)
    assert cache.get("expires") is None
    
    # Permanent entry still exists
    assert cache.get("permanent") == "forever"
    
    # Verify expired entry was actually removed
    assert "expires" not in cache._cache
    
    print("  ✓ Passed")


def test_ttl_update_on_set():
    """Test that set() on existing key updates TTL."""
    print("Test: TTL Update on Set")
    cache = LRUCache(max_size=10)
    
    # Set with short TTL
    cache.set("key", "v1", ttl_seconds=1)
    
    # Update with longer TTL before expiration
    time.sleep(0.5)
    cache.set("key", "v2", ttl_seconds=2)
    
    # Original TTL would have expired, but update extended it
    time.sleep(0.7)  # Total 1.2s from original set
    assert cache.get("key") == "v2"
    
    print("  ✓ Passed")


def test_lru_eviction_order():
    """Test LRU eviction evicts least recently used first."""
    print("Test: LRU Eviction Order")
    cache = LRUCache(max_size=3)
    
    # Fill cache: a, b, c (in order of access)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    
    # Access 'a' to make it most recently used
    # Order is now: b, c, a
    cache.get("a")
    
    # Add 'd' - should evict 'b' (LRU)
    cache.set("d", 4)
    
    assert cache.get("b") is None, "b should be evicted"
    assert cache.get("a") == 1, "a should exist (was accessed)"
    assert cache.get("c") == 3, "c should exist"
    assert cache.get("d") == 4, "d should exist"
    
    print("  ✓ Passed")


def test_lru_set_updates_position():
    """Test that set() on existing key updates LRU position."""
    print("Test: Set Updates LRU Position")
    cache = LRUCache(max_size=3)
    
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    # Order: a, b, c
    
    # Update 'a' - moves to most recent
    cache.set("a", 100)
    # Order: b, c, a
    
    # Add 'd' - should evict 'b'
    cache.set("d", 4)
    
    assert cache.get("b") is None, "b should be evicted"
    assert cache.get("a") == 100, "a should exist with updated value"
    
    print("  ✓ Passed")


def test_eviction_prefers_expired():
    """Test that expired entries are purged before evicting valid LRU entries."""
    print("Test: Eviction Prefers Expired")
    cache = LRUCache(max_size=3)
    
    # Add entries with short TTL
    cache.set("expire1", "x", ttl_seconds=1)
    cache.set("expire2", "y", ttl_seconds=1)
    cache.set("permanent", "z")
    
    # Wait for expiration
    time.sleep(1.1)
    
    # Add new entry - should purge expired first, not evict permanent
    cache.set("new", "value")
    
    assert cache.get("permanent") == "z", "permanent should not be evicted"
    assert cache.get("new") == "value"
    assert cache.size() == 2  # permanent + new
    
    print("  ✓ Passed")


def test_persistence_basic():
    """Test basic save and load functionality."""
    print("Test: Persistence Basic")
    
    with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as f:
        path = f.name
    
    try:
        # Create and populate cache
        cache1 = LRUCache(max_size=10, persistence_path=path)
        cache1.set("str_key", "string_value")
        cache1.set("int_key", 42)
        cache1.set("dict_key", {"a": 1, "b": [2, 3]})
        cache1.flush()
        
        # Load into new instance
        cache2 = LRUCache(max_size=10, persistence_path=path)
        assert cache2.get("str_key") == "string_value"
        assert cache2.get("int_key") == 42
        assert cache2.get("dict_key") == {"a": 1, "b": [2, 3]}
        
    finally:
        os.unlink(path)
    
    print("  ✓ Passed")


def test_persistence_excludes_expired():
    """Test that expired entries are excluded from persistence and load."""
    print("Test: Persistence Excludes Expired")
    
    with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as f:
        path = f.name
    
    try:
        cache1 = LRUCache(max_size=10, persistence_path=path)
        cache1.set("expires", "temp", ttl_seconds=1)
        cache1.set("permanent", "keep")
        
        # Wait for expiration
        time.sleep(1.1)
        
        # Flush - should exclude expired
        cache1.flush()
        
        # Load - should not have expired entry
        cache2 = LRUCache(max_size=10, persistence_path=path)
        assert cache2.get("expires") is None
        assert cache2.get("permanent") == "keep"
        assert cache2.size() == 1
        
    finally:
        os.unlink(path)
    
    print("  ✓ Passed")


def test_persistence_preserves_ttl():
    """Test that TTL is preserved across persistence."""
    print("Test: Persistence Preserves TTL")
    
    with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as f:
        path = f.name
    
    try:
        cache1 = LRUCache(max_size=10, persistence_path=path)
        cache1.set("timed", "value", ttl_seconds=2)
        cache1.flush()
        
        # Load immediately - should exist
        cache2 = LRUCache(max_size=10, persistence_path=path)
        assert cache2.get("timed") == "value"
        
        # Wait and verify expiration still works
        time.sleep(2.1)
        assert cache2.get("timed") is None
        
    finally:
        os.unlink(path)
    
    print("  ✓ Passed")


def test_size_excludes_expired():
    """Test that size() only counts non-expired entries."""
    print("Test: Size Excludes Expired")
    cache = LRUCache(max_size=10)
    
    cache.set("expire", "x", ttl_seconds=1)
    cache.set("permanent", "y")
    
    assert cache.size() == 2
    
    time.sleep(1.1)
    
    # size() should not count expired entry
    assert cache.size() == 1
    
    print("  ✓ Passed")


def test_contains_operator():
    """Test 'in' operator behavior."""
    print("Test: Contains Operator")
    cache = LRUCache(max_size=10)
    
    cache.set("exists", "value")
    cache.set("expires", "temp", ttl_seconds=1)
    
    assert "exists" in cache
    assert "expires" in cache
    assert "missing" not in cache
    
    time.sleep(1.1)
    assert "expires" not in cache  # Expired
    
    print("  ✓ Passed")


def test_max_size_validation():
    """Test that invalid max_size raises error."""
    print("Test: Max Size Validation")
    
    try:
        LRUCache(max_size=0)
        assert False, "Should raise ValueError"
    except ValueError:
        pass
    
    try:
        LRUCache(max_size=-1)
        assert False, "Should raise ValueError"
    except ValueError:
        pass
    
    print("  ✓ Passed")


def test_corrupted_persistence_file():
    """Test graceful handling of corrupted persistence file."""
    print("Test: Corrupted Persistence File")
    
    with tempfile.NamedTemporaryFile(suffix='.json', delete=False, mode='w') as f:
        f.write("not valid json {{{")
        path = f.name
    
    try:
        # Should not raise, should start with empty cache
        cache = LRUCache(max_size=10, persistence_path=path)
        assert cache.size() == 0
        
        # Should be usable
        cache.set("key", "value")
        assert cache.get("key") == "value"
        
    finally:
        os.unlink(path)
    
    print("  ✓ Passed")


def run_all_tests():
    """Execute all tests."""
    print("=" * 60)
    print("Cache V2 Test Suite")
    print("=" * 60)
    
    test_basic_operations()
    test_ttl_expiration()
    test_ttl_update_on_set()
    test_lru_eviction_order()
    test_lru_set_updates_position()
    test_eviction_prefers_expired()
    test_persistence_basic()
    test_persistence_excludes_expired()
    test_persistence_preserves_ttl()
    test_size_excludes_expired()
    test_contains_operator()
    test_max_size_validation()
    test_corrupted_persistence_file()
    
    print("=" * 60)
    print("All V2 tests passed! ✓")
    print("=" * 60)


# =============================================================================
# EDGE CASES HANDLED
# =============================================================================
"""
Edge Cases Handled:

1. TTL Behavior
   - Lazy expiration: expired entries removed on get() access
   - Expired entries purged before LRU eviction decisions
   - set() on existing key resets TTL (can extend or shorten)
   - None TTL means entry never expires
   - TTL preserved across persistence/reload

2. LRU Behavior
   - get() moves entry to most-recently-used position
   - set() on existing key updates LRU position (treated as new access)
   - Eviction removes least-recently-used non-expired entry
   - Expired entries purged before evicting valid entries

3. Persistence
   - Atomic write using temp file + rename (prevents corruption)
   - Expired entries excluded from flush() output
   - Expired entries discarded during load()
   - Graceful handling of corrupted/invalid JSON files
   - Missing file handled (starts with empty cache)
   - Respects max_size during load (truncates if file has more)

4. Capacity Management
   - max_size < 1 raises ValueError
   - Eviction only triggered when adding new keys (not updating existing)
   - Multiple expired entries can be purged in single eviction cycle

5. Type Handling
   - Keys converted to strings
   - Values must be JSON-serializable for persistence
   - Complex nested structures supported (dicts, lists)

6. size() Accuracy
   - Returns count of non-expired entries only
   - Does full scan to ensure accuracy (no stale counts)

7. Thread Safety
   - NOT thread-safe (documented in class docstring)
   - Caller responsible for external synchronization if needed
"""

if __name__ == "__main__":
    run_all_tests()
