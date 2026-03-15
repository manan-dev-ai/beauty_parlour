from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, unique=True, index=True)
    password = Column(String) 
    email = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    appointments = relationship("Appointment", back_populates="customer")