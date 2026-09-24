import os
import uuid
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from backend.database import engine, Base, get_db
from backend import models
from backend.auth import (
    hash_password,
    verify_password,
    create_session_token,
    hash_session_token,
    get_current_user
)
from backend.schemas import (
    UserCreate,
    UserLogin,
    CommentCreate,
    ProblemComplete
)

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://athena-phi-ruddy.vercel.app",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {"message": "Athena API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if user.password != user.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match"
        )

    valid_roles = {
        "Software": ["Machine Learning", "Software Engineer"],
        "Agriculture": ["Farmer", "Agricultural Engineer"],
        "Healthcare": ["Doctor", "Pharmacist"]
    }

    if user.category not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid category"
        )

    if user.role not in valid_roles[user.category]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role for selected category"
        )

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        password_hash=hash_password(user.password),
        category=user.category,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration successful",
        "user_id": new_user.id
    }

@app.post("/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        user.password,
        existing_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_session_token()

    new_session = models.AuthSession(
        user_id=existing_user.id,
        token_hash=hash_session_token(token)
    )

    db.add(new_session)
    db.commit()

    return {
        "message": "Login successful",
        "token": token,
        "user_id": existing_user.id,
        "full_name": existing_user.full_name,
        "email": existing_user.email,
        "category": existing_user.category,
        "role": existing_user.role
    }

@app.get("/auth/me")
def get_me(
    current_user: models.User = Depends(get_current_user)
):
    return {
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "category": current_user.category,
        "role": current_user.role
    }

@app.post("/problems")
async def create_problem(
    title: str = Form(...),
    description: str = Form(...),
    image1: UploadFile = File(...),
    image2: UploadFile | None = File(None),
    image3: UploadFile | None = File(None),
    image4: UploadFile | None = File(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    images = [
        image
        for image in [image1, image2, image3, image4]
        if image is not None
    ]

    new_problem = models.Problem(
        user_id=current_user.id,
        title=title,
        description=description,
        category=current_user.category,
        role=current_user.role,
        status="active"
    )

    db.add(new_problem)
    db.commit()
    db.refresh(new_problem)

    saved_images = []

    for image in images:
        if not image.content_type or not image.content_type.startswith("image/"):
            db.delete(new_problem)
            db.commit()

            raise HTTPException(
                status_code=400,
                detail="Only image files are allowed"
            )

        extension = os.path.splitext(
            image.filename or ""
        )[1].lower()

        if not extension:
            extension = ".jpg"

        filename = f"{uuid.uuid4().hex}{extension}"
        file_path = os.path.join(
            UPLOAD_DIR,
            filename
        )

        contents = await image.read()

        with open(file_path, "wb") as file:
            file.write(contents)

        problem_image = models.ProblemImage(
            problem_id=new_problem.id,
            image_path=file_path
        )

        db.add(problem_image)
        saved_images.append(file_path)

    db.commit()

    return {
        "message": "Problem created successfully",
        "problem_id": new_problem.id,
        "title": new_problem.title,
        "category": new_problem.category,
        "role": new_problem.role,
        "status": new_problem.status,
        "images": saved_images
    }

@app.get("/problems")
def get_problems(db: Session = Depends(get_db)):
    problems = db.query(models.Problem).filter(
        models.Problem.status == "active"
    ).order_by(
        models.Problem.created_at.desc()
    ).all()

    result = []

    for problem in problems:
        result.append({
            "id": problem.id,
            "title": problem.title,
            "description": problem.description,
            "category": problem.category,
            "role": problem.role,
            "status": problem.status,
            "created_at": problem.created_at,
            "creator": {
                "id": problem.owner.id,
                "full_name": problem.owner.full_name
            },
            "images": [
                f"/uploads/{os.path.basename(image.image_path)}"
                for image in problem.images
            ]
        })

    return result

@app.get("/problems/role")
def get_role_problems(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    problems = db.query(models.Problem).filter(
        models.Problem.status == "active",
        models.Problem.category == current_user.category,
        models.Problem.role == current_user.role
    ).order_by(
        models.Problem.created_at.desc()
    ).all()

    result = []

    for problem in problems:
        result.append({
            "id": problem.id,
            "title": problem.title,
            "description": problem.description,
            "category": problem.category,
            "role": problem.role,
            "status": problem.status,
            "created_at": problem.created_at,
            "creator": {
                "id": problem.owner.id,
                "full_name": problem.owner.full_name
            },
            "images": [
                f"/uploads/{os.path.basename(image.image_path)}"
                for image in problem.images
            ]
        })

    return result

@app.get("/problems/solved")
def get_solved_problems(db: Session = Depends(get_db)):
    problems = db.query(models.Problem).filter(
        models.Problem.status == "completed"
    ).order_by(
        models.Problem.completed_at.desc()
    ).all()

    result = []

    for problem in problems:
        result.append({
            "id": problem.id,
            "title": problem.title,
            "description": problem.description,
            "category": problem.category,
            "role": problem.role,
            "status": problem.status,
            "completion_message": problem.completion_message,
            "created_at": problem.created_at,
            "completed_at": problem.completed_at,
            "creator": {
                "id": problem.owner.id,
                "full_name": problem.owner.full_name
            },
            "images": [
                f"/uploads/{os.path.basename(image.image_path)}"
                for image in problem.images
            ]
        })

    return result

@app.get("/problems/{problem_id}")
def get_problem(
    problem_id: int,
    db: Session = Depends(get_db)
):
    problem = db.query(models.Problem).filter(
        models.Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    return {
        "id": problem.id,
        "title": problem.title,
        "description": problem.description,
        "category": problem.category,
        "role": problem.role,
        "status": problem.status,
        "completion_message": problem.completion_message,
        "created_at": problem.created_at,
        "completed_at": problem.completed_at,
        "creator": {
            "id": problem.owner.id,
            "full_name": problem.owner.full_name
        },
        "images": [
            f"/uploads/{os.path.basename(image.image_path)}"
            for image in problem.images
        ],
        "like_count": len(problem.likes),
        "comment_count": len(problem.comments)
    }

@app.get("/problems/{problem_id}/comments")
def get_comments(
    problem_id: int,
    db: Session = Depends(get_db)
):
    problem = db.query(models.Problem).filter(
        models.Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    comments = db.query(models.Comment).filter(
        models.Comment.problem_id == problem_id
    ).order_by(
        models.Comment.created_at.asc()
    ).all()

    return [
        {
            "id": comment.id,
            "content": comment.content,
            "created_at": comment.created_at,
            "user": {
                "id": comment.user.id,
                "full_name": comment.user.full_name
            }
        }
        for comment in comments
    ]

@app.post("/problems/{problem_id}/comments")
def create_comment(
    problem_id: int,
    comment_data: CommentCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    problem = db.query(models.Problem).filter(
        models.Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    new_comment = models.Comment(
        problem_id=problem_id,
        user_id=current_user.id,
        content=comment_data.content
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return {
        "message": "Comment added successfully",
        "comment": {
            "id": new_comment.id,
            "content": new_comment.content,
            "created_at": new_comment.created_at,
            "user": {
                "id": current_user.id,
                "full_name": current_user.full_name
            }
        }
    }

@app.post("/problems/{problem_id}/like")
def toggle_like(
    problem_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    problem = db.query(models.Problem).filter(
        models.Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    existing_like = db.query(models.Like).filter(
        models.Like.user_id == current_user.id,
        models.Like.problem_id == problem_id
    ).first()

    if existing_like:
        db.delete(existing_like)
        db.commit()
        liked = False
    else:
        new_like = models.Like(
            user_id=current_user.id,
            problem_id=problem_id
        )

        db.add(new_like)
        db.commit()

        liked = True

    like_count = db.query(models.Like).filter(
        models.Like.problem_id == problem_id
    ).count()

    return {
        "liked": liked,
        "like_count": like_count
    }

@app.post("/problems/{problem_id}/complete")
def complete_problem(
    problem_id: int,
    completion_data: ProblemComplete,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    problem = db.query(models.Problem).filter(
        models.Problem.id == problem_id
    ).first()

    if not problem:
        raise HTTPException(
            status_code=404,
            detail="Problem not found"
        )

    if problem.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the problem creator can complete this problem"
        )

    if problem.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Problem is already completed"
        )

    problem.status = "completed"
    problem.completion_message = completion_data.completion_message
    problem.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(problem)

    return {
        "message": "Problem marked as completed",
        "problem_id": problem.id,
        "status": problem.status,
        "completion_message": problem.completion_message,
        "completed_at": problem.completed_at
    }