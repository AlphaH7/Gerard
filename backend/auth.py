import os
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.getenv('SECRET_KEY', "secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
async def get_current_user_id(token: str = Depends(oauth2_scheme)):
    # DEVNOTE: This is a placeholder implementation.
    # DEVNOTE: Replace this with your logic to decode the token and extract the user ID.
    user_id = decode_token_and_get_user_id(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return user_id

def decode_token_and_get_user_id(token: str) -> int:
    # DEVNOTE: Placeholder function: Replace with actual token decoding logic.
    # DEVNOTE: For example, decode JWT token and extract user ID.
    return 1  # Example user ID