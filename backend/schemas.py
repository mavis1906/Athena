from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    full_name: str = Field(min_length=2)
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)
    category: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

class ProblemCreate(BaseModel):
    title: str = Field(min_length=3)
    description: str = Field(min_length=10)

class CommentCreate(BaseModel):
    content: str = Field(min_length=1)

class ProblemComplete(BaseModel):
    completion_message: str = Field(min_length=1)