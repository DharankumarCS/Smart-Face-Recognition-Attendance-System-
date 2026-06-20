from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import verify_password, create_token, get_current_user, hash_password
from schemas import LoginRequest, TokenResponse, UserResponse

router = APIRouter()


def build_user_response(user: models.User, db: Session) -> dict:
    data = {
        "id": user.id,
        "name": user.name,
        "role": user.role,
        "department": user.department,
        "designation": user.designation,
        "email": user.email,
        "register_number": user.register_number,
        "phone": user.phone,
        "photo_path": user.photo_path,
    }
    if user.role == "Faculty":
        fr = (
            db.query(models.FacultyRole)
            .filter(models.FacultyRole.faculty_id == user.id)
            .first()
        )
        if fr:
            data["faculty_role"] = fr.role
            data["year"] = fr.year
            data["section"] = fr.section
    if user.role == "Student":
        student = (
            db.query(models.Student)
            .filter(models.Student.user_id == user.id)
            .first()
        )
        if student:
            data["year"] = student.year
            data["section"] = student.section
    return data


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    role = credentials.role

    if role in ("HOD", "Faculty"):
        if not credentials.email or not credentials.password:
            raise HTTPException(status_code=400, detail="Email and password required")
        user = (
            db.query(models.User)
            .filter(
                models.User.email == credentials.email,
                models.User.role == role,
                models.User.is_active == True,
            )
            .first()
        )
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials. Please try again.")
    elif role == "Student":
        if not credentials.register_number or not credentials.date_of_birth:
            raise HTTPException(
                status_code=400,
                detail="Register number and date of birth required",
            )
        user = (
            db.query(models.User)
            .filter(
                models.User.register_number == credentials.register_number.upper(),
                models.User.role == "Student",
                models.User.is_active == True,
            )
            .first()
        )
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials. Please try again.")
        dob = credentials.date_of_birth or credentials.password
        if user.date_of_birth != dob and not verify_password(dob, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials. Please try again.")
    else:
        raise HTTPException(status_code=400, detail="Invalid role")

    token = create_token({"user_id": user.id, "role": user.role})
    return {"token": token, "user": build_user_response(user, db)}


@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_user_response(current_user, db)
