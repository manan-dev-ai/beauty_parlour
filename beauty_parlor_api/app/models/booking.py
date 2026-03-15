from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from typing import Optional
from app.db.database import Base

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    original_price = Column(Float, nullable=True)
    duration_mins = Column(Integer)
    image_url = Column(String, default="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=500&auto=format&fit=crop")
    appointments = relationship("Appointment", back_populates="service")

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    service_id = Column(Integer, ForeignKey("services.id"))
    appointment_time = Column(DateTime)
    status = Column(String, default="scheduled")
    customer = relationship("User", back_populates="appointments")
    service = relationship("Service", back_populates="appointments")

    @property
    def customer_name(self) -> Optional[str]:
        if self.customer is None:
            return None
        return self.customer.name

    @property
    def customer_phone(self) -> Optional[str]:
        if self.customer is None:
            return None
        return self.customer.phone

class SiteSetting(Base):
    __tablename__ = "site_settings"
    id = Column(Integer, primary_key=True, index=True)
    salon_name = Column(String, default="Glow Salon")
    hero_title = Column(String, default="Style Has No Gender, Only Confidence!")
    hero_subtitle = Column(String, default="Step in, relax, and transform because great hair and glowing skin are for everyone.")
    about_text = Column(String, default="Founded with a passion for helping people discover their best look, Glow Salon brings premium beauty services to your neighborhood.")
    phone = Column(String, default="+91 98765 43210")
    email = Column(String, default="hello@glowsalon.com")
    address = Column(String, default="Ground Floor, Premium Mall")
    hero_image_url = Column(String, default="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1974&auto=format&fit=crop")
    about_image_url = Column(String, default="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1974&auto=format&fit=crop")

class RecentWork(Base):
    __tablename__ = "recent_works"
    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String)
    caption = Column(String, nullable=True)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    author_name = Column(String)
    text = Column(String)
    rating = Column(Integer, default=5)