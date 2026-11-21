from typing import Literal, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    username: str
    display_name: str
    email: Optional[str] = None
    role: Optional[str] = "member"
    avatar_color: Optional[str] = "#f97316"
    preferred_language: Optional[str] = "cs"
    preferred_theme: Optional[str] = "system"

class UserCreate(UserBase):
    role: Literal["admin", "member"] = "member"
    password: str = Field(..., min_length=12)

class UserUpdate(BaseModel):
    username: Optional[str] = None
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
    must_change_password: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    # Volitelné pro nativní klienty; web používá httpOnly cookies.
    refresh_token: Optional[str] = None
    csrf_token: Optional[str] = None
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class VerifyPasswordRequest(BaseModel):
    password: str


class RefreshRequest(BaseModel):
    # Volitelné pro nativní klienty; web používá httpOnly cookie.
    refresh_token: Optional[str] = None

class PublicMember(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: Optional[str] = "#f97316"
    role: str

    class Config:
        from_attributes = True

