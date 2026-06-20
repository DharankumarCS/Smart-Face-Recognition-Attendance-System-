import json
import io
import cv2
import numpy as np
from PIL import Image

USE_FACE_RECOGNITION = False
try:
    import face_recognition
    USE_FACE_RECOGNITION = True
except ImportError:
    pass

_face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def _detect_face_opencv(image_rgb: np.ndarray):
    gray = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2GRAY)
    faces = _face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(60, 60))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    face = image_rgb[y : y + h, x : x + w]
    return face


def _encode_opencv(image_rgb: np.ndarray) -> list:
    face = _detect_face_opencv(image_rgb)
    if face is None:
        raise ValueError(
            "No face detected in the image. "
            "Please use a clear photo with visible face."
        )
    resized = cv2.resize(face, (128, 128))
    gray = cv2.cvtColor(resized, cv2.COLOR_RGB2GRAY)
    vec = gray.astype(np.float32).flatten()
    vec = (vec - vec.mean()) / (vec.std() + 1e-6)
    return vec.tolist()


def encode_face(image_path: str) -> list:
    if USE_FACE_RECOGNITION:
        image = face_recognition.load_image_file(image_path)
        height, width = image.shape[:2]
        if width > 800:
            scale = 800 / width
            image = cv2.resize(
                image, (int(width * scale), int(height * scale))
            )
        encodings = face_recognition.face_encodings(image)
        if not encodings:
            raise ValueError(
                "No face detected in the image. "
                "Please use a clear photo with visible face."
            )
        return encodings[0].tolist()

    image_bgr = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    return _encode_opencv(image_rgb)


def encode_face_from_bytes(image_bytes: bytes) -> list:
    if USE_FACE_RECOGNITION:
        image = Image.open(io.BytesIO(image_bytes))
        image = image.convert("RGB")
        image_array = np.array(image)
        encodings = face_recognition.face_encodings(image_array)
        if not encodings:
            raise ValueError("No face detected in uploaded image.")
        return encodings[0].tolist()

    image = Image.open(io.BytesIO(image_bytes))
    image = image.convert("RGB")
    return _encode_opencv(np.array(image))


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    height, width = image.shape[:2]
    if width > 1200:
        scale = 1200 / width
        image = cv2.resize(
            image, (int(width * scale), int(height * scale))
        )

    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def _match_opencv(processed_rgb: np.ndarray, student_encodings: list) -> list:
    gray = cv2.cvtColor(processed_rgb, cv2.COLOR_RGB2GRAY)
    faces = _face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(50, 50))
    if len(faces) == 0:
        return []

    matched_ids = []
    for x, y, w, h in faces:
        face = processed_rgb[y : y + h, x : x + w]
        resized = cv2.resize(face, (128, 128))
        gray_face = cv2.cvtColor(resized, cv2.COLOR_RGB2GRAY)
        vec = gray_face.astype(np.float32).flatten()
        vec = (vec - vec.mean()) / (vec.std() + 1e-6)

        best_id = None
        best_dist = 999.0
        for student in student_encodings:
            try:
                stored = np.array(student["encoding"], dtype=np.float32)
                dist = np.linalg.norm(stored - vec)
                if dist < best_dist:
                    best_dist = dist
                    best_id = student["student_id"]
            except Exception:
                continue

        if best_id is not None and best_dist < 0.65:
            if best_id not in matched_ids:
                matched_ids.append(best_id)

    return matched_ids


def recognize_faces(image_bytes: bytes, student_encodings: list) -> list:
    processed = preprocess_image(image_bytes)

    if USE_FACE_RECOGNITION:
        face_locations = face_recognition.face_locations(processed, model="hog")
        if not face_locations:
            return []

        detected_encodings = face_recognition.face_encodings(
            processed, face_locations
        )
        matched_ids = []
        for detected_enc in detected_encodings:
            for student in student_encodings:
                try:
                    stored_enc = np.array(student["encoding"])
                    distance = face_recognition.face_distance(
                        [stored_enc], detected_enc
                    )[0]
                    if distance < 0.5:
                        if student["student_id"] not in matched_ids:
                            matched_ids.append(student["student_id"])
                        break
                except Exception:
                    continue
        return matched_ids

    return _match_opencv(processed, student_encodings)
