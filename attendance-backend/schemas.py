from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: Optional[str] = None
    register_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    password: str
    role: str


class UserResponse(BaseModel):
    id: int
    name: str
    role: str
    department: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[str] = None
    register_number: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    phone: Optional[str] = None
    photo_path: Optional[str] = None
    faculty_role: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


class StudentCreate(BaseModel):
    name: str
    register_number: str
    year: str
    section: str
    department: str = "CSE"
    date_of_birth: str
    phone: Optional[str] = None
    password: Optional[str] = None


class StudentResponse(BaseModel):
    id: int
    user_id: int
    name: str
    register_number: str
    year: Optional[str]
    section: Optional[str]
    department: Optional[str]
    is_face_registered: bool
    photo_path: Optional[str] = None

    class Config:
        from_attributes = True


class FacultyCreate(BaseModel):
    name: str
    email: str
    password: str
    department: str = "CSE"
    designation: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None


class FacultyRoleAssign(BaseModel):
    role: str
    year: str
    section: Optional[str] = None


class SubjectCreate(BaseModel):
    name: str
    code: str
    faculty_id: int
    class_name: str
    year: str
    section: str
    time_slot: str


class AttendanceRecordItem(BaseModel):
    student_id: int
    status: str


class AttendanceSaveRequest(BaseModel):
    subject_id: int
    date: Optional[date] = None
    records: List[AttendanceRecordItem]


class AttendanceSendRequest(BaseModel):
    session_id: int
    signature: str
    coordinator_id: int


class AttendanceUpdateRequest(BaseModel):
    records: List[AttendanceRecordItem]
    signature: str


class ScanResponse(BaseModel):
    session_draft_id: Optional[int] = None
    students: List[dict]
    present_count: int
    absent_count: int
    total: int
    face_detected: bool
