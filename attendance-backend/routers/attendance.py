import json
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
from auth import require_role, get_current_user
from schemas import AttendanceSaveRequest, AttendanceSendRequest, AttendanceUpdateRequest
import face_engine

router = APIRouter()


def get_students_for_subject(subject: models.Subject, db: Session):
    return (
        db.query(models.Student)
        .join(models.User)
        .filter(
            models.Student.year == subject.year,
            models.Student.section == subject.section,
            models.User.is_active == True,
        )
        .all()
    )


def count_statuses(records):
    counts = {"present": 0, "late": 0, "od": 0, "absent": 0}
    for r in records:
        if r.status in counts:
            counts[r.status] += 1
    return counts


def create_notification(db, user_id, from_id, title, message, ntype, session_id=None):
    n = models.Notification(
        user_id=user_id,
        from_user_id=from_id,
        title=title,
        message=message,
        type=ntype,
        session_id=session_id,
    )
    db.add(n)


@router.post("/scan")
async def scan_attendance(
    image: UploadFile = File(...),
    subject_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Faculty")),
):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    students = get_students_for_subject(subject, db)
    registered = [s for s in students if s.is_face_registered and s.face_encoding]

    image_bytes = await image.read()
    matched_ids = []
    face_detected = False

    if registered:
        encodings = []
        for s in registered:
            try:
                enc = json.loads(s.face_encoding)
                encodings.append({"student_id": s.id, "encoding": enc})
            except Exception:
                continue
        if encodings:
            matched_ids = face_engine.recognize_faces(image_bytes, encodings)
            face_detected = len(matched_ids) > 0 or bool(
                face_recognition_detect(image_bytes)
            )

    result_students = []
    for s in students:
        user = db.query(models.User).filter(models.User.id == s.user_id).first()
        status = "present" if s.id in matched_ids else "absent"
        result_students.append({
            "id": s.id,
            "name": user.name if user else "",
            "register_number": s.register_number,
            "year": s.year,
            "section": s.section,
            "status": status,
        })

    present = sum(1 for x in result_students if x["status"] == "present")
    absent = len(result_students) - present

    if not face_detected and registered:
        return {
            "session_draft_id": None,
            "students": result_students,
            "present_count": present,
            "absent_count": absent,
            "total": len(result_students),
            "face_detected": False,
            "error": "No faces detected in the image",
        }

    return {
        "session_draft_id": None,
        "students": result_students,
        "present_count": present,
        "absent_count": absent,
        "total": len(result_students),
        "face_detected": True if registered else False,
    }


def face_recognition_detect(image_bytes):
    try:
        processed = face_engine.preprocess_image(image_bytes)
        if face_engine.USE_FACE_RECOGNITION:
            import face_recognition
            locs = face_recognition.face_locations(processed, model="hog")
            return len(locs) > 0
        import cv2
        gray = cv2.cvtColor(processed, cv2.COLOR_RGB2GRAY)
        cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        faces = cascade.detectMultiScale(gray, 1.1, 5, minSize=(50, 50))
        return len(faces) > 0
    except Exception:
        return False


@router.post("/save")
def save_attendance(
    data: AttendanceSaveRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Faculty")),
):
    session_date = data.date or date.today()
    session = models.AttendanceSession(
        subject_id=data.subject_id,
        faculty_id=current_user.id,
        date=session_date,
        status="saved",
    )
    db.add(session)
    db.flush()

    for rec in data.records:
        record = models.AttendanceRecord(
            session_id=session.id,
            student_id=rec.student_id,
            status=rec.status,
            marked_by="faculty",
        )
        db.add(record)

    db.commit()
    db.refresh(session)

    records = (
        db.query(models.AttendanceRecord)
        .filter(models.AttendanceRecord.session_id == session.id)
        .all()
    )
    counts = count_statuses(records)

    return {
        "session_id": session.id,
        "status": session.status,
        "present_count": counts["present"] + counts["late"],
        "absent_count": counts["absent"],
        "counts": counts,
    }


@router.post("/send")
def send_attendance(
    data: AttendanceSendRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Faculty")),
):
    session = (
        db.query(models.AttendanceSession)
        .filter(models.AttendanceSession.id == data.session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "sent"
    session.signature = data.signature.upper()
    session.coordinator_id = data.coordinator_id
    session.send_count = (session.send_count or 0) + 1

    subject = db.query(models.Subject).filter(models.Subject.id == session.subject_id).first()
    create_notification(
        db,
        data.coordinator_id,
        current_user.id,
        "New Attendance Submitted",
        f"{current_user.name} submitted {subject.name if subject else 'class'} attendance",
        "attendance_sent",
        session.id,
    )
    db.commit()

    return {
        "session_id": session.id,
        "status": session.status,
        "send_count": session.send_count,
    }


@router.put("/{session_id}/update")
def update_attendance(
    session_id: int,
    data: AttendanceUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Faculty")),
):
    session = (
        db.query(models.AttendanceSession)
        .filter(models.AttendanceSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    for rec in data.records:
        record = (
            db.query(models.AttendanceRecord)
            .filter(
                models.AttendanceRecord.session_id == session_id,
                models.AttendanceRecord.student_id == rec.student_id,
            )
            .first()
        )
        if record:
            record.status = rec.status
            record.marked_by = "faculty"

    session.signature = data.signature.upper()
    session.send_count = (session.send_count or 0) + 1
    session.status = "sent"

    if session.coordinator_id:
        subject = db.query(models.Subject).filter(models.Subject.id == session.subject_id).first()
        create_notification(
            db,
            session.coordinator_id,
            current_user.id,
            "Attendance Updated",
            f"{current_user.name} updated {subject.name if subject else 'class'} attendance",
            "attendance_updated",
            session.id,
        )

    db.commit()

    records = (
        db.query(models.AttendanceRecord)
        .filter(models.AttendanceRecord.session_id == session_id)
        .all()
    )
    return {
        "session_id": session.id,
        "send_count": session.send_count,
        "updated_records": len(records),
    }


@router.get("/sessions")
def list_sessions(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Faculty")),
):
    sessions = (
        db.query(models.AttendanceSession)
        .filter(models.AttendanceSession.faculty_id == current_user.id)
        .order_by(models.AttendanceSession.created_at.desc())
        .all()
    )
    result = []
    for s in sessions:
        subject = db.query(models.Subject).filter(models.Subject.id == s.subject_id).first()
        records = (
            db.query(models.AttendanceRecord)
            .filter(models.AttendanceRecord.session_id == s.id)
            .all()
        )
        counts = count_statuses(records)
        result.append({
            "id": s.id,
            "subject_name": subject.name if subject else "",
            "subject_code": subject.code if subject else "",
            "date": str(s.date),
            "status": s.status,
            "signature": s.signature,
            "send_count": s.send_count,
            "present": counts["present"] + counts["late"],
            "late": counts["late"],
            "od": counts["od"],
            "absent": counts["absent"],
            "total": len(records),
        })
    return result


@router.get("/sessions/{session_id}")
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    session = (
        db.query(models.AttendanceSession)
        .filter(models.AttendanceSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    subject = db.query(models.Subject).filter(models.Subject.id == session.subject_id).first()
    faculty = db.query(models.User).filter(models.User.id == session.faculty_id).first()
    records = (
        db.query(models.AttendanceRecord)
        .filter(models.AttendanceRecord.session_id == session_id)
        .all()
    )

    student_records = []
    for r in records:
        student = db.query(models.Student).filter(models.Student.id == r.student_id).first()
        user = (
            db.query(models.User).filter(models.User.id == student.user_id).first()
            if student
            else None
        )
        student_records.append({
            "student_id": r.student_id,
            "name": user.name if user else "",
            "register_number": student.register_number if student else "",
            "status": r.status,
        })

    counts = count_statuses(records)
    return {
        "id": session.id,
        "subject": {"id": subject.id, "name": subject.name, "code": subject.code} if subject else None,
        "faculty_name": faculty.name if faculty else "",
        "date": str(session.date),
        "status": session.status,
        "signature": session.signature,
        "send_count": session.send_count,
        "coordinator_id": session.coordinator_id,
        "counts": counts,
        "records": student_records,
    }
