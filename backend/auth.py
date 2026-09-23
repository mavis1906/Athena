import hashlib
import secrets

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from pwdlib import PasswordHash

from backend.database import get_db
from backend import models

password_hash = PasswordHash.recommended()

def hash_password(password):
    return password_hash.hash(password)

def verify_password(password, password_hash_value):
    return password_hash.verify(password, password_hash_value)

def create_session_token():
    return secrets.token_urlsafe(32)

def hash_session_token(token):
    return hashlib.sha256(token.encode()).hexdigest()

def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    token = authorization[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

    token_hash = hash_session_token(token)

    session = db.query(models.AuthSession).filter(
        models.AuthSession.token_hash == token_hash
    ).first()

    if not session:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )

    user = db.query(models.User).filter(
        models.User.id == session.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user