# HW1: Progressive Software Engineering Projects

A collection of three homework projects demonstrating progressive implementation patterns, from basic functionality to production-grade code. Each project includes three versions (v1 → v2 → v3) that showcase evolution in complexity, type safety, testing practices, and production readiness.

## Table of Contents
- [Overview](#overview)
- [Project 1: Email Validation (Python)](#project-1-email-validation-python)
- [Project 2: React Data Table (TypeScript/React)](#project-2-react-data-table-typescriptreact)
- [Project 3: Caching Layer with TTL and LRU (Python)](#project-3-caching-layer-with-ttl-and-lru-python)
- [Progressive Implementation Pattern](#progressive-implementation-pattern)
- [Prerequisites](#prerequisites)
- [Key Learning Objectives](#key-learning-objectives)
- [Project Highlights](#project-highlights)

---

## Overview

This repository contains three independent projects that demonstrate software engineering best practices through progressive refinement:

```
HW1/
├── project1/          # Email Validation (Python)
│   ├── email.py
│   ├── Claude-Email validation with regex in Python.md
│   └── emailtest.md
├── project2/          # React Data Table (TypeScript/React)
│   ├── v1/           # Basic implementation with npm setup
│   ├── v2/           # Enhanced with TypeScript types
│   └── v3/           # Production-grade with accessibility & tests
│       ├── data-table-v3.jsx
│       └── data-table-vitest/    # Full test suite
└── project3/          # Caching Layer (Python)
    ├── cache_v1.py
    ├── cache_v2.py
    ├── cache_v3.py
    └── Claude-Caching layer with TTL and LRU eviction.md
```

---

## Project 1: Email Validation (Python)

**Location:** [`project1/`](project1/)

### Description
Email address validation using regular expressions with increasing sophistication across three versions.

### Technology
- **Language:** Python 3.x (standard library only)
- **Key Concepts:** Regular expressions, validation patterns, error handling

### Implementation Versions

#### Version 1: Basic (34 lines)
- Simple email pattern matching using regex
- Returns boolean (valid/invalid)
- Basic test cases (~10 tests)

#### Version 2: Enhanced (Tuple-based error reporting)
- Returns `(is_valid: bool, reason: str | None)`
- Comprehensive validation rules:
  - Dots, consecutive dots, TLD validation
  - Plus addressing support (`user+tag@domain.com`)
  - Subdomain handling
- 21 detailed test cases with specific error messages

#### Version 3: Production-Grade
- Uses dataclass `ValidationResult` with:
  - `is_valid: bool`
  - `reason: str | None`
  - `matched_parts: dict` (extracts local, domain, TLD)
- Complex verbose regex with named capture groups
- Two-phase validation (regex + diagnostic failure analysis)
- 23 comprehensive test cases covering edge cases:
  - Consecutive dots
  - Boundary hyphens
  - Numeric TLDs
  - Whitespace handling

### How to Run

```bash
cd project1
python3 email.py
```

All three versions are included in `email.py` with embedded test cases that run automatically.

### Key Files
- [email.py](project1/email.py) - Complete implementation with all 3 versions
- [Claude-Email validation with regex in Python.md](project1/Claude-Email%20validation%20with%20regex%20in%20Python.md) - Detailed documentation
- [emailtest.md](project1/emailtest.md) - Test documentation

---

## Project 2: React Data Table (TypeScript/React)

**Location:** [`project2/`](project2/)

### Description
A sortable, filterable, paginated data table component built with React and TypeScript, demonstrating progressive enhancement in component architecture and type safety.

### Technology Stack
- **Framework:** React 18.2+
- **Language:** TypeScript 5.2+
- **Build Tool:** Vite
- **Testing:** Vitest
- **Styling:** Tailwind CSS
- **Dev Tools:** ESLint, Testing Library

### Features
- Multi-column sorting with visual indicators (↑↓↕)
- Global text search filtering
- Pagination (configurable rows per page)
- Responsive design
- Accessibility features (ARIA labels, keyboard navigation)
- Type-safe column definitions

### Implementation Versions

#### Version 1: Basic (~350 lines)
- Simple React component with basic functionality
- Column sorting with visual indicators
- Global text search filtering
- Basic pagination (5/10/15 rows per page)
- Sample employee dataset
- Limited TypeScript usage

**Run v1:**
```bash
cd project2/v1
npm install
npm run dev    # Start development server
npm test       # Run tests
```

#### Version 2: Enhanced (~700 lines)
- Proper TypeScript types:
  - `BaseRow` interface requiring `id`
  - `ColumnDef<T>` with render functions, sortability, widths
  - `SortState<T>` typed sort tracking
- Column configuration system
- Correct data flow: Filter → Sort → Paginate
- Custom render functions for formatted cells (currency, dates, badges)
- Non-sortable columns supported
- ARIA accessibility attributes
- Edge cases documented

**Run v2:**
```bash
cd project2/v2
npm install
npm run dev    # Start development server
npm test       # Run tests
```

#### Version 3: Production/FAANG-Level (~1200+ lines)
- Stable sorting algorithm (preserves equal item order)
- Full accessibility: keyboard focus, semantic HTML
- Generic `DataTable<T>` component
- Advanced TypeScript with `keyof T` constraints
- Header cycling: none → asc → desc → none
- Performance optimization with `useMemo`
- Page bounds checking
- "Showing X–Y of Z" pagination display
- Comprehensive test suite with vitest
- Manual test checklist

**Run v3:**
```bash
cd project2/v3/data-table-vitest
npm install
npm run dev          # Start development server
npm test             # Run test suite
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
```

### Key Files
- [v1/](project2/v1/) - Basic implementation
- [v2/](project2/v2/) - Enhanced with TypeScript
- [v3/data-table-v3.jsx](project2/v3/data-table-v3.jsx) - Standalone production component
- [v3/data-table-vitest/](project2/v3/data-table-vitest/) - Full test suite and application
- [Claude-Testing sortable filterable data table across versions.md](project2/Claude-Testing%20sortable%20filterable%20data%20table%20across%20versions.md) - Documentation

---

## Project 3: Caching Layer with TTL and LRU (Python)

**Location:** [`project3/`](project3/)

### Description
Production-quality in-process cache implementing Time-To-Live (TTL) expiration and Least Recently Used (LRU) eviction strategies, with file persistence support.

### Technology
- **Language:** Python 3.x (standard library only)
- **Key Concepts:** LRU cache, TTL expiration, file persistence, atomic writes

### Features
- LRU (Least Recently Used) eviction policy
- TTL (Time-To-Live) expiration for entries
- File persistence with atomic writes
- Generic type support (v3)
- Comprehensive test coverage

### Implementation Versions

#### Version 1: Basic (363 lines)
- `CacheEntry` class with TTL tracking
- `LRUCache` class using `OrderedDict`
- Basic operations: get, set, delete, clear
- File persistence (JSON format)
- Automatic loading on initialization
- 6+ test cases covering:
  - Basic CRUD operations
  - TTL expiration
  - LRU eviction
  - File persistence

**Run v1:**
```bash
cd project3
python3 cache_v1.py
```

#### Version 2: Production (615 lines)
- Enhanced API: `get()`, `set()`, `delete()`, `clear()`, `size()`, `flush()`
- Explicit `flush()` API for persistence (not auto-persist on every mutation)
- Atomic writes using temp file + rename pattern
- Lazy expiration on access + proactive purge before LRU eviction
- Internal storage: `OrderedDict[str, tuple[value, expires_at]]`
- Absolute epoch timestamps for TTL
- Input validation with error messages
- 13+ test cases covering:
  - TTL expiration and updates
  - LRU eviction ordering
  - Persistence and corruption handling

**Run v2:**
```bash
cd project3
python3 cache_v2.py
```

#### Version 3: FAANG-Level (1035 lines)
- Generic class: `PersistentLRUTTLCache[K, V]`
- Full TypeVar/Generic support for key-value types
- Dependency injection: `now_fn` parameter for deterministic testing
- Atomic persistence using `tempfile.mkstemp()` + `os.replace()`
- JSON serialization with validation
- Pre-expiration pruning before LRU eviction
- Comprehensive semantic API with `__len__()`, etc.
- **27 deterministic test cases** covering:
  1. TTL expiry (5 tests)
  2. LRU ordering (3 tests)
  3. Eviction correctness (3 tests)
  4. Expired pruning (2 tests)
  5. Persistence round-trip (6 tests)
  6. Serialization validation (3 tests)
  7. Edge cases (5 tests)
- Manual test checklist for QA

**Run v3:**
```bash
cd project3
python3 cache_v3.py
```

### Key Files
- [cache_v1.py](project3/cache_v1.py) - Basic implementation
- [cache_v2.py](project3/cache_v2.py) - Production features
- [cache_v3.py](project3/cache_v3.py) - FAANG-level with comprehensive tests
- [Claude-Caching layer with TTL and LRU eviction.md](project3/Claude-Caching%20layer%20with%20TTL%20and%20LRU%20eviction.md) - Detailed documentation

---

## Progressive Implementation Pattern

Each project follows a consistent evolution pattern across three versions:

### Version 1: Basic Implementation
- **Focus:** Core functionality working correctly
- **Characteristics:**
  - Minimal code structure
  - Basic validation and error handling
  - Simple test cases
  - Proof of concept

### Version 2: Enhanced/Production-Ready
- **Focus:** Better architecture and error handling
- **Characteristics:**
  - Proper type systems (TypeScript types, Python type hints)
  - Comprehensive error messages
  - Input validation
  - Edge case handling
  - Better code organization
  - More thorough testing

### Version 3: FAANG-Level/Production-Grade
- **Focus:** Enterprise-quality implementation
- **Characteristics:**
  - Generic/reusable components
  - Advanced type systems (generics, constraints)
  - Full accessibility (for UI components)
  - Deterministic testing
  - Performance optimization
  - Comprehensive test suites (20+ tests)
  - Manual QA checklists
  - Production patterns (atomic operations, dependency injection)

---

## Prerequisites

### For All Projects
- Basic understanding of software engineering concepts
- Text editor or IDE

### For Project 1 & 3 (Python)
- Python 3.7 or higher
- No external dependencies required (uses standard library only)

### For Project 2 (React/TypeScript)
- Node.js 16.x or higher
- npm 8.x or higher

**Check your versions:**
```bash
python3 --version
node --version
npm --version
```

---

## Key Learning Objectives

This homework collection demonstrates proficiency in:

### Technical Skills
1. **Regular Expressions:** Pattern matching, validation, named groups
2. **React Component Architecture:** State management, props, hooks
3. **TypeScript Type Systems:** Interfaces, generics, type constraints
4. **Caching Algorithms:** LRU eviction, TTL expiration
5. **Testing Practices:** Unit tests, edge cases, deterministic testing
6. **Data Structures:** OrderedDict, arrays, objects

### Software Engineering Practices
1. **Progressive Enhancement:** Building features incrementally
2. **Type Safety:** Leveraging static type systems
3. **Error Handling:** Comprehensive validation and error messages
4. **Code Organization:** Clean architecture and separation of concerns
5. **Testing:** Test-driven development patterns
6. **Documentation:** Clear inline comments and external docs
7. **Accessibility:** ARIA labels, keyboard navigation, semantic HTML
8. **Performance:** Memoization, lazy evaluation, efficient algorithms
9. **Production Patterns:** Atomic operations, dependency injection, file persistence

---

## Project Highlights

### Code Quality
- **Test Coverage:** Each v3 implementation includes 20+ comprehensive test cases
- **Type Safety:** Full TypeScript and Python type annotations in v2/v3
- **Documentation:** Detailed markdown documentation for each project
- **Progressive Complexity:** Clear evolution from v1 (basic) to v3 (production)

### Architecture Patterns
- **Dependency Injection:** Used in cache v3 for deterministic testing
- **Generic Programming:** Type-safe generics in React and Python
- **Atomic Operations:** File persistence with atomic writes
- **Stable Sorting:** Maintains equal item order in data table v3
- **Lazy Evaluation:** Efficient expiration checking in cache

### Production Readiness
- **Accessibility:** Full ARIA support and keyboard navigation (data table v3)
- **Edge Case Handling:** Comprehensive validation for boundary conditions
- **Error Messages:** Clear, actionable error reporting
- **Performance:** Optimized with memoization and efficient algorithms
- **Testing:** Deterministic test suites with comprehensive coverage

---

## Additional Resources

Each project directory contains detailed documentation:
- Implementation notes from development process
- Test case documentation
- Screenshots of working implementations (where applicable)
- Performance considerations and trade-offs

---

## License

This is a homework assignment for educational purposes.

---

**Created as part of software engineering coursework demonstrating progressive implementation patterns and production-ready code quality.**
