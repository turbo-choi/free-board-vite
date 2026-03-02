from __future__ import annotations

import asyncio
import hashlib
import time

from app.core.config import settings

_attempts: dict[str, list[float]] = {}
_locked_until: dict[str, float] = {}
_lock = asyncio.Lock()


def build_login_throttle_key(email: str, client_ip: str) -> str:
    raw = f'{email.lower().strip()}|{client_ip.strip() or "unknown"}'
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()


def _compact_attempts(raw: list[float], now: float) -> list[float]:
    window = float(settings.login_attempt_window_seconds)
    return [value for value in raw if (now - value) <= window]


def _enforce_capacity() -> None:
    tracked = len(_attempts) + len(_locked_until)
    if tracked > settings.login_max_tracked_keys:
        _attempts.clear()
        _locked_until.clear()


async def check_login_allowed(key: str) -> int | None:
    now = time.monotonic()
    async with _lock:
        lock_until = _locked_until.get(key)
        if lock_until and lock_until > now:
            return max(1, int(lock_until - now))
        if lock_until and lock_until <= now:
            _locked_until.pop(key, None)

        attempts = _compact_attempts(_attempts.get(key, []), now)
        if attempts:
            _attempts[key] = attempts
        else:
            _attempts.pop(key, None)
    return None


async def record_login_failure(key: str) -> None:
    now = time.monotonic()
    async with _lock:
        attempts = _compact_attempts(_attempts.get(key, []), now)
        attempts.append(now)
        _attempts[key] = attempts

        if len(attempts) >= settings.login_max_attempts:
            _locked_until[key] = now + float(settings.login_lock_seconds)
            _attempts.pop(key, None)
        _enforce_capacity()


async def record_login_success(key: str) -> None:
    async with _lock:
        _attempts.pop(key, None)
        _locked_until.pop(key, None)
