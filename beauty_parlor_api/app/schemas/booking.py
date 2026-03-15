from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ServiceBase(BaseModel):
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    duration_mins: int
    image_url: Optional[str] = "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=500&auto=format&fit=crop"

class ServiceCreate(ServiceBase): pass
class ServiceOut(ServiceBase):
    id: int
    class Config: from_attributes = True

class AppointmentBase(BaseModel):
    customer_id: int
    service_id: int
    appointment_time: datetime

class AppointmentCreate(AppointmentBase):
    pass


class AppointmentOut(AppointmentBase):
    id: int
    status: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

    class Config:
        from_attributes = True

class SiteSettingBase(BaseModel):
    salon_name: str
    hero_title: str
    hero_subtitle: str
    about_text: str
    phone: str
    email: str
    address: str
    hero_image_url: str
    about_image_url: str

class SiteSettingOut(SiteSettingBase):
    id: int
    class Config: from_attributes = True

class RecentWorkBase(BaseModel):
    image_url: str
    caption: Optional[str] = None

class RecentWorkOut(RecentWorkBase):
    id: int
    class Config: from_attributes = True

class ReviewBase(BaseModel):
    author_name: str
    text: str
    rating: int

class ReviewOut(ReviewBase):
    id: int
    class Config: from_attributes = True