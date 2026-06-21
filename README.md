# Smart Face Recognition Attendance System

```
███████╗ █████╗  ██████╗███████╗
██╔════╝██╔══██╗██╔════╝██╔════╝
█████╗  ███████║██║     █████╗  
██╔══╝  ██╔══██║██║     ██╔══╝  
██║     ██║  ██║╚██████╗███████╗
╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝

 █████╗ ████████╗████████╗███████╗███╗   ██╗██████╗  █████╗ ███╗   ██╗ ██████╗███████╗
██╔══██╗╚══██╔══╝╚══██╔══╝██╔════╝████╗  ██║██╔══██╗██╔══██╗████╗  ██║██╔════╝██╔════╝
███████║   ██║      ██║   █████╗  ██╔██╗ ██║██║  ██║███████║██╔██╗ ██║██║     █████╗  
██╔══██║   ██║      ██║   ██╔══╝  ██║╚██╗██║██║  ██║██╔══██║██║╚██╗██║██║     ██╔══╝  
██║  ██║   ██║      ██║   ███████╗██║ ╚████║██████╔╝██║  ██║██║ ╚████║╚██████╗███████╗
╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝

███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗
██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║
███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║
╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║
███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║
╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝
```
[ PROJECT  ] ──► Smart Face Recognition Attendance System

[ FRONTEND ] ──► React Native · Expo · TypeScript

[ BACKEND  ] ──► Python · FastAPI · PostgreSQL

[ AI/CV    ] ──► OpenCV · face_recognition · NumPy

[ AUTH     ] ──► JWT Tokens · Bcrypt

[ STATUS   ] ──► MOBILE · AI POWERED · ROLE BASED

---

## ◈ WHAT IS THIS?

Smart Face Recognition Attendance System is a full stack mobile application that automates college attendance using AI face recognition. Faculty points the phone camera at the classroom and the system:

- Detects all student faces in the classroom automatically
- Marks Present or Absent using face_recognition library
- Allows manual override — Present, Late, OD, Absent
- Sends attendance to Year Coordinator with digital signature
- Coordinator verifies section-wise attendance
- Students view their own attendance percentage anytime

No manual roll call. No proxy attendance. Just point and scan.

---

## ◈ SYSTEM ARCHITECTURE
┌─────────────────────────────────────────────────────────────────┐

│                    MOBILE APPLICATION                           │

│                                                                 │

│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │

│   │              │   │              │   │              │        │

│   │  HOD         │   │  FACULTY     │   │  STUDENT     │        │

│   │  PORTAL 👤   │   │  PORTAL 👨‍🏫  │   │  PORTAL 🎓   │        │

│   │              │   │              │   │              │        │

│   └──────────────┘   └──────┬───────┘   └──────────────┘        │

│                             │                                   │

│                      ┌──────▼───────┐                           │

│                      │  CAMERA SCAN │                           │

│                      │  📷 + AI     │                           │

│                      └──────┬───────┘                           │

│                             │                                   │

│                      ┌──────▼───────┐                           │

│                      │  ATTENDANCE  │                           │

│                      │  MARKING     │                           │

│                      │  P/L/OD/A    │                           │

│                      └──────┬───────┘                           │

│                             │                                   │

│                      ┌──────▼───────┐                           │

│                      │  SEND TO     │                           │

│                      │  COORDINATOR │                           │

│                      │  ✍️ SIGN     │                           │

│                      └──────┬───────┘                           │

│                             │                                   │

│                      ┌──────▼───────┐                           │

│                      │  VERIFY ✅   │                           │

│                      └─────────────┘                            │

│                                                                 │

│  ┌──────────────────────────────────────────────────────────┐   │

│  │                  API LAYER (Axios + JWT)                 │   │

│  └──────────────────────────────────────────────────────────┘   │

└─────────────────────────────────────────────────────────────────┘

│

▼

┌─────────────────────────────────────────────────────────────────┐

│                    FASTAPI BACKEND                              │

│                                                                 │

│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │

│   │  AUTH        │   │  ATTENDANCE  │   │  REPORTS     │        │

│   │  ROUTER 🔐   │   │  ROUTER 📋   │   │  ROUTER 📊   │        │

│   └──────────────┘   └──────┬───────┘   └──────────────┘        │

│                             │                                   │

│                      ┌──────▼───────┐                           │

│                      │  FACE ENGINE │                           │

│                      │  🤖 OpenCV   │                           │

│                      │  + face_rec  │                           │

│                      └──────┬───────┘                           │

│                             │                                   │

│                      ┌──────▼───────┐                           │

│                      │  PostgreSQL  │                           │

│                      │  DATABASE 🗄️ │                           │

│                      └─────────────┘                            │

└─────────────────────────────────────────────────────────────────┘

---

## ◈ THREE PORTALS
┌─────────────────────────────────────────────────────────────────┐

│  HOD PORTAL 👤                                                  │

│  ─────────────────────────────────────────────────────────────  │

│  Add Faculty · Add Student · Assign Roles                       │

│  View Reports · Export Excel · Manage Classes                   │

└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐

│  FACULTY PORTAL 👨‍🏫                                              │

│  ─────────────────────────────────────────────────────────────  │

│  Scan Classroom → AI Marks Attendance                           │

│  Manual Override → Present / Late / OD / Absent                 │

│  Send to Coordinator with Digital Signature                     │

│  Edit and Resend for Late Arrivals                              │

│  Year Coordinator → Verify Section-wise Attendance             │

└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐

│  STUDENT PORTAL 🎓                                              │

│  ─────────────────────────────────────────────────────────────  │

│  Login with Register Number + Date of Birth                     │

│  View Subject-wise Attendance Percentage                        │

│  View Recent Attendance History                                 │

│  Attendance Warning if Below 75%                                │

└─────────────────────────────────────────────────────────────────┘

---

## ◈ FACE RECOGNITION FLOW
STUDENT REGISTRATION

│

▼

Faculty captures student face photo (front camera)

│

▼

face_recognition generates 128-point encoding

│

▼

Encoding stored as JSON in PostgreSQL

is_face_registered = true ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ATTENDANCE SCANNING

│

▼

Faculty opens camera → classroom photo captured

│

▼

OpenCV preprocesses image

(brightness + contrast auto-adjustment)

│

▼

face_recognition detects all faces in image

│

▼

Each face compared with stored student encodings

Tolerance: 0.5 (strict matching)

│

├──► Match found    → Present ✅

└──► No match       → Absent ❌

│

▼

Faculty reviews list

Manual change: Present / Late / OD / Absent

│

▼

Save → Sign → Send to Coordinator ✅

---

## ◈ ATTENDANCE STATUS SYSTEM
┌──────────────────────────────────────────────────────┐

│  STATUS    │  MEANING              │  COUNTS AS       │

│────────────│───────────────────────│─────────────────│

│  ✅ Present │  Detected by AI scan  │  Present        │

│  🕐 Late   │  Came after scan      │  Present        │

│  📋 OD     │  On Duty / Permission │  Not counted    │

│  ❌ Absent │  Not present          │  Absent         │

└──────────────────────────────────────────────────────┘
Attendance % = (Present + Late) / Total Students × 100

---

## ◈ COORDINATOR VERIFICATION FLOW
Faculty scans attendance

│

▼

Reviews and adjusts statuses manually

│

▼

Types digital signature (CAPITAL LETTERS)

│

▼

Sends to Year Coordinator

│

▼

Coordinator sees section-wise summary

III-A · III-B · III-C with P/A counts

│

▼

Verifies each section ✅

│

▼

Faculty notified — Attendance Verified!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If student comes late after submission:

Faculty → Edit & Resend → Update status

→ Resign → Send updated attendance

→ Send count badge: Updated 2x ✅

---

## ◈ TECH STACK
┌─────────────────────────────────────────────────────────────────┐

│  Layer         │  Technology                                    │

│────────────────│───────────────────────────────────────────────│

│  Frontend      │  React Native, Expo SDK 54, TypeScript        │

│  Navigation    │  Expo Router (file-based)                     │

│  UI            │  Animated API, LinearGradient, SVG            │

│  Camera        │  Expo Camera, Expo Image Picker               │

│  Storage       │  AsyncStorage                                 │

│  HTTP          │  Axios                                        │

│  Backend       │  Python, FastAPI, Uvicorn                     │

│  Database      │  PostgreSQL, SQLAlchemy ORM                   │

│  AI/CV         │  OpenCV, face_recognition, NumPy              │

│  Auth          │  JWT Tokens (24hr), Bcrypt                    │

│  Export        │  openpyxl (Excel reports)                     │

│  Build         │  Expo EAS Build, EAS Update                   │

└─────────────────────────────────────────────────────────────────┘

---

## ◈ PROJECT STRUCTURE
SmartAttendance/

│

├── attendance-backend/

│   ├── main.py              ← FastAPI app + CORS + routers

│   ├── database.py          ← PostgreSQL connection + get_db

│   ├── models.py            ← SQLAlchemy table models

│   ├── schemas.py           ← Pydantic request/response schemas

│   ├── auth.py              ← JWT + Bcrypt + role checker

│   ├── face_engine.py       ← OpenCV + face_recognition engine

│   ├── seed.py              ← Insert test users and data

│   ├── requirements.txt

│   ├── .env

│   └── routers/

│       ├── auth.py          ← Login + get current user

│       ├── students.py      ← Add student + face upload

│       ├── faculty.py       ← Add faculty + assign role

│       ├── attendance.py    ← Scan + save + send + update

│       ├── coordinator.py   ← Pending + verify + sections

│       └── reports.py       ← Department + student + Excel

│

└── attendance-system/

├── app/

│   ├── index.tsx        ← Login screen + animations

│   ├── hod.tsx          ← HOD dashboard

│   ├── faculty.tsx      ← Faculty dashboard + role panels

│   ├── student.tsx      ← Student dashboard

│   ├── class-detail.tsx ← Camera scan + attendance flow

│   ├── add-student.tsx  ← Add student + face capture

│   ├── add-faculty.tsx  ← Add faculty + assign role

│   ├── assign-role.tsx  ← Step-by-step role assignment

│   ├── report.tsx       ← Attendance reports

│   ├── profile.tsx      ← Profile + logout

│   └── (tabs)/

│       ├── index.tsx    ← Home tab

│       └── explore.tsx  ← Explore tab

├── services/

│   ├── api.ts           ← Axios instance + JWT interceptor

│   └── auth.ts          ← Login + logout + get user

└── constants/

└── colors.ts        ← Design system colors

---

## ◈ DATABASE SCHEMA
┌─────────────┐     ┌─────────────────┐     ┌──────────────────────┐

│   users     │     │  faculty_roles  │     │      students        │

│─────────────│     │─────────────────│     │──────────────────────│

│ id          │────►│ faculty_id (FK) │     │ id                   │

│ name        │     │ role            │     │ user_id (FK) ────────┤

│ email       │     │ year            │     │ register_number      │

│ reg_number  │     │ section         │     │ year · section       │

│ dob         │     └─────────────────┘     │ face_encoding (JSON) │

│ password    │                             │ is_face_registered   │

│ role        │     ┌─────────────────┐     └──────────────────────┘

│ department  │     │    subjects     │

└─────────────┘     │─────────────────│     ┌──────────────────────┐

│ id              │     │ attendance_sessions  │

│ name · code     │     │──────────────────────│

│ faculty_id (FK) │────►│ subject_id (FK)      │

│ year · section  │     │ faculty_id (FK)      │

└─────────────────┘     │ date · status        │

│ signature            │

┌─────────────────┐     │ send_count           │

│ attendance_     │     └──────────────────────┘

│ records         │

│─────────────────│

│ session_id (FK) │

│ student_id (FK) │

│ status          │

│ marked_by       │

└─────────────────┘

---

## ◈ API ENDPOINTS
AUTH

POST   /auth/login                   Login for all roles

GET    /auth/me                      Get current user
STUDENTS

GET    /students                     List all students

POST   /students                     Add new student

POST   /students/{id}/upload-face    Register face encoding
FACULTY

GET    /faculty                      List all faculty

POST   /faculty                      Add new faculty

POST   /faculty/{id}/assign-role     Assign coordinator/advisor role

GET    /faculty/{id}/subjects        Get subjects assigned
ATTENDANCE

POST   /attendance/scan              Scan classroom → AI recognition

POST   /attendance/save              Save attendance session

POST   /attendance/send              Send to coordinator with signature

PUT    /attendance/{id}/update       Edit and resend attendance
COORDINATOR

GET    /coordinator/pending          Get pending verifications

GET    /coordinator/sections         Section-wise summary

POST   /coordinator/{id}/verify      Verify attendance
REPORTS

GET    /reports/department           HOD department report

GET    /reports/student/{reg}        Student attendance report

GET    /reports/export/excel         Download Excel report

---

## ◈ SETUP AND RUN

### 1. Clone Repository
```bash
git clone https://github.com/dharankumar/attendance-system.git
cd attendance-system
```

### 2. Backend Setup
```bash
cd attendance-backend
pip install -r requirements.txt
```

Configure `.env`:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/attendance_db

JWT_SECRET=smartattendance_secret_key_2024

JWT_EXPIRE_HOURS=24

UPLOAD_FOLDER=uploads/faces/

Seed database:
```bash
python seed.py
```

Start backend:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd attendance-system
npm install
```

Update IP in `services/api.ts`:
```typescript
# Windows: run ipconfig → find IPv4 Address
# Mac: run ifconfig → find inet under en0
export const BASE_URL = 'http://YOUR_IP:8000';
```

Start app:
```bash
npx expo start
```

Scan QR code with Expo Go on Android phone.

---

## ◈ TEST ACCOUNTS
┌──────────────────────────────────────────────────────┐

│  Role     │  Login             │  Password           │

│───────────│────────────────────│────────────────────│

│  HOD      │  hod@college.edu   │  admin123          │

│  Faculty  │  ravi@college.edu  │  admin123          │

│  Student  │  21CS045           │  01/01/2003        │

└──────────────────────────────────────────────────────┘

---

## ◈ BUILD APK

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build Android APK
eas build -p android --profile preview

# Push updates without rebuild
eas update --message "update description"
```

---

## ◈ IMPORTANT NOTES
WiFi Setup (Required):

✅ Phone and laptop must be on same WiFi network

✅ Backend must run with --host 0.0.0.0

✅ Allow port 8000 in Windows Firewall

✅ Use LAN IP (e.g. 192.168.1.x) not localhost
Face Registration (Required before scan):

✅ Add student → capture face photo

✅ Backend generates 128-point encoding

✅ Stored in database

✅ Now student will be detected in classroom scan
face_recognition on Windows:

✅ Requires Visual Studio Build Tools

✅ pip install face_recognition

✅ Uses dlib under the hood

---

## ◈ AUTHOR
┌──────────────────────────────────────────────────────┐

│                                                      │

│  Dharankumar                                         │

│  B.Tech — AI and Data Science                        │

│                                                      │

│  Project: Smart Face Recognition Attendance System   │

│  Stack:   React Native · FastAPI · PostgreSQL        │

│           OpenCV · face_recognition                  │

│                                                      │

└──────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐

│                                                        │

│   APP FLOW                                             │

│                                                        │

│   LOGIN ──► SCAN ──► MARK ──► SAVE ──► SEND           │

│                        ▲        │         │            │

│                        │ (edit) │         │ (verify)   │

│                        └────────┘         │            │

│                                           ▼            │

│                                   COORDINATOR ✅        │

│                                                        │

└────────────────────────────────────────────────────────┘
A system that scans faces and marks attendance.

Built with React Native · Powered by face_recognition · Secured by JWT
