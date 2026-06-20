from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True)
    register_number = Column(String(20), unique=True)
    date_of_birth = Column(String(20))
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    department = Column(String(50), default="CSE")
    designation = Column(String(50))
    phone = Column(String(15))
    photo_path = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    student_profile = relationship("Student", back_populates="user", uselist=False)
    faculty_roles = relationship("FacultyRole", back_populates="faculty")
    subjects = relationship("Subject", back_populates="faculty")


class FacultyRole(Base):
    __tablename__ = "faculty_roles"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    role = Column(String(30))
    year = Column(String(20))
    section = Column(String(5))
    assigned_at = Column(DateTime, server_default=func.now())

    faculty = relationship("User", back_populates="faculty_roles")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    register_number = Column(String(20), unique=True, nullable=False)
    year = Column(String(20))
    section = Column(String(5))
    department = Column(String(50))
    face_encoding = Column(Text)
    photo_path = Column(String(255))
    is_face_registered = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="student_profile")
    attendance_records = relationship("AttendanceRecord", back_populates="student")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    faculty_id = Column(Integer, ForeignKey("users.id"))
    class_name = Column(String(20))
    year = Column(String(20))
    section = Column(String(5))
    time_slot = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())

    faculty = relationship("User", back_populates="subjects")
    sessions = relationship("AttendanceSession", back_populates="subject")


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    faculty_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, server_default=func.current_date())
    status = Column(String(20), default="draft")
    signature = Column(String(100))
    send_count = Column(Integer, default=0)
    coordinator_id = Column(Integer, ForeignKey("users.id"))
    verified_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    subject = relationship("Subject", back_populates="sessions")
    records = relationship(
        "AttendanceRecord",
        back_populates="session",
        cascade="all, delete-orphan",
    )


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("attendance_sessions.id", ondelete="CASCADE"),
    )
    student_id = Column(Integer, ForeignKey("students.id"))
    status = Column(String(10), default="absent")
    marked_by = Column(String(20), default="ai")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    from_user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(100))
    message = Column(Text)
    type = Column(String(30))
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
