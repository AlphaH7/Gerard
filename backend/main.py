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
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType
from auth import get_current_user_id

# Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL', "postgresql://postgres:password@db/fastapi_db")

database = Database(DATABASE_URL)
metadata = MetaData()

engine = create_engine(DATABASE_URL)

# Milvus Configuration
MILVUS_HOST = os.getenv('MILVUS_HOST', "milvus")
MILVUS_PORT = os.getenv('MILVUS_PORT', "19530")

connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)

# MinIO Configuration
MINIO_ADDRESS = os.getenv('MINIO_ADDRESS', "minio:9000")
MINIO_ACCESS_KEY = os.getenv('MINIO_ROOT_USER', "minioadmin")
MINIO_SECRET_KEY = os.getenv('MINIO_ROOT_PASSWORD', "minioadmin")

SECRET_KEY = os.getenv('SECRET_KEY', "secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()

origins = [
    "http://localhost:3000",
    # "https://ax-frontend-domain.com",
    "https://alistier.dev"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    Column("user_id", Integer, ForeignKey("users.id"))
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

# New endpoint to upload files to MinIO and store vector embeddings in Milvus
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), user_id: int = Depends(get_current_user_id)):
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
    file_location = f"{bucket_name}/{file.filename}"
    async with aiofiles.open(file.filename, 'wb') as out_file:
        while content := await file.read(1024):  # Read file in chunks
            await out_file.write(content)
    minio_client.fput_object(bucket_name, file.filename, file.filename)
    
    # Generate vector embedding (assuming a dummy vector for this example)
    vector = [0.0] * 128  # Replace with actual embedding generation logic
    
    # Store the embedding in Milvus
    collection_name = "documents"
    if not Collection.exists(collection_name):
        fields = [
            FieldSchema(name="file_path", dtype=DataType.VARCHAR, max_length=500),
            FieldSchema(name="user_id", dtype=DataType.INT64),
            FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=128)
        ]
        schema = CollectionSchema(fields, description="Document collection")
        collection = Collection(name=collection_name, schema=schema)
    else:
        collection = Collection(name=collection_name)
    collection.insert([[file_location], [user_id], [vector]])
    
    # Store the document record in the database
    query = documents.insert().values(document_url=file_location, user_id=user_id)
    last_record_id = await database.execute(query)
    return {"id": last_record_id, "document_url": file_location, "filename": file.filename, "user_id": user_id}
