# Smart Face Recognition Attendance System

Production-ready college attendance app with three portals: **HOD**, **Faculty**, and **Student**.

## Project Structure

```
Face Recognition Attendance System/
├── database/                 # PostgreSQL SQL scripts
├── attendance-backend/       # FastAPI + face_recognition
└── attendance-system/        # Expo React Native app
```

## Prerequisites

- PostgreSQL 16
- Python 3.11
- Node.js 18+
- Android phone + PC on **same WiFi**

## Step 1 — Database

1. Update password in `attendance-backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/attendance_db
   ```

2. Create database and tables:
   ```powershell
   psql -U postgres -f database/01_create_database.sql
   psql -U postgres -d attendance_db -f database/02_create_tables.sql
   ```

## Step 2 — Backend

```powershell
cd attendance-backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python seed.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> **Face AI:** Install core deps with `pip install -r requirements-core.txt` (uses OpenCV fallback on Windows). For full `face_recognition` accuracy, install Visual C++ Build Tools and run `pip install face_recognition==1.3.0` after dlib builds successfully.

API docs: `http://YOUR_LAN_IP:8000/docs`

## Step 3 — Frontend

1. Find your PC IPv4: `ipconfig` (WiFi adapter)
2. Edit `attendance-system/services/api.ts` — set `BASE_URL` to `http://YOUR_IP:8000`
3. Install and run:

```powershell
cd attendance-system
npm install
npx expo start
```

Scan QR with Expo Go on your phone.

## Test Credentials

| Role    | Login                    | Password   |
|---------|--------------------------|------------|
| HOD     | hod@college.edu          | admin123   |
| Faculty | ravi@college.edu         | admin123   |
| Student | 21CS045                  | 01/01/2003 (DOB) |

## Face Registration Flow

1. HOD/Faculty → Add Student → capture front-camera selfie
2. Face encoding saved to `uploads/faces/{register_number}.jpg`
3. Faculty → Class Detail → Scan Classroom → AI marks present/absent

## Windows Firewall

Allow inbound TCP port **8000** for mobile access.

## EAS Build

```powershell
cd attendance-system
eas build -p android --profile preview
```

Account: `dharankumar_cs`
