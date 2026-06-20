from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine
import models


@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Smart Face Recognition Attendance API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/faces", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from routers import auth, students, faculty, attendance, coordinator, reports, users

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(students.router, prefix="/students", tags=["Students"])
app.include_router(faculty.router, prefix="/faculty", tags=["Faculty"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(coordinator.router, prefix="/coordinator", tags=["Coordinator"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])


@app.get("/")
def root():
    return {"message": "Smart Attendance API Running", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}
