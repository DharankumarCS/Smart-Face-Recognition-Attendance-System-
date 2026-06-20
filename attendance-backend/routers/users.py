import os
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user

router = APIRouter()
UPLOAD_FOLDER = "uploads/faces/"


@router.put("/{user_id}/photo")
async def update_photo(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role != "HOD":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    filename = f"user_{user_id}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)
    user.photo_path = f"/uploads/faces/{filename}"
    db.commit()
    return {"photo_path": user.photo_path}
