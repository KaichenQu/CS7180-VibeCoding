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