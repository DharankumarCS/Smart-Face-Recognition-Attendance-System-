-- Table 1: Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  register_number VARCHAR(20) UNIQUE,
  date_of_birth VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL
    CHECK (role IN ('HOD','Faculty','Student')),
  department VARCHAR(50) DEFAULT 'CSE',
  designation VARCHAR(50),
  phone VARCHAR(15),
  photo_path VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: Faculty roles
CREATE TABLE faculty_roles (
  id SERIAL PRIMARY KEY,
  faculty_id INTEGER REFERENCES users(id)
    ON DELETE CASCADE,
  role VARCHAR(30)
    CHECK (role IN (
      'Class Advisor',
      'Co-Advisor',
      'Year Coordinator'
    )),
  year VARCHAR(20),
  section VARCHAR(5),
  assigned_at TIMESTAMP DEFAULT NOW()
);

-- Table 3: Students
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id)
    ON DELETE CASCADE,
  register_number VARCHAR(20) UNIQUE NOT NULL,
  year VARCHAR(20),
  section VARCHAR(5),
  department VARCHAR(50),
  face_encoding TEXT,
  photo_path VARCHAR(255),
  is_face_registered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 4: Subjects
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  faculty_id INTEGER REFERENCES users(id),
  class_name VARCHAR(20),
  year VARCHAR(20),
  section VARCHAR(5),
  time_slot VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 5: Attendance sessions
CREATE TABLE attendance_sessions (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id),
  faculty_id INTEGER REFERENCES users(id),
  date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN (
      'draft','saved','sent','verified'
    )),
  signature VARCHAR(100),
  send_count INTEGER DEFAULT 0,
  coordinator_id INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 6: Attendance records
CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES attendance_sessions(id)
    ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id),
  status VARCHAR(10) DEFAULT 'absent'
    CHECK (status IN ('present','late','od','absent')),
  marked_by VARCHAR(20) DEFAULT 'ai',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 7: Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id)
    ON DELETE CASCADE,
  from_user_id INTEGER REFERENCES users(id),
  title VARCHAR(100),
  message TEXT,
  type VARCHAR(30),
  session_id INTEGER REFERENCES attendance_sessions(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
