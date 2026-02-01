# Email validation with regex in Python

**Created:** 1/27/2026 20:52:14  
**Updated:** 1/27/2026 20:53:53  
**Exported:** 1/27/2026 20:56:17  
**Link:** [https://claude.ai/chat/39dfc9df-51f0-47ff-9068-e55aa9da5550](https://claude.ai/chat/39dfc9df-51f0-47ff-9068-e55aa9da5550)

**Test**: 

## Prompt:

1/27/2026, 8:52:15 PM

V1:Write a Python function that validates email addresses using a regular expression.
The function should return True if the email is valid and False otherwise.
Include a few test cases.

## Response:

1/27/2026, 8:52:23 PM

```python
import re


def is_valid_email(email: str) -> bool:
    """
    Validate an email address using a regular expression.

    Returns True if the email is valid, False otherwise.
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


# Test cases
if __name__ == "__main__":
    test_emails = [
        ("user@example.com", True),
        ("john.doe@company.org", True),
        ("alice+tag@mail.co.uk", True),
        ("name123@test-domain.net", True),
        ("invalid-email", False),
        ("missing@domain", False),
        ("@nodomain.com", False),
        ("spaces in@email.com", False),
        ("double@@at.com", False),
        ("", False),
    ]

    print("Email Validation Tests")
    print("-" * 50)

    for email, expected in test_emails:
        result = is_valid_email(email)
        status = "✓" if result == expected else "✗"
        print(f"{status} '{email}' -> {result} (expected {expected})")
```

This function uses a regex pattern that checks for:

- **Local part** (`^[a-zA-Z0-9._%+-]+`): Letters, numbers, dots, underscores, percent signs, plus signs, and hyphens
- **@ symbol**: Required separator
- **Domain** (`[a-zA-Z0-9.-]+`): Letters, numbers, dots, and hyphens
- **TLD** (`\.[a-zA-Z]{2,}$`): A dot followed by at least 2 letters

Run it and you'll see all test cases pass. Note that email validation is notoriously complex—this covers common cases but the full RFC 5322 spec allows for many edge cases that most practical applications don't need to support.

## Prompt:

1/27/2026, 8:52:44 PM

V2: Write a Python function that validates email addresses using a regular expression.
Requirements:

- Handle common edge cases such as plus addressing (e.g. user+tag@gmail.com)
- Handle subdomains (e.g. user@mail.company.co.uk)
- Reject invalid formats such as missing '@' or invalid domain parts
- Return a tuple: (is_valid: bool, reason: str | None)
  Include a small set of unit-style test cases covering both valid and invalid examples.

## Response:

1/27/2026, 8:53:02 PM

```python
import re


def validate_email(email: str) -> tuple[bool, str | None]:
    """
    Validate an email address using a regular expression.

    Returns a tuple of (is_valid, reason) where reason is None if valid,
    or an error message if invalid.
    """
    if not email:
        return False, "Email cannot be empty"

    if email.count('@') == 0:
        return False, "Missing '@' symbol"

    if email.count('@') > 1:
        return False, "Multiple '@' symbols not allowed"

    local, domain = email.split('@')

    if not local:
        return False, "Local part (before '@') cannot be empty"

    if not domain:
        return False, "Domain part (after '@') cannot be empty"

    # Check local part: allows letters, numbers, dots, underscores, percent, plus, hyphen
    local_pattern = r'^[a-zA-Z0-9._%+-]+$'
    if not re.match(local_pattern, local):
        return False, "Local part contains invalid characters"

    if local.startswith('.') or local.endswith('.'):
        return False, "Local part cannot start or end with a dot"

    if '..' in local:
        return False, "Local part cannot contain consecutive dots"

    # Check domain: allows letters, numbers, dots, hyphens
    domain_pattern = r'^[a-zA-Z0-9.-]+$'
    if not re.match(domain_pattern, domain):
        return False, "Domain contains invalid characters"

    if domain.startswith('.') or domain.endswith('.'):
        return False, "Domain cannot start or end with a dot"

    if domain.startswith('-') or domain.endswith('-'):
        return False, "Domain cannot start or end with a hyphen"

    if '..' in domain:
        return False, "Domain cannot contain consecutive dots"

    # Check for valid TLD (at least 2 letters after the last dot)
    parts = domain.split('.')
    if len(parts) < 2:
        return False, "Domain must have at least one dot (e.g., example.com)"

    tld = parts[-1]
    if len(tld) < 2:
        return False, "Top-level domain must be at least 2 characters"

    if not tld.isalpha():
        return False, "Top-level domain must contain only letters"

    return True, None


# Unit-style test cases
if __name__ == "__main__":
    test_cases = [
        # Valid emails
        ("user@example.com", True, None),
        ("john.doe@company.org", True, None),
        ("alice+newsletter@gmail.com", True, None),
        ("user+tag@mail.company.co.uk", True, None),
        ("test_user@sub.domain.example.com", True, None),
        ("a@b.co", True, None),
        ("user%special@domain.net", True, None),

        # Invalid emails
        ("", False, "Email cannot be empty"),
        ("plainaddress", False, "Missing '@' symbol"),
        ("user@@domain.com", False, "Multiple '@' symbols not allowed"),
        ("@domain.com", False, "Local part (before '@') cannot be empty"),
        ("user@", False, "Domain part (after '@') cannot be empty"),
        ("user name@domain.com", False, "Local part contains invalid characters"),
        (".user@domain.com", False, "Local part cannot start or end with a dot"),
        ("user.@domain.com", False, "Local part cannot start or end with a dot"),
        ("user..name@domain.com", False, "Local part cannot contain consecutive dots"),
        ("user@domain", False, "Domain must have at least one dot (e.g., example.com)"),
        ("user@.domain.com", False, "Domain cannot start or end with a dot"),
        ("user@domain..com", False, "Domain cannot contain consecutive dots"),
        ("user@-domain.com", False, "Domain cannot start or end with a hyphen"),
        ("user@domain.c", False, "Top-level domain must be at least 2 characters"),
        ("user@domain.123", False, "Top-level domain must contain only letters"),
    ]

    print("Email Validation Tests")
    print("=" * 70)

    passed = 0
    failed = 0

    for email, expected_valid, expected_reason in test_cases:
        is_valid, reason = validate_email(email)

        if is_valid == expected_valid and (expected_reason is None or reason == expected_reason):
            passed += 1
            status = "✓ PASS"
        else:
            failed += 1
            status = "✗ FAIL"

        print(f"{status}: '{email}'")
        print(f"       Result: valid={is_valid}, reason={reason}")
        if status == "✗ FAIL":
            print(f"       Expected: valid={expected_valid}, reason={expected_reason}")
        print()

    print("=" * 70)
    print(f"Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")
```

This version provides detailed validation with specific error messages. Key features:

**Validation checks performed:**

1. Empty email detection
2. Missing or multiple `@` symbols
3. Empty local or domain parts
4. Invalid characters in local part (allows `+` for plus addressing)
5. Dots at start/end or consecutive dots in local part
6. Invalid characters in domain
7. Hyphens at start/end of domain
8. Consecutive dots in domain
9. Missing TLD separator
10. TLD length and format validation

**Handles the requested cases:**

- Plus addressing: `user+tag@gmail.com` ✓
- Subdomains: `user@mail.company.co.uk` ✓
- Clear rejection reasons for all invalid formats

## Prompt:

1/27/2026, 8:53:13 PM

V3: You are a senior Python engineer reviewing an email validation utility.
Task:
Create a Python function that validates email addresses using a regular expression.
Constraints:

- Must support plus addressing (user+tag@domain.com)
- Must support multiple subdomains (user@a.b.c.com)
- Must reject:
  - missing '@'
  - consecutive dots
  - invalid TLDs
- Do NOT attempt full RFC compliance; prioritize practical correctness
  Output format:

1. The Python function with clear docstring
2. A table or list of test cases with expected results
3. A brief explanation of the regex design decisions
   Before writing the code, briefly analyze:

- Inputs and outputs
- Edge cases
- Regex strategy

## Response:

1/27/2026, 8:53:53 PM

## Analysis

**Inputs and outputs:**

- Input: A string that may or may not be a valid email address
- Output: A `ValidationResult` dataclass containing `is_valid` (bool), `reason` (str or None), and `matched_parts` (dict or None with local, domain, tld when valid)

**Edge cases to handle:**

- Empty strings and whitespace
- Multiple `@` symbols
- Plus addressing (`user+tag@domain.com`)
- Deep subdomains (`a.b.c.d.example.com`)
- Dots at boundaries or consecutive (`..`, `.@`, `@.`)
- Hyphens at domain boundaries
- Very short or numeric TLDs
- Unicode/special characters

**Regex strategy:**
Rather than one monolithic pattern, I'll use a primary regex for structure matching combined with targeted validation for specific rules. This improves readability and allows precise error messages.

---

```python
import re
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of email validation with detailed feedback."""
    is_valid: bool
    reason: str | None
    matched_parts: dict | None = None


def validate_email(email: str) -> ValidationResult:
    """
    Validate an email address for practical correctness.

    Supports:
        - Plus addressing (user+tag@domain.com)
        - Multiple subdomains (user@a.b.c.example.com)
        - Common valid characters in local part

    Rejects:
        - Missing or multiple '@' symbols
        - Consecutive dots anywhere
        - Invalid TLDs (must be 2+ alphabetic characters)
        - Leading/trailing dots or hyphens in wrong places

    Args:
        email: The email address string to validate.

    Returns:
        ValidationResult with is_valid flag, reason (if invalid),
        and matched_parts dict (if valid) containing local, domain, tld.

    Example:
        >>> result = validate_email("user+news@mail.example.com")
        >>> result.is_valid
        True
        >>> result.matched_parts
        {'local': 'user+news', 'domain': 'mail.example.com', 'tld': 'com'}
    """
    # Preliminary checks before regex
    if not email or not email.strip():
        return ValidationResult(False, "Email cannot be empty or whitespace")

    email = email.strip()

    if ' ' in email:
        return ValidationResult(False, "Email cannot contain spaces")

    if '..' in email:
        return ValidationResult(False, "Consecutive dots are not allowed")

    at_count = email.count('@')
    if at_count == 0:
        return ValidationResult(False, "Missing '@' symbol")
    if at_count > 1:
        return ValidationResult(False, "Multiple '@' symbols are not allowed")

    # Main structural regex
    # Local: alphanumeric, dots, underscores, percent, plus, hyphen (no leading/trailing dots)
    # Domain: alphanumeric segments separated by dots, ending in 2+ letter TLD
    pattern = r'''
        ^
        (?P<local>
            [a-zA-Z0-9_%+-]          # First char: not a dot
            (?:[a-zA-Z0-9._%+-]*     # Middle: allowed chars including dots
               [a-zA-Z0-9_%+-])?     # Last char: not a dot (optional for single-char local)
        )
        @
        (?P<domain>
            (?:[a-zA-Z0-9]           # Subdomain start: alphanumeric
               (?:[a-zA-Z0-9-]*      # Subdomain middle: alphanumeric or hyphen
                  [a-zA-Z0-9])?      # Subdomain end: alphanumeric
               \.                    # Dot separator
            )*                       # Zero or more subdomains
            [a-zA-Z0-9]              # Final domain segment start
            (?:[a-zA-Z0-9-]*         # Final domain segment middle
               [a-zA-Z0-9])?         # Final domain segment end
            \.                       # Dot before TLD
            (?P<tld>[a-zA-Z]{2,})    # TLD: 2+ letters only
        )
        $
    '''

    match = re.match(pattern, email, re.VERBOSE)

    if not match:
        return _diagnose_failure(email)

    return ValidationResult(
        is_valid=True,
        reason=None,
        matched_parts={
            'local': match.group('local'),
            'domain': match.group('domain'),
            'tld': match.group('tld')
        }
    )


def _diagnose_failure(email: str) -> ValidationResult:
    """Provide specific error message when main regex fails."""
    local, domain = email.split('@')

    # Local part checks
    if not local:
        return ValidationResult(False, "Local part (before '@') cannot be empty")

    if local.startswith('.') or local.endswith('.'):
        return ValidationResult(False, "Local part cannot start or end with a dot")

    if not re.match(r'^[a-zA-Z0-9._%+-]+$', local):
        return ValidationResult(False, "Local part contains invalid characters")

    # Domain checks
    if not domain:
        return ValidationResult(False, "Domain part (after '@') cannot be empty")

    if domain.startswith('.') or domain.endswith('.'):
        return ValidationResult(False, "Domain cannot start or end with a dot")

    if domain.startswith('-') or domain.endswith('-'):
        return ValidationResult(False, "Domain cannot start or end with a hyphen")

    parts = domain.split('.')

    if len(parts) < 2:
        return ValidationResult(False, "Domain must include a TLD (e.g., .com)")

    tld = parts[-1]
    if len(tld) < 2:
        return ValidationResult(False, "TLD must be at least 2 characters")

    if not tld.isalpha():
        return ValidationResult(False, "TLD must contain only letters")

    for part in parts[:-1]:
        if part.startswith('-') or part.endswith('-'):
            return ValidationResult(False, f"Domain segment '{part}' cannot start or end with hyphen")
        if not re.match(r'^[a-zA-Z0-9-]+$', part):
            return ValidationResult(False, f"Domain segment '{part}' contains invalid characters")

    return ValidationResult(False, "Invalid email format")
```

---

## Test Cases

| Email                       | Valid | Reason                     |
| --------------------------- | ----- | -------------------------- |
| `user@example.com`          | ✓     | Standard format            |
| `user+tag@gmail.com`        | ✓     | Plus addressing            |
| `a@b.co`                    | ✓     | Minimal valid email        |
| `user@mail.sub.example.com` | ✓     | Multiple subdomains        |
| `first.last@company.org`    | ✓     | Dots in local part         |
| `user%special@domain.net`   | ✓     | Percent encoding           |
| `test_user@a.b.c.d.co.uk`   | ✓     | Deep subdomains            |
| ` `                         | ✗     | Empty or whitespace        |
| `plainaddress`              | ✗     | Missing '@'                |
| `user@@domain.com`          | ✗     | Multiple '@'               |
| `@domain.com`               | ✗     | Empty local part           |
| `user@`                     | ✗     | Empty domain               |
| `.user@domain.com`          | ✗     | Leading dot in local       |
| `user.@domain.com`          | ✗     | Trailing dot in local      |
| `user..name@domain.com`     | ✗     | Consecutive dots           |
| `user@domain`               | ✗     | No TLD                     |
| `user@.domain.com`          | ✗     | Leading dot in domain      |
| `user@-domain.com`          | ✗     | Leading hyphen in domain   |
| `user@domain-.com`          | ✗     | Trailing hyphen in segment |
| `user@domain.c`             | ✗     | TLD too short              |
| `user@domain.123`           | ✗     | Numeric TLD                |
| `user name@domain.com`      | ✗     | Space in email             |

```python
if __name__ == "__main__":
    test_cases = [
        # (email, expected_valid, description)
        ("user@example.com", True, "Standard format"),
        ("user+tag@gmail.com", True, "Plus addressing"),
        ("a@b.co", True, "Minimal valid email"),
        ("user@mail.sub.example.com", True, "Multiple subdomains"),
        ("first.last@company.org", True, "Dots in local part"),
        ("user%special@domain.net", True, "Percent in local"),
        ("test_user@a.b.c.d.co.uk", True, "Deep subdomains"),
        ("", False, "Empty string"),
        ("   ", False, "Whitespace only"),
        ("plainaddress", False, "Missing @"),
        ("user@@domain.com", False, "Multiple @"),
        ("@domain.com", False, "Empty local part"),
        ("user@", False, "Empty domain"),
        (".user@domain.com", False, "Leading dot in local"),
        ("user.@domain.com", False, "Trailing dot in local"),
        ("user..name@domain.com", False, "Consecutive dots"),
        ("user@domain", False, "No TLD"),
        ("user@.domain.com", False, "Leading dot in domain"),
        ("user@-domain.com", False, "Leading hyphen"),
        ("user@domain-.com", False, "Trailing hyphen in segment"),
        ("user@domain.c", False, "TLD too short"),
        ("user@domain.123", False, "Numeric TLD"),
        ("user name@domain.com", False, "Contains space"),
    ]

    print("Email Validation Test Suite")
    print("=" * 75)

    passed = failed = 0

    for email, expected, description in test_cases:
        result = validate_email(email)
        success = result.is_valid == expected

        if success:
            passed += 1
            icon = "✓"
        else:
            failed += 1
            icon = "✗"

        display_email = f"'{email}'" if email else "(empty)"
        print(f"{icon} {display_email:<35} | {description}")

        if not success:
            print(f"  Expected valid={expected}, got valid={result.is_valid}")
        elif not result.is_valid:
            print(f"  → {result.reason}")

    print("=" * 75)
    print(f"Results: {passed} passed, {failed} failed")
```

---

## Regex Design Decisions

1. **Verbose mode (`re.VERBOSE`)**: The pattern uses Python's verbose flag for readability, allowing comments and whitespace. This makes the regex maintainable.

2. **Named groups**: Using `(?P<local>...)`, `(?P<domain>...)`, and `(?P<tld>...)` extracts components for the result object, making the output immediately useful.

3. **Local part strategy**: Allows `[a-zA-Z0-9_%+-]` characters with dots in the middle only. The pattern enforces no leading/trailing dots by requiring non-dot characters at boundaries.

4. **Domain segment handling**: Each subdomain segment must start and end with alphanumeric characters, with hyphens allowed only in the middle. This matches real DNS rules.

5. **TLD validation**: Requires exactly 2+ alphabetic characters (`[a-zA-Z]{2,}`). This rejects numeric TLDs and single-letter TLDs while accepting all real TLDs.

6. **Two-phase validation**: The main regex handles structure; the `_diagnose_failure` function provides specific error messages. This separation keeps the regex focused while still giving users actionable feedback.

7. **Pre-checks for common errors**: Checking for consecutive dots and `@` count before the regex runs allows clearer error messages for these frequent mistakes.

---
