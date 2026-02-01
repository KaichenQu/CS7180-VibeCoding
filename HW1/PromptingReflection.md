# What Makes a Great Prompt?

## Introduction

Through developing three software projects—email validation, a React data table, and a caching layer—I explored prompt engineering by creating three progressive versions (V1, V2, V3) of each. This iterative approach revealed how prompt structure directly impacts code quality, completeness, and first-pass accuracy. By analyzing the prompts that drove increasingly sophisticated implementations, clear patterns emerged about what separates basic requests from production-grade specifications.

---

## Reflection: What Makes a Great Prompt?

Working through three projects with progressively refined prompts revealed a fundamental insight: **the quality of AI-generated code correlates directly with prompt sophistication**. My V1 prompts—simple directives like "Build a React data table component in TypeScript"—produced functional but basic implementations. V3 prompts, by contrast, yielded production-quality code with comprehensive testing, edge case handling, and proper architectural decisions.

### 1. Role Definition Sets the Bar

The most transformative discovery was role assignment. V1 prompts lacked role context. V2 introduced "You are a senior engineer," immediately elevating code quality—proper TypeScript types appeared, error handling improved, and edge cases were considered. V3's "You are a FAANG-level senior engineer" prompt produced genuinely production-grade implementations with stable sorting algorithms, dependency injection for testing, and atomic file operations. The role signals not just expertise level but also implicit quality expectations: documentation style, test comprehensiveness, and architectural rigor.

### 2. Specificity Eliminates Ambiguity

Vague requests invite assumptions. My V1 email validation prompt said "validate email addresses"—Claude chose a simple regex. V3 specified: "support plus addressing," "reject consecutive dots," "prioritize practical correctness over RFC compliance." This precision yielded exactly what I needed, first try. Similarly, the data table V3 prompt detailed "stable sorting (do not reorder equal items unpredictably)" and "case-insensitive substring match"—specifications that prevent common bugs. Specificity transforms open-ended problems into well-defined requirements.

### 3. Structure Manages Complexity

Unstructured prompts become unwieldy for complex tasks. V2 and V3 prompts used hierarchical organization: **Requirements**, **Constraints**, **Technical Specifications**, **Deliverables**. Bullet points and numbered lists made multi-faceted requests scannable. The caching layer V3 prompt had separate sections for "Semantics," "API," "Persistence," and "Testing"—each addressing a distinct concern. This structure mirrors good software specifications and helps both the prompter organize thoughts and the AI prioritize requirements.

### 4. Explicit Constraints Prevent Assumptions

The phrase "No external dependencies (standard library only)" appeared in all V3 prompts. This constraint fundamentally shaped solutions—no pandas, no lodash, no shortcuts. V3 also included priority statements: "Correctness > performance." Such constraints establish boundaries and trade-offs upfront, preventing solutions that technically work but violate unstated requirements. The React table constraint "No external table libraries" forced a from-scratch implementation, demonstrating architectural understanding rather than integration skill.

### 5. Output Format Ensures Completeness

V1 prompts implied "give me code." V3 prompts specified: "1) Implementation code, 2) Test suite covering [specific scenarios], 3) Manual test checklist." This deliverable list acts as a completeness checklist. The caching layer V3 requested "brief notes listing edge cases handled"—forcing explicit documentation of design decisions. Output format specifications ensure the response addresses all aspects of a production task, not just the happy path.

### 6. Pre-Analysis Requests Improve Design

The most sophisticated prompts included: "Before coding, briefly analyze: inputs/outputs, edge cases, data structures chosen." This forced structured thinking before implementation. The email validator V3 response began with a design analysis section—regex strategy, two-phase validation reasoning. The data table V3 listed data flow order and edge case handling strategies before any code. Pre-work requests convert the AI from a code generator into a thoughtful engineer who designs before building.

### Conclusion

The progression from V1 to V3 across three projects taught a meta-lesson: **great prompts mirror great software specifications**. They define roles, state requirements precisely, impose constraints, specify deliverables, and request design rationale. Just as rushed requirements yield buggy software, rushed prompts yield suboptimal code. The time invested in crafting detailed, structured prompts pays dividends in first-pass correctness, comprehensive test coverage, and production-ready implementations. Prompt engineering isn't just about talking to AI—it's about thinking clearly about what you need before you ask.

---

## Personal Prompt Template

Below is a reusable template distilled from the patterns that produced the best results across all three projects. Adapt section depth based on task complexity.

```markdown
## [Task Name] - AI Prompt

**Role:** [Define expertise level and domain]

- Examples: "You are a senior backend engineer", "You are a FAANG-level frontend specialist", "You are an expert in distributed systems"

**Goal:** [Single sentence describing what to build or solve]

- Keep this concise and outcome-focused

**Context:** [2-4 sentences providing background]

- Existing systems or constraints
- Why this task matters
- Any relevant domain knowledge

**Requirements:**

- [Functional requirement 1]
- [Functional requirement 2]
- [Functional requirement 3]
- [Continue as needed...]

**Constraints:**

- [Hard constraint 1 - e.g., "No external dependencies beyond standard library"]
- [Hard constraint 2 - e.g., "Must support Python 3.8+"]
- [Hard constraint 3 - e.g., "Cannot use recursion due to stack limits"]
- [Priority statement - e.g., "Security > convenience", "Correctness > performance"]

**Technical Specifications:**

- API/Interface: [Function signatures, class structure, REST endpoints, etc.]
- Data structures: [Preferred or required data structures]
- Performance: [Latency requirements, throughput needs, memory constraints]
- Types: [Type system requirements - e.g., "Use TypeScript generics", "Full type hints"]

**Edge Cases to Handle:**

- [Edge case 1 - e.g., "Empty input"]
- [Edge case 2 - e.g., "Malformed data"]
- [Edge case 3 - e.g., "Concurrent access"]
- [Edge case 4 - e.g., "Null/undefined values"]
- [Continue as needed...]

**Output Format:**

1. [Deliverable 1 - e.g., "Complete implementation code with docstrings"]
2. [Deliverable 2 - e.g., "Test suite with at least 15 test cases covering happy path and edge cases"]
3. [Deliverable 3 - e.g., "Brief documentation explaining design decisions"]
4. [Deliverable 4 - e.g., "Manual test checklist for QA verification"]

**Pre-Work:**
Before implementing, please:

- [Analysis request - e.g., "List the data structures you'll use and justify each choice"]
- [Design request - e.g., "Describe the algorithm at a high level"]
- [Edge case request - e.g., "Identify potential failure modes and mitigation strategies"]
- [Trade-off request - e.g., "Compare this approach against [alternative] and explain your choice"]

**Verification:**

- [Testing approach - e.g., "Include unit tests using pytest"]
- [Success criteria - e.g., "All tests pass", "Handles 10,000 items under 100ms"]
- [How to run - e.g., "python3 solution.py should run tests and display results"]
```

---

## Example: Template Applied to Caching Layer (V3)

Here's how the template would be filled for the caching layer project:

```markdown
## In-Process Cache with TTL and LRU - AI Prompt

**Role:** You are a FAANG-level senior backend engineer implementing production-quality infrastructure components.

**Goal:** Build a Python caching layer supporting TTL expiration, LRU eviction, configurable capacity, and persistence to disk.

**Context:** This cache will be used in a high-traffic service where memory is limited and data can become stale. Correctness is critical—stale data must never be served. The cache must survive process restarts while maintaining LRU semantics and TTL contracts. Standard library only (no Redis, no external caching libraries).

**Requirements:**

- Time-To-Live (TTL) per entry with automatic expiration
- Least Recently Used (LRU) eviction when capacity is reached
- Configurable maximum size (number of entries)
- Persistence to a local JSON file
- Support for any JSON-serializable key-value pairs
- Explicit flush() API to persist changes

**Constraints:**

- No external dependencies—standard library only
- Must use Python generics (TypeVar) for type safety
- Correctness > performance (simple, clear code over micro-optimizations)
- Atomic writes to prevent file corruption
- Cannot use time.sleep() in tests—must support dependency injection for time

**Technical Specifications:**

- API:
  - `PersistentLRUTTLCache[K, V]` class with generics
  - `__init__(max_size: int, persist_path: str, *, now_fn: Callable[[], float] | None = None)`
  - `get(key: K) -> V | None` - returns None if missing or expired
  - `set(key: K, value: V, ttl_seconds: float | None = None) -> None`
  - `delete(key: K) -> bool`
  - `clear() -> None`
  - `flush() -> None` - persist to disk
  - `load() -> None` - load from disk
  - `__len__() -> int` - count of non-expired entries
- Data structures: OrderedDict for O(1) access + LRU ordering
- Storage format: JSON with ordered list preserving LRU sequence

**Edge Cases to Handle:**

- Expired entries must be removed lazily on access
- Before evicting for capacity, prune all expired entries first
- Concurrent modifications during iteration
- Missing or corrupted persistence file on startup
- Non-serializable keys or values (must raise clear error)
- TTL of 0 or negative values
- max_size of 0 or negative values
- Empty cache operations (get from empty, delete from empty)

**Output Format:**

1. Complete implementation in a single .py file with type hints
2. Deterministic test suite (27+ tests) using now_fn injection for time control
3. Test categories: TTL expiry, LRU ordering, eviction correctness, persistence round-trip, serialization validation, edge cases
4. Manual test checklist for QA verification

**Pre-Work:**
Before implementing, please:

- List the data structures you'll use and explain why OrderedDict is appropriate
- Describe how you'll guarantee atomic writes during persistence
- Explain how get() and set() maintain correct LRU ordering

**Verification:**

- All 27 tests must pass when running `python3 cache_v3.py`
- Tests must be deterministic (no time.sleep, use now_fn injection)
- Manual test checklist must verify: persistence survives restarts, LRU evicts correctly, TTL expires accurately
```

---

## Closing Notes

This template represents patterns that consistently produced high-quality results, but it's a starting point, not a rigid formula. Simple tasks may need only Role, Goal, and Requirements. Complex systems might warrant additional sections for scalability, security, or deployment considerations. The key insight: **invest time upfront structuring your prompt**. The clarity you bring to the prompt directly translates to the quality of the solution. Iterate on your templates, learn what works for your domain, and treat prompt engineering as a skill worth developing—because in the age of AI-assisted development, your ability to specify what you need precisely is as valuable as your ability to implement it.

---

**Word Count - Reflection Section:** ~500 words
