"""
Secret hashing utilities — used for both Admin passwords and Customer OTP
codes so neither is ever stored in plain text.

Uses PBKDF2-HMAC-SHA256 (Python's stdlib `hashlib`) with a random
per-secret salt and a high iteration count. This is a NIST-recommended
key-derivation function and needs no extra native/C-extension
dependencies (unlike bcrypt/argon2), which keeps the backend easy to
install in any environment.

Stored format: ``pbkdf2_sha256$<iterations>$<salt_hex>$<hash_hex>``
"""
import hashlib
import hmac
import secrets

_ALGORITHM = "pbkdf2_sha256"
_ITERATIONS = 260_000
_SALT_BYTES = 16


def hash_secret(raw_value: str) -> str:
    """Hash a plain-text secret (password or OTP code) into a salted,
    iterated PBKDF2 digest. Never store `raw_value` itself."""
    salt = secrets.token_hex(_SALT_BYTES)
    digest = _derive(raw_value, salt, _ITERATIONS)
    return f"{_ALGORITHM}${_ITERATIONS}${salt}${digest}"


def verify_secret(raw_value: str, stored_hash: str) -> bool:
    """Verify a plain-text secret against a previously hashed value.

    Uses a constant-time comparison to avoid timing side-channels, and
    fails closed (returns False) on any malformed input rather than
    raising, so callers can treat verification failures uniformly.
    """
    if not raw_value or not stored_hash:
        return False
    try:
        algorithm, iterations_str, salt, expected_digest = stored_hash.split("$")
        iterations = int(iterations_str)
    except (ValueError, AttributeError):
        return False
    if algorithm != _ALGORITHM:
        return False

    candidate_digest = _derive(raw_value, salt, iterations)
    return hmac.compare_digest(candidate_digest, expected_digest)


def _derive(raw_value: str, salt: str, iterations: int) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256", raw_value.encode("utf-8"), salt.encode("utf-8"), iterations
    ).hex()


# Backwards/semantically-clear aliases for call sites that only ever deal
# with passwords (purely cosmetic — same implementation).
hash_password = hash_secret
verify_password = verify_secret
