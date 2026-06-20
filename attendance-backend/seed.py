"""Seed test data. Password for all users: admin123"""
import bcrypt
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

password = bcrypt.hashpw(b"admin123", bcrypt.gensalt(12)).decode()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)


def run_seed():
    with engine.connect() as conn:
        existing = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
        if existing and existing > 0:
            print("Database already has data. Skipping seed.")
            return

        conn.execute(
            text("""
                INSERT INTO users
                (name, email, password_hash, role, department, designation)
                VALUES (:name, :email, :pwd, :role, :dept, :desig)
            """),
            {
                "name": "Dr. Rajesh Kumar",
                "email": "hod@college.edu",
                "pwd": password,
                "role": "HOD",
                "dept": "CSE",
                "desig": "Head of Department",
            },
        )

        result = conn.execute(
            text("""
                INSERT INTO users
                (name, email, password_hash, role, department, designation)
                VALUES (:name, :email, :pwd, :role, :dept, :desig)
                RETURNING id
            """),
            {
                "name": "Prof. Ravi Kumar",
                "email": "ravi@college.edu",
                "pwd": password,
                "role": "Faculty",
                "dept": "CSE",
                "desig": "Assistant Professor",
            },
        )
        faculty1_id = result.fetchone()[0]

        result = conn.execute(
            text("""
                INSERT INTO users
                (name, email, password_hash, role, department, designation)
                VALUES (:name, :email, :pwd, :role, :dept, :desig)
                RETURNING id
            """),
            {
                "name": "Prof. Priya S",
                "email": "priya@college.edu",
                "pwd": password,
                "role": "Faculty",
                "dept": "CSE",
                "desig": "Assistant Professor",
            },
        )
        faculty2_id = result.fetchone()[0]

        students = [
            ("Arjun S", "21CS045", "01/01/2003"),
            ("Priya R", "21CS046", "02/02/2003"),
            ("Karthik M", "21CS047", "03/03/2003"),
            ("Divya K", "21CS048", "04/04/2003"),
            ("Rahul V", "21CS049", "05/05/2003"),
        ]

        for name, reg, dob in students:
            result = conn.execute(
                text("""
                    INSERT INTO users
                    (name, register_number, date_of_birth,
                     password_hash, role, department)
                    VALUES (:name, :reg, :dob, :pwd, :role, :dept)
                    RETURNING id
                """),
                {
                    "name": name,
                    "reg": reg,
                    "dob": dob,
                    "pwd": password,
                    "role": "Student",
                    "dept": "CSE",
                },
            )
            user_id = result.fetchone()[0]
            conn.execute(
                text("""
                    INSERT INTO students
                    (user_id, register_number, year, section, department)
                    VALUES (:uid, :reg, :year, :sec, :dept)
                """),
                {
                    "uid": user_id,
                    "reg": reg,
                    "year": "III Year",
                    "sec": "B",
                    "dept": "CSE",
                },
            )

        subjects = [
            ("Artificial Intelligence", "CS601", "CSE B", "III Year", "B", "9:00 AM"),
            ("Machine Learning", "CS602", "CSE A", "III Year", "A", "11:00 AM"),
            ("Deep Learning", "CS603", "CSE C", "III Year", "C", "2:00 PM"),
        ]
        for name, code, cls, year, sec, time in subjects:
            conn.execute(
                text("""
                    INSERT INTO subjects
                    (name, code, faculty_id, class_name, year, section, time_slot)
                    VALUES (:name, :code, :fid, :cls, :year, :sec, :time)
                """),
                {
                    "name": name,
                    "code": code,
                    "fid": faculty1_id,
                    "cls": cls,
                    "year": year,
                    "sec": sec,
                    "time": time,
                },
            )

        conn.execute(
            text("""
                INSERT INTO faculty_roles
                (faculty_id, role, year, section)
                VALUES (:fid, :role, :year, :sec)
            """),
            {
                "fid": faculty1_id,
                "role": "Year Coordinator",
                "year": "III Year",
                "sec": "",
            },
        )

        conn.commit()
        print("Test data inserted successfully!")
        print(f"Faculty IDs: {faculty1_id}, {faculty2_id}")


if __name__ == "__main__":
    run_seed()
