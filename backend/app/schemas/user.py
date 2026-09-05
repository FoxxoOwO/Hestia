from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    display_name: str
    email: Optional[str] = None
    role: Optional[str] = "member"
    avatar_color: Optional[str] = "#f97316"
    preferred_language: Optional[str] = "cs"
    preferred_theme: Optional[str] = "system"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    avatar_color: Optional[str] = None
    preferred_language: Optional[str] = None
    preferred_theme: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class PublicMember(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: Optional[str] = "#f97316"
    role: str

    class Config:
        from_attributes = True

