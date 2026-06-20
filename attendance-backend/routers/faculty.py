from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
from auth import require_role, hash_password, get_current_user
from schemas import FacultyCreate, FacultyRoleAssign, SubjectCreate

router = APIRouter()


@router.get("")
def list_faculty(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("HOD")),
):
    faculty_list = (
        db.query(models.User)
        .filter(models.User.role == "Faculty", models.User.is_active == True)
        .all()
    )
    result = []
    for f in faculty_list:
        fr = (
            db.query(models.FacultyRole)
            .filter(models.FacultyRole.faculty_id == f.id)
            .first()
        )
        result.append({
            "id": f.id,
            "name": f.name,
            "email": f.email,
            "department": f.department,
            "designation": f.designation,
            "phone": f.phone,
            "assigned_role": fr.role if fr else None,
            "year": fr.year if fr else None,
            "section": fr.section if fr else None,
        })
    return result


@router.post("")
def create_faculty(
    data: FacultyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("HOD")),
):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = models.User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="Faculty",
        department=data.department,
        designation=data.designation,
        phone=data.phone,
    )
    db.add(user)
    db.flush()

    if data.role:
        fr = models.FacultyRole(
            faculty_id=user.id,
            role=data.role,
            year=data.year or "",
            section=data.section or "",
        )
        db.add(fr)

    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "department": user.department,
        "designation": user.designation,
        "role": data.role,
    }


@router.post("/subjects")
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("HOD", "Faculty")),
):
    existing = db.query(models.Subject).filter(models.Subject.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject code already exists")

    subject = models.Subject(
        name=data.name,
        code=data.code,
        faculty_id=data.faculty_id,
        class_name=data.class_name,
        year=data.year,
        section=data.section,
        time_slot=data.time_slot,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return {
        "id": subject.id,
        "name": subject.name,
        "code": subject.code,
        "class_name": subject.class_name,
        "year": subject.year,
        "section": subject.section,
        "time_slot": subject.time_slot,
    }


@router.get("/{faculty_id}")
def get_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    faculty = (
        db.query(models.User)
        .filter(models.User.id == faculty_id, models.User.role == "Faculty")
        .first()
    )
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    fr = (
        db.query(models.FacultyRole)
        .filter(models.FacultyRole.faculty_id == faculty_id)
        .first()
    )
    subjects = db.query(models.Subject).filter(models.Subject.faculty_id == faculty_id).all()

    return {
        "id": faculty.id,
        "name": faculty.name,
        "email": faculty.email,
        "department": faculty.department,
        "designation": faculty.designation,
        "phone": faculty.phone,
        "assigned_role": fr.role if fr else None,
        "year": fr.year if fr else None,
        "section": fr.section if fr else None,
        "subjects": [
            {
                "id": s.id,
                "name": s.name,
                "code": s.code,
                "class_name": s.class_name,
                "year": s.year,
                "section": s.section,
                "time_slot": s.time_slot,
            }
            for s in subjects
        ],
    }


@router.post("/{faculty_id}/assign-role")
def assign_role(
    faculty_id: int,
    data: FacultyRoleAssign,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("HOD")),
):
    faculty = db.query(models.User).filter(models.User.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")

    fr = (
        db.query(models.FacultyRole)
        .filter(models.FacultyRole.faculty_id == faculty_id)
        .first()
    )
    if fr:
        fr.role = data.role
        fr.year = data.year
        fr.section = data.section or ""
    else:
        fr = models.FacultyRole(
            faculty_id=faculty_id,
            role=data.role,
            year=data.year,
            section=data.section or "",
        )
        db.add(fr)
    db.commit()
    return {"success": True, "role": data.role, "year": data.year, "section": data.section}


@router.get("/{faculty_id}/subjects")
def get_faculty_subjects(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    subjects = db.query(models.Subject).filter(models.Subject.faculty_id == faculty_id).all()
    result = []
    for s in subjects:
        student_count = (
            db.query(models.Student)
            .filter(
                models.Student.year == s.year,
                models.Student.section == s.section,
            )
            .count()
        )
        result.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "class_name": s.class_name,
            "year": s.year,
            "section": s.section,
            "time_slot": s.time_slot,
            "student_count": student_count,
        })
    return result
