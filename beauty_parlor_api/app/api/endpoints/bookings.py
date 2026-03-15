from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, time
import os
import requests  # Required for Google Places API

from app.db.database import get_db
from app.models import booking as models
from app.schemas import booking as schemas
from app.models.user import User
from app.api.deps import get_current_admin_user 

# --- Services Router ---
router = APIRouter(prefix="/services", tags=["Services Menu"])

@router.post("/", response_model=schemas.ServiceOut)
def create_service(service: schemas.ServiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    new_service = models.Service(**service.model_dump())
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service

@router.get("/", response_model=List[schemas.ServiceOut])
def get_services(db: Session = Depends(get_db)):
    return db.query(models.Service).all()

@router.delete("/{service_id}")
def delete_service(service_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service: raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"message": "Service deleted successfully"}

# --- Appointments Router ---
appointment_router = APIRouter(prefix="/appointments", tags=["Appointments"])

@appointment_router.post("/", response_model=schemas.AppointmentOut)
def create_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    new_appt = models.Appointment(**appointment.model_dump())
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    return new_appt

@appointment_router.get("/", response_model=List[schemas.AppointmentOut])
def get_appointments(db: Session = Depends(get_db)):
    return db.query(models.Appointment).all()

@appointment_router.get("/available-slots", response_model=List[str])
def get_available_slots(date: str, db: Session = Depends(get_db)):
    try: target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError: raise HTTPException(status_code=400, detail="Invalid date format.")

    start_time = time(10, 0)
    end_time = time(20, 0)
    slots = []
    current_dt = datetime.combine(target_date, start_time)
    end_dt = datetime.combine(target_date, end_time)

    while current_dt < end_dt:
        slots.append(current_dt)
        current_dt += timedelta(minutes=30)

    start_of_day = datetime.combine(target_date, time.min)
    end_of_day = datetime.combine(target_date, time.max)
    
    existing_appts = db.query(models.Appointment).filter(models.Appointment.appointment_time >= start_of_day, models.Appointment.appointment_time <= end_of_day).all()
    booked_times = [appt.appointment_time.strftime("%H:%M") for appt in existing_appts]

    available_slots = []
    for slot in slots:
        slot_str = slot.strftime("%H:%M")
        if slot_str not in booked_times:
            available_slots.append(slot_str)
    return available_slots

# --- Site Settings Router ---
settings_router = APIRouter(prefix="/settings", tags=["Site Settings"])

@settings_router.get("/", response_model=schemas.SiteSettingOut)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SiteSetting).first()
    if not settings:
        settings = models.SiteSetting()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@settings_router.put("/", response_model=schemas.SiteSettingOut)
def update_settings(settings_update: schemas.SiteSettingBase, db: Session = Depends(get_db)):
    settings = db.query(models.SiteSetting).first()
    if not settings:
        settings = models.SiteSetting(**settings_update.model_dump())
        db.add(settings)
    else:
        for key, value in settings_update.model_dump().items():
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings

# --- Portfolio Router ---
portfolio_router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@portfolio_router.post("/", response_model=schemas.RecentWorkOut)
def add_work(work: schemas.RecentWorkBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    new_work = models.RecentWork(**work.model_dump())
    db.add(new_work)
    db.commit()
    db.refresh(new_work)
    return new_work

@portfolio_router.get("/", response_model=List[schemas.RecentWorkOut])
def get_works(db: Session = Depends(get_db)):
    return db.query(models.RecentWork).all()

@portfolio_router.delete("/{work_id}")
def delete_work(work_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    work = db.query(models.RecentWork).filter(models.RecentWork.id == work_id).first()
    if not work: raise HTTPException(status_code=404, detail="Work not found")
    db.delete(work)
    db.commit()
    return {"message": "Work deleted"}

# --- AUTOMATED GOOGLE MAPS REVIEWS ---
reviews_router = APIRouter(prefix="/reviews", tags=["Reviews"])

@reviews_router.get("/google")
def get_google_reviews():
    # Read from environment variables for security
    API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
    PLACE_ID = os.getenv("GOOGLE_PLACE_ID", "")

    # FALLBACK: If you haven't added keys yet, send fake data so the frontend doesn't break
    if not API_KEY or not PLACE_ID:
        return [
            {
                "author_name": "Priya Sharma",
                "profile_photo_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
                "rating": 5,
                "text": "Absolutely amazing service! The staff was so professional and the salon is beautiful.",
                "relative_time_description": "2 weeks ago"
            },
            {
                "author_name": "Rohan Patel",
                "profile_photo_url": "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150&auto=format&fit=crop",
                "rating": 5,
                "text": "Best haircut I've had in Ahmedabad. Highly recommend booking in advance!",
                "relative_time_description": "1 month ago"
            },
            {
                "author_name": "Ananya Desai",
                "profile_photo_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop",
                "rating": 4,
                "text": "Great bridal makeup experience. The products used were top notch.",
                "relative_time_description": "3 months ago"
            }
        ]

    # REAL API CALL
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={PLACE_ID}&fields=reviews&key={API_KEY}"
    try:
        response = requests.get(url)
        data = response.json()
        reviews = data.get("result", {}).get("reviews", [])
        
        # Filter: Only return 4 and 5 star reviews
        good_reviews = [r for r in reviews if r.get("rating", 0) >= 4]
        return good_reviews
    except Exception as e:
        print(f"Google API Error: {e}")
        return []