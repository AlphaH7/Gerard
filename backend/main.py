import os
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, MetaData
from databases import Database
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi.middleware.cors import CORSMiddleware
import logging
import aiofiles
from minio import Minio
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, has_collection
from auth import get_current_user_id
from sentence_transformers import SentenceTransformer
from langchain_community.vectorstores import Milvus
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL', "postgresql://postgres:password@db/fastapi_db")
database = Database(DATABASE_URL)
metadata = MetaData()

engine = create_engine(DATABASE_URL)

# Milvus Configuration
MILVUS_HOST = os.getenv('MILVUS_HOST', "milvus")
MILVUS_PORT = os.getenv('MILVUS_PORT', "19530")

logger.info(f"Connecting to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
try:
    connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
    logger.info("Connected to Milvus successfully")
except Exception as e:
    logger.error(f"Failed to connect to Milvus: {e}")
    raise

# MinIO Configuration
MINIO_ADDRESS = os.getenv('MINIO_ADDRESS', "minio:9000")
MINIO_ACCESS_KEY = os.getenv('MINIO_ROOT_USER', "minioadmin")
MINIO_SECRET_KEY = os.getenv('MINIO_ROOT_PASSWORD', "minioadmin")

SECRET_KEY = os.getenv('SECRET_KEY', "secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://alistier.dev"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    logger.info("Connecting to the database...")
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    logger.info("Disconnecting from the database...")
    await database.disconnect()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str

class DocumentCreate(BaseModel):
    document_url: str
    user_id: int

class DocumentRead(BaseModel):
    id: int
    document_url: str
    user_id: int

class CourseCreate(BaseModel):
    course_id: str
    course_name: str
    course_description: str

class CourseRead(BaseModel):
    id: str
    course_id: str
    course_name: str
    course_description: str
    course_lead: int

from sqlalchemy import Table, Column, Integer, String, ForeignKey

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String, unique=True, index=True),
    Column("email", String, unique=True, index=True),
    Column("hashed_password", String),
    Column("role", String, default="user")
)

documents = Table(
    "documents",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("document_url", String),
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("course_id", String, ForeignKey("courses.course_id"))
)

courses = Table(
    "courses",
    metadata,
    Column("id", String, primary_key=True, default=lambda: str(uuid.uuid4())),
    Column("course_id", String, unique=True, index=True),
    Column("course_name", String),
    Column("course_description", String),
    Column("course_lead", Integer, ForeignKey("users.id")),
)

metadata.create_all(engine)

@app.post("/register", response_model=UserRead)
async def register(user: UserCreate):
    query = users.select().where(users.c.email == user.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    query = users.insert().values(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    last_record_id = await database.execute(query)
    return {**user.dict(), "id": last_record_id, "role": "user"}

@app.post("/login", response_model=dict)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    query = users.select().where(users.c.username == form_data.username)
    user = await database.fetch_one(query)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/documents", response_model=DocumentRead)
async def create_document(document: DocumentCreate):
    query = documents.insert().values(document_url=document.document_url, user_id=document.user_id)
    last_record_id = await database.execute(query)
    return {**document.dict(), "id": last_record_id}

@app.get("/documents", response_model=List[DocumentRead])
async def read_documents(skip: int = 0, limit: int = 10):
    query = documents.select().offset(skip).limit(limit)
    return await database.fetch_all(query)

@app.get("/documents/{document_id}", response_model=DocumentRead)
async def read_document(document_id: int):
    query = documents.select().where(documents.c.id == document_id)
    document = await database.fetch_one(query)
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.put("/documents/{document_id}", response_model=DocumentRead)
async def update_document(document_id: int, document: DocumentCreate):
    query = documents.update().where(documents.c.id == document_id).values(document_url=document.document_url, user_id=document.user_id)
    await database.execute(query)
    return {**document.dict(), "id": document_id}

@app.delete("/documents/{document_id}")
async def delete_document(document_id: int):
    query = documents.delete().where(documents.c.id == document_id)
    await database.execute(query)
    return {"detail": "Document deleted"}

@app.post("/upload")
async def upload_file(course_id: str, user_id: int = Depends(get_current_user_id), file: UploadFile = File(...)):
    # Save the file to MinIO
    minio_client = Minio(
        MINIO_ADDRESS,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False
    )
    bucket_name = "documents"
    if not minio_client.bucket_exists(bucket_name):
        minio_client.make_bucket(bucket_name)
    file_location = f"{bucket_name}/documents_uploaded/{file.filename}"
    
    async with aiofiles.open(file.filename, 'wb') as out_file:
        while content := await file.read(1024):  # Read file in chunks
            await out_file.write(content)
    minio_client.fput_object(bucket_name, file.filename, file.filename)
    
    loader = PyPDFLoader(file.filename)
    pages = loader.load_and_split()
    local_embedding_model = "all-MiniLM-L6-v2"
    embeddings = HuggingFaceEmbeddings(model_name=local_embedding_model)
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    docs = text_splitter.split_documents(pages)
    
    # Add course_id to document metadata
    for doc in docs:
        doc.metadata.update({"course_id": course_id})
    
    vector_db = Milvus.from_documents(
        docs,
        embeddings,
        collection_name="documents",
        connection_args={"host": MILVUS_HOST, "port": MILVUS_PORT},
    )
    
    # Store the document record in the database
    query = documents.insert().values(document_url=file_location, user_id=user_id, course_id=course_id)
    last_record_id = await database.execute(query)
    return {"id": last_record_id, "document_url": file_location, "filename": file.filename, "user_id": user_id, "course_id": course_id}

@app.post("/courses", response_model=CourseRead)
async def create_course(course: CourseCreate, user_id: int = Depends(get_current_user_id)):
    query = courses.insert().values(
        course_id=course.course_id,
        course_name=course.course_name,
        course_description=course.course_description,
        course_lead=user_id
    )
    last_record_id = await database.execute(query)
    return {**course.dict(), "id": last_record_id, "course_lead": user_id}

@app.get("/courses", response_model=List[CourseRead])
async def read_courses(skip: int = 0, limit: int = 10):
    query = courses.select().offset(skip).limit(limit)
    return await database.fetch_all(query)

@app.get("/courses/{course_id}", response_model=CourseRead)
async def read_course(course_id: str):
    query = courses.select().where(courses.c.course_id == course_id)
    course = await database.fetch_one(query)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@app.put("/courses/{course_id}", response_model=CourseRead)
async def update_course(course_id: str, course: CourseCreate, user_id: int = Depends(get_current_user_id)):
    query = courses.update().where(courses.c.course_id == course_id).values(
        course_name=course.course_name,
        course_description=course.course_description,
        course_lead=user_id
    )
    await database.execute(query)
    return {**course.dict(), "id": course_id, "course_lead": user_id}

@app.delete("/courses/{course_id}")
async def delete_course(course_id: str):
    query = courses.delete().where(courses.c.course_id == course_id)
    await database.execute(query)
    return {"detail": "Course deleted"}

@app.post("/chat")
async def chat(course_id: str, question: str):
    query = documents.select().where(documents.c.course_id == course_id)
    docs = await database.fetch_all(query)

    if not docs:
        raise HTTPException(status_code=404, detail="No documents found for the specified course")

    # Retrieve the embeddings from Milvus and generate a response
    local_embedding_model = "all-MiniLM-L6-v2"
    embeddings = HuggingFaceEmbeddings(model_name=local_embedding_model)
    
    vector_db = Milvus(
        collection_name="documents",
        connection_args={"host": MILVUS_HOST, "port": MILVUS_PORT}
    )
    
    relevant_docs = vector_db.similarity_search(question, k=5)
    
    response = "Based on your question, here are some insights from the documents:\n"
    for doc in relevant_docs:
        response += f"- {doc.page_content}\n"
    
    return {"response": response}
