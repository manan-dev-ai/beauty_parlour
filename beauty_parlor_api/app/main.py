import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api.endpoints import users, bookings, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Beauty Parlor Central API")

frontend_origins_env = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
frontend_origins = [o.strip() for o in frontend_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(bookings.router)
app.include_router(bookings.appointment_router)
app.include_router(bookings.settings_router)
app.include_router(bookings.portfolio_router)
app.include_router(bookings.reviews_router)