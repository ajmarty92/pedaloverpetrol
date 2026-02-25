from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.core.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "role": role, "type": "access", "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {"sub": subject, "type": "refresh", "exp": expire}
    return jwt.encode(payload, settings.jwt_refresh_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and validate an access token. Raises JWTError on failure."""
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != "access":
        raise JWTError("Token is not an access token")
    return payload


def decode_refresh_token(token: str) -> dict:
    """Decode and validate a refresh token. Raises JWTError on failure."""
    payload = jwt.decode(token, settings.jwt_refresh_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != "refresh":
        raise JWTError("Token is not a refresh token")
    return payload
