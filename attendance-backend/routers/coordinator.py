from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import require_role, get_current_user

router = APIRouter()


@router.get("/coordinator-id")
def get_year_coordinator(
    year: str = "III Year",
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Faculty")),
):
    fr = (
        db.query(models.FacultyRole)
        .filter(
            models.FacultyRole.role == "Year Coordinator",
            models.FacultyRole.year == year,
        )
        .first()
    )
    if not fr:
        raise HTTPException(status_code=404, detail="Year Coordinator not found")
    faculty = db.query(models.User).filter(models.User.id == fr.faculty_id).first()
    return {"coordinator_id": fr.faculty_id, "name": faculty.name if faculty else ""}


def count_statuses(records):
    counts = {"present": 0, "late": 0, "od": 0, "absent": 0}
    for r in records:
        if r.status in counts:
            counts[r.status] += 1
    return counts


def get_coordinator_role(user, db):
    return (
        db.query(models.FacultyRole)
        .filter(
            models.FacultyRole.faculty_id == user.id,
            models.FacultyRole.role == "Year Coordinator",
        )
        .first()
    )


@router.get("/pending")
def pending_sessions(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Faculty")),
):
    fr = get_coordinator_role(current_user, db)
    if not fr:
        raise HTTPException(status_code=403, detail="Year Coordinator role required")

    sessions = (
        db.query(models.AttendanceSession)
        .filter(
            models.AttendanceSession.status == "sent",
            models.AttendanceSession.coordinator_id == current_user.id,
        )
        .order_by(models.AttendanceSession.created_at.desc())
        .all()
    )

    result = []
    for s in sessions:
        subject = db.query(models.Subject).filter(models.Subject.id == s.subject_id).first()
        faculty = db.query(models.User).filter(models.User.id == s.faculty_id).first()
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
            "section": subject.section if subject else "",
            "faculty_name": faculty.name if faculty else "",
            "date": str(s.date),
            "status": s.status,
            "present": counts["present"] + counts["late"],
            "late": counts["late"],
            "od": counts["od"],
            "absent": counts["absent"],
            "total": len(records),
        })
    return result


@router.get("/sections")
def section_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Faculty")),
):
    fr = get_coordinator_role(current_user, db)
    if not fr:
        raise HTTPException(status_code=403, detail="Year Coordinator role required")

    year = fr.year
    sections = ["A", "B", "C", "D"]
    result = []

    for sec in sections:
        students = (
            db.query(models.Student)
            .filter(models.Student.year == year, models.Student.section == sec)
            .all()
        )
        if not students:
            continue

        student_ids = [s.id for s in students]
        records = (
            db.query(models.AttendanceRecord)
            .join(models.AttendanceSession)
            .filter(
                models.AttendanceRecord.student_id.in_(student_ids),
                models.AttendanceSession.status.in_(["saved", "sent", "verified"]),
            )
            .all()
        )

        present = sum(1 for r in records if r.status in ("present", "late"))
        absent = sum(1 for r in records if r.status == "absent")
        od = sum(1 for r in records if r.status == "od")
        late = sum(1 for r in records if r.status == "late")
        total = len(records) if records else len(students)
        pct = round((present / total * 100) if total > 0 else 0, 1)

        advisor_fr = (
            db.query(models.FacultyRole)
            .filter(
                models.FacultyRole.role == "Class Advisor",
                models.FacultyRole.year == year,
                models.FacultyRole.section == sec,
            )
            .first()
        )
        advisor_name = ""
        if advisor_fr:
            advisor = db.query(models.User).filter(models.User.id == advisor_fr.faculty_id).first()
            advisor_name = advisor.name if advisor else ""

        result.append({
            "section": sec,
            "advisor": advisor_name,
            "present": present,
            "absent": absent,
            "od": od,
            "late": late,
            "total_students": len(students),
            "percentage": pct,
        })

    total_present = sum(r["present"] for r in result)
    total_absent = sum(r["absent"] for r in result)
    total_students = sum(r["total_students"] for r in result)

    return {
        "year": year,
        "sections": result,
        "summary": {
            "total_present": total_present,
            "total_absent": total_absent,
            "total_students": total_students,
        },
    }


@router.post("/{session_id}/verify")
def verify_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Faculty")),
):
    fr = get_coordinator_role(current_user, db)
    if not fr:
        raise HTTPException(status_code=403, detail="Year Coordinator role required")

    session = (
        db.query(models.AttendanceSession)
        .filter(models.AttendanceSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    from datetime import datetime
    session.status = "verified"
    session.verified_at = datetime.utcnow()

    subject = db.query(models.Subject).filter(models.Subject.id == session.subject_id).first()
    n = models.Notification(
        user_id=session.faculty_id,
        from_user_id=current_user.id,
        title="Attendance Verified",
        message=f"Your attendance for {subject.name if subject else 'class'} has been verified",
        type="attendance_verified",
        session_id=session.id,
    )
    db.add(n)
    db.commit()

    return {
        "session_id": session.id,
        "status": session.status,
        "verified_at": str(session.verified_at),
    }


@router.get("/history")
def coordinator_history(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("Faculty")),
):
    sessions = (
        db.query(models.AttendanceSession)
        .filter(
            models.AttendanceSession.coordinator_id == current_user.id,
            models.AttendanceSession.status == "verified",
        )
        .order_by(models.AttendanceSession.verified_at.desc())
        .all()
    )

    result = []
    for s in sessions:
        subject = db.query(models.Subject).filter(models.Subject.id == s.subject_id).first()
        faculty = db.query(models.User).filter(models.User.id == s.faculty_id).first()
        result.append({
            "id": s.id,
            "subject_name": subject.name if subject else "",
            "faculty_name": faculty.name if faculty else "",
            "date": str(s.date),
            "verified_at": str(s.verified_at),
        })
    return result
