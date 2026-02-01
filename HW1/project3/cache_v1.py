"""
Cache V1: Basic implementation with TTL, LRU eviction, and file persistence.

Features:
- Time-To-Live (TTL) for cache entries
- Least Recently Used (LRU) eviction when capacity is reached
- File persistence using JSON
"""

import json
import time
from collections import OrderedDict
from typing import Any, Optional
from pathlib import Path


class CacheEntry:
    """Represents a single cache entry with value and expiration time."""
    
    def __init__(self, value: Any, ttl: Optional[float] = None):
        self.value = value
        self.created_at = time.time()
        self.expires_at = self.created_at + ttl if ttl else None
    
    def is_expired(self) -> bool:
        """Check if the entry has expired."""
        if self.expires_at is None:
            return False
        return time.time() > self.expires_at
    
    def to_dict(self) -> dict:
        """Serialize entry to dictionary for persistence."""
        return {
            "value": self.value,
            "created_at": self.created_at,
            "expires_at": self.expires_at
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "CacheEntry":
        """Deserialize entry from dictionary."""
        entry = cls.__new__(cls)
        entry.value = data["value"]
        entry.created_at = data["created_at"]
        entry.expires_at = data["expires_at"]
        return entry


class LRUCache:
    """
    LRU Cache with TTL support and file persistence.
    
    Args:
        max_size: Maximum number of entries in the cache
        default_ttl: Default TTL in seconds for entries (None = no expiration)
        persistence_path: Path to file for persistence (None = no persistence)
    """
    
    def __init__(
        self,
        max_size: int = 100,
        default_ttl: Optional[float] = None,
        persistence_path: Optional[str] = None
    ):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.persistence_path = Path(persistence_path) if persistence_path else None
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        
        # Load from persistence if available
        if self.persistence_path and self.persistence_path.exists():
            self._load_from_file()
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from the cache.
        
        Returns None if key doesn't exist or has expired.
        Updates access order for LRU tracking.
        """
        if key not in self._cache:
            return None
        
        entry = self._cache[key]
        
        # Check expiration
        if entry.is_expired():
            del self._cache[key]
            return None
        
        # Move to end (most recently used)
        self._cache.move_to_end(key)
        return entry.value
    
    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        """
        Set a value in the cache.
        
        Args:
            key: Cache key
            value: Value to store
            ttl: Time-to-live in seconds (uses default_ttl if not specified)
        """
        # Use provided TTL or default
        entry_ttl = ttl if ttl is not None else self.default_ttl
        
        # If key exists, remove it first (to update position)
        if key in self._cache:
            del self._cache[key]
        
        # Evict if at capacity
        while len(self._cache) >= self.max_size:
            self._evict_lru()
        
        # Add new entry
        self._cache[key] = CacheEntry(value, entry_ttl)
    
    def delete(self, key: str) -> bool:
        """
        Delete a key from the cache.
        
        Returns True if key existed, False otherwise.
        """
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    def clear(self) -> None:
        """Clear all entries from the cache."""
        self._cache.clear()
    
    def size(self) -> int:
        """Return the current number of entries in the cache."""
        return len(self._cache)
    
    def _evict_lru(self) -> None:
        """Evict the least recently used entry."""
        if self._cache:
            # First item in OrderedDict is the least recently used
            self._cache.popitem(last=False)
    
    def cleanup_expired(self) -> int:
        """
        Remove all expired entries.
        
        Returns the number of entries removed.
        """
        expired_keys = [
            key for key, entry in self._cache.items()
            if entry.is_expired()
        ]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)
    
    def save(self) -> None:
        """Save cache to file."""
        if not self.persistence_path:
            raise ValueError("No persistence path configured")
        
        data = {
            "max_size": self.max_size,
            "default_ttl": self.default_ttl,
            "entries": {
                key: entry.to_dict()
                for key, entry in self._cache.items()
            }
        }
        
        with open(self.persistence_path, "w") as f:
            json.dump(data, f, indent=2)
    
    def _load_from_file(self) -> None:
        """Load cache from file."""
        try:
            with open(self.persistence_path, "r") as f:
                content = f.read()
                if not content.strip():
                    return  # Empty file, nothing to load
                data = json.loads(content)
            
            # Restore entries (maintaining order)
            for key, entry_data in data.get("entries", {}).items():
                entry = CacheEntry.from_dict(entry_data)
                # Skip expired entries during load
                if not entry.is_expired():
                    self._cache[key] = entry
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Warning: Could not load cache from file: {e}")
    
    def __contains__(self, key: str) -> bool:
        """Check if key exists and is not expired."""
        return self.get(key) is not None
    
    def __len__(self) -> int:
        """Return the current size of the cache."""
        return self.size()


# =============================================================================
# BASIC TESTS
# =============================================================================

def test_basic_operations():
    """Test basic get/set/delete operations."""
    print("Test: Basic Operations")
    cache = LRUCache(max_size=10)
    
    # Test set and get
    cache.set("key1", "value1")
    assert cache.get("key1") == "value1", "Failed: get after set"
    
    # Test missing key
    assert cache.get("nonexistent") is None, "Failed: missing key should return None"
    
    # Test delete
    cache.set("key2", "value2")
    assert cache.delete("key2") == True, "Failed: delete should return True"
    assert cache.get("key2") is None, "Failed: deleted key should return None"
    assert cache.delete("key2") == False, "Failed: delete non-existent should return False"
    
    # Test clear
    cache.set("key3", "value3")
    cache.clear()
    assert cache.size() == 0, "Failed: clear should empty cache"
    
    print("  ✓ All basic operations passed")


def test_ttl_expiration():
    """Test TTL expiration functionality."""
    print("Test: TTL Expiration")
    cache = LRUCache(max_size=10)
    
    # Set with short TTL
    cache.set("expiring", "value", ttl=0.1)  # 100ms TTL
    assert cache.get("expiring") == "value", "Failed: should exist before expiration"
    
    # Wait for expiration
    time.sleep(0.15)
    assert cache.get("expiring") is None, "Failed: should be None after expiration"
    
    # Test default TTL
    cache_with_default = LRUCache(max_size=10, default_ttl=0.1)
    cache_with_default.set("auto_expire", "value")
    assert cache_with_default.get("auto_expire") == "value", "Failed: should exist before expiration"
    time.sleep(0.15)
    assert cache_with_default.get("auto_expire") is None, "Failed: should expire with default TTL"
    
    print("  ✓ All TTL tests passed")


def test_lru_eviction():
    """Test LRU eviction when cache is full."""
    print("Test: LRU Eviction")
    cache = LRUCache(max_size=3)
    
    # Fill cache
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    assert cache.size() == 3, "Failed: cache should be full"
    
    # Access 'a' to make it recently used
    cache.get("a")
    
    # Add new entry - should evict 'b' (least recently used)
    cache.set("d", 4)
    assert cache.size() == 3, "Failed: cache should still be at max size"
    assert cache.get("b") is None, "Failed: 'b' should be evicted (LRU)"
    assert cache.get("a") == 1, "Failed: 'a' should still exist"
    assert cache.get("c") == 3, "Failed: 'c' should still exist"
    assert cache.get("d") == 4, "Failed: 'd' should exist"
    
    print("  ✓ All LRU eviction tests passed")


def test_persistence():
    """Test file persistence."""
    print("Test: Persistence")
    import tempfile
    import os
    
    # Create temp file
    fd, path = tempfile.mkstemp(suffix=".json")
    os.close(fd)
    
    try:
        # Create and populate cache
        cache1 = LRUCache(max_size=10, persistence_path=path)
        cache1.set("persistent_key", "persistent_value")
        cache1.set("another_key", {"nested": "data"})
        cache1.save()
        
        # Create new cache instance and verify data loaded
        cache2 = LRUCache(max_size=10, persistence_path=path)
        assert cache2.get("persistent_key") == "persistent_value", "Failed: should load persisted data"
        assert cache2.get("another_key") == {"nested": "data"}, "Failed: should load complex data"
        
        print("  ✓ All persistence tests passed")
    finally:
        # Cleanup
        os.unlink(path)


def test_cleanup_expired():
    """Test cleanup of expired entries."""
    print("Test: Cleanup Expired")
    cache = LRUCache(max_size=10)
    
    # Add mix of expiring and non-expiring entries
    cache.set("expire1", "value1", ttl=0.1)
    cache.set("expire2", "value2", ttl=0.1)
    cache.set("permanent", "value3")  # No TTL
    
    assert cache.size() == 3, "Failed: should have 3 entries"
    
    # Wait for expiration
    time.sleep(0.15)
    
    # Cleanup
    removed = cache.cleanup_expired()
    assert removed == 2, "Failed: should remove 2 expired entries"
    assert cache.size() == 1, "Failed: should have 1 entry remaining"
    assert cache.get("permanent") == "value3", "Failed: permanent entry should remain"
    
    print("  ✓ All cleanup tests passed")


def test_contains_and_len():
    """Test __contains__ and __len__ magic methods."""
    print("Test: Contains and Len")
    cache = LRUCache(max_size=10)
    
    cache.set("exists", "value")
    assert "exists" in cache, "Failed: 'in' should return True for existing key"
    assert "missing" not in cache, "Failed: 'in' should return False for missing key"
    assert len(cache) == 1, "Failed: len() should return 1"
    
    print("  ✓ All contains/len tests passed")


def run_all_tests():
    """Run all tests."""
    print("=" * 50)
    print("Running Cache V1 Tests")
    print("=" * 50)
    
    test_basic_operations()
    test_ttl_expiration()
    test_lru_eviction()
    test_persistence()
    test_cleanup_expired()
    test_contains_and_len()
    
    print("=" * 50)
    print("All V1 tests passed! ✓")
    print("=" * 50)


if __name__ == "__main__":
    run_all_tests()
