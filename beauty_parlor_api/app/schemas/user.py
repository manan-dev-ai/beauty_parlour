from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    name: str
    phone: str
    password: str
    email: Optional[str] = None
    is_admin: Optional[bool] = False

class UserOut(BaseModel):
    id: int
    name: str
    phone: str
    is_admin: bool
    class Config:
        from_attributes = True