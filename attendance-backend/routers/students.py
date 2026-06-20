import json
import os
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import require_role, hash_password, get_current_user
from schemas import StudentCreate
import face_engine

router = APIRouter()
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads/faces/")


def student_to_dict(student: models.Student, db: Session) -> dict:
    user = db.query(models.User).filter(models.User.id == student.user_id).first()
    return {
        "id": student.id,
        "user_id": student.user_id,
        "name": user.name if user else "",
        "register_number": student.register_number,
        "year": student.year,
        "section": student.section,
        "department": student.department,
        "is_face_registered": student.is_face_registered,
        "photo_path": student.photo_path,
        "date_of_birth": user.date_of_birth if user else None,
        "phone": user.phone if user else None,
    }


@router.get("")
def list_students(
    year: Optional[str] = None,
    section: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("HOD", "Faculty")),
):
    query = db.query(models.Student).join(models.User).filter(models.User.is_active == True)
    if year:
        query = query.filter(models.Student.year == year)
    if section:
        query = query.filter(models.Student.section == section)
    if department:
        query = query.filter(models.Student.department == department)
    students = query.all()
    return [student_to_dict(s, db) for s in students]


@router.post("")
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("HOD", "Faculty")),
):
    reg = data.register_number.upper()
    existing = db.query(models.Student).filter(models.Student.register_number == reg).first()
    if existing:
        raise HTTPException(status_code=400, detail="Register number already exists")

    pwd = data.password or data.date_of_birth
    user = models.User(
        name=data.name,
        register_number=reg,
        date_of_birth=data.date_of_birth,
        password_hash=hash_password(pwd),
        role="Student",
        department=data.department,
        phone=data.phone,
    )
    db.add(user)
    db.flush()

    student = models.Student(
        user_id=user.id,
        register_number=reg,
        year=data.year,
        section=data.section,
        department=data.department,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student_to_dict(student, db)


@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student_to_dict(student, db)


@router.post("/{student_id}/upload-face")
async def upload_face(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("HOD", "Faculty")),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    filename = f"{student.register_number}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)

    contents = await file.read()
    try:
        encoding = face_engine.encode_face_from_bytes(contents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    with open(filepath, "wb") as f:
        f.write(contents)

    student.face_encoding = json.dumps(encoding)
    student.photo_path = f"/uploads/faces/{filename}"
    student.is_face_registered = True
    db.commit()

    return {
        "success": True,
        "message": "Face registered successfully",
        "is_face_registered": True,
    }


@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("HOD")),
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    user = db.query(models.User).filter(models.User.id == student.user_id).first()
    if user:
        user.is_active = False
    db.commit()
    return {"success": True, "message": "Student deactivated"}


@router.post("/bulk")
async def bulk_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("HOD", "Faculty")),
):
    """Placeholder for Excel bulk - returns not implemented with friendly message."""
    raise HTTPException(
        status_code=501,
        detail="Bulk upload via Excel is not yet configured. Add students individually.",
    )
