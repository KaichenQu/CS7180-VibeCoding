# V1

```bash
(kelsonpythonenv) kelsonqu@KelsondeMacBook-Pro HW1 % /opt/homebrew/anaconda3/envs/kelsonpythonenv/bin
/python /Users/kelsonqu/Desktop/HW1/email.py
Email Validation Tests

---

✓ 'user@example.com' -> True (expected True)
✓ 'john.doe@company.org' -> True (expected True)
✓ 'alice+tag@mail.co.uk' -> True (expected True)
✓ 'name123@test-domain.net' -> True (expected True)
✓ 'invalid-email' -> False (expected False)
✓ 'missing@domain' -> False (expected False)
✓ '@nodomain.com' -> False (expected False)
✓ 'spaces in@email.com' -> False (expected False)
✓ 'double@@at.com' -> False (expected False)
✓ '' -> False (expected False)
```

---

# V2

```bash
(kelsonpythonenv) kelsonqu@KelsondeMacBook-Pro HW1 % /opt/homebrew/anaconda3/envs/kelsonpythonenv/bin
/python /Users/kelsonqu/Desktop/HW1/email.py
Email Validation Tests
======================================================================
✓ PASS: 'user@example.com'
Result: valid=True, reason=None

✓ PASS: 'john.doe@company.org'
Result: valid=True, reason=None

✓ PASS: 'alice+newsletter@gmail.com'
Result: valid=True, reason=None

✓ PASS: 'user+tag@mail.company.co.uk'
Result: valid=True, reason=None

✓ PASS: 'test_user@sub.domain.example.com'
Result: valid=True, reason=None

✓ PASS: 'a@b.co'
Result: valid=True, reason=None

✓ PASS: 'user%special@domain.net'
Result: valid=True, reason=None

✓ PASS: ''
Result: valid=False, reason=Email cannot be empty

✓ PASS: 'plainaddress'
Result: valid=False, reason=Missing '@' symbol

✓ PASS: 'user@@domain.com'
Result: valid=False, reason=Multiple '@' symbols not allowed

✓ PASS: '@domain.com'
Result: valid=False, reason=Local part (before '@') cannot be empty

✓ PASS: 'user@'
Result: valid=False, reason=Domain part (after '@') cannot be empty

✓ PASS: 'user name@domain.com'
Result: valid=False, reason=Local part contains invalid characters

✓ PASS: '.user@domain.com'
Result: valid=False, reason=Local part cannot start or end with a dot

✓ PASS: 'user.@domain.com'
Result: valid=False, reason=Local part cannot start or end with a dot

✓ PASS: 'user..name@domain.com'
Result: valid=False, reason=Local part cannot contain consecutive dots

✓ PASS: 'user@domain'
Result: valid=False, reason=Domain must have at least one dot (e.g., example.com)

✓ PASS: 'user@.domain.com'
Result: valid=False, reason=Domain cannot start or end with a dot

✓ PASS: 'user@domain..com'
Result: valid=False, reason=Domain cannot contain consecutive dots

✓ PASS: 'user@-domain.com'
Result: valid=False, reason=Domain cannot start or end with a hyphen

✓ PASS: 'user@domain.c'
Result: valid=False, reason=Top-level domain must be at least 2 characters

✓ PASS: 'user@domain.123'
Result: valid=False, reason=Top-level domain must contain only letters

======================================================================
Results: 22 passed, 0 failed out of 22 tests
```

---

# V3

```bash
(kelsonpythonenv) kelsonqu@KelsondeMacBook-Pro HW1 % /opt/homebrew/anaconda3/envs/kelsonpythonenv/bin
/python /Users/kelsonqu/Desktop/HW1/email.py
Email Validation Test Suite
===========================================================================
✓ 'user@example.com' | Standard format
✓ 'user+tag@gmail.com' | Plus addressing
✓ 'a@b.co' | Minimal valid email
✓ 'user@mail.sub.example.com' | Multiple subdomains
✓ 'first.last@company.org' | Dots in local part
✓ 'user%special@domain.net' | Percent in local
✓ 'test_user@a.b.c.d.co.uk' | Deep subdomains
✓ (empty) | Empty string
→ Email cannot be empty or whitespace
✓ ' ' | Whitespace only
→ Email cannot be empty or whitespace
✓ 'plainaddress' | Missing @
→ Missing '@' symbol
✓ 'user@@domain.com' | Multiple @
→ Multiple '@' symbols are not allowed
✓ '@domain.com' | Empty local part
→ Local part (before '@') cannot be empty
✓ 'user@' | Empty domain
→ Domain part (after '@') cannot be empty
✓ '.user@domain.com' | Leading dot in local
→ Local part cannot start or end with a dot
✓ 'user.@domain.com' | Trailing dot in local
→ Local part cannot start or end with a dot
✓ 'user..name@domain.com' | Consecutive dots
→ Consecutive dots are not allowed
✓ 'user@domain' | No TLD
→ Domain must include a TLD (e.g., .com)
✓ 'user@.domain.com' | Leading dot in domain
→ Domain cannot start or end with a dot
✓ 'user@-domain.com' | Leading hyphen
→ Domain cannot start or end with a hyphen
✓ 'user@domain-.com' | Trailing hyphen in segment
→ Domain segment 'domain-' cannot start or end with hyphen
✓ 'user@domain.c' | TLD too short
→ TLD must be at least 2 characters
✓ 'user@domain.123' | Numeric TLD
→ TLD must contain only letters
✓ 'user name@domain.com' | Contains space
→ Email cannot contain spaces
===========================================================================
Results: 23 passed, 0 failed
```
