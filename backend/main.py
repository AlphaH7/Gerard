import os
import httpx
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from databases import Database
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List, AsyncGenerator
from fastapi.middleware.cors import CORSMiddleware
import logging
import aiofiles
import asyncio
from minio import Minio
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, has_collection
from auth import get_current_user_id
from sentence_transformers import SentenceTransformer
from langchain_community.vectorstores import Milvus
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
import uuid
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_community.llms import LlamaCpp
from langchain_core.callbacks import CallbackManager, StreamingStdOutCallbackHandler
from langchain_core.prompts import PromptTemplate
from fastapi.responses import StreamingResponse
import json
from concurrent.futures import ThreadPoolExecutor


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


DATABASE_URL = os.getenv('DATABASE_URL', "postgresql://postgres:password@db/fastapi_db")
database = Database(DATABASE_URL)
metadata = MetaData()

engine = create_engine(DATABASE_URL)


MILVUS_HOST = os.getenv('MILVUS_HOST', "milvus")
MILVUS_PORT = os.getenv('MILVUS_PORT', "19530")
local_embedding_model = "all-MiniLM-L6-v2"

logger.info(f"Connecting to Milvus at {MILVUS_HOST}:{MILVUS_PORT}")
try:
    connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
    logger.info("Connected to Milvus successfully")
except Exception as e:
    logger.error(f"Failed to connect to Milvus: {e}")
    raise


MINIO_ADDRESS = os.getenv('MINIO_ADDRESS', "minio:9000")
MINIO_ACCESS_KEY = os.getenv('MINIO_ROOT_USER', "minioadmin")
MINIO_SECRET_KEY = os.getenv('MINIO_ROOT_PASSWORD', "minioadmin")
OLLAMA_ENDPOINT = os.getenv('OLLAMA_ENDPOINT', "http://host.docker.internal:11434/api/chat")

SECRET_KEY = os.getenv('SECRET_KEY', "secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

app = FastAPI(root_path="/backend/apis")
executor = ThreadPoolExecutor(max_workers=10)

@app.get("/openapi.json")
async def get_openapi():
    return app.openapi()

origins = [
    "http://localhost:3000",
    "https://alistier.dev"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    course_id: str

class DocumentRead(BaseModel):
    id: int
    document_url: str
    course_id: str
    user_id: int

class CourseCreate(BaseModel):
    course_id: str
    course_name: str
    course_description: str

class CourseRead(BaseModel):
    id: int
    course_id: str
    course_name: str
    course_description: str
    course_lead: int

class ChatRequest(BaseModel):
    course_id: str
    question: str
    message_uuid: str
    chat: List[dict]

class ChatSessionCreate(BaseModel):
    course_id: str
    email: Optional[EmailStr] = None
    name: Optional[str] = None

class ChatSessionRead(BaseModel):
    id: uuid.UUID
    created_date: datetime
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    course_id: str
    chat_heading: Optional[str] = None

class ChatMessageCreate(BaseModel):
    chat_session_id: uuid.UUID
    message: str
    message_sender: str
    message_uuid: uuid.UUID

class ChatMessageRead(BaseModel):
    id: int
    chat_session_id: uuid.UUID
    message: str
    message_sender: str
    message_uuid: uuid.UUID
    created_date: datetime
    rating: Optional[int] = None
    prompt_classification: Optional[str] = None
    topic_classification: Optional[str] = None

class SetChatSessionHeading(BaseModel):
    chat_session_id: uuid.UUID
    chat_heading: str

class CourseTopicCreate(BaseModel):
    course_id: str
    topic_name: str
    topic_description: str

class CourseTopicRead(BaseModel):
    topic_id: int
    course_id: str
    topic_name: str
    topic_description: str

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
    Column("id", Integer, primary_key=True),
    Column("course_id", String, unique=True, index=True),
    Column("course_name", String),
    Column("course_description", String),
    Column("course_lead", Integer, ForeignKey("users.id")),
)

chat_sessions = Table(
    "chat_sessions",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("created_date", DateTime, default=datetime.utcnow),
    Column("email", String, nullable=True),
    Column("name", String, nullable=True),
    Column("course_id", String, ForeignKey("courses.course_id")),
    Column("chat_heading", String, nullable=True),
)

chat_messages = Table(
    "chat_messages",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("chat_session_id", UUID(as_uuid=True), ForeignKey("chat_sessions.id")),
    Column("message", Text),
    Column("message_sender", String, nullable=False),  
    Column("message_uuid", UUID(as_uuid=True), default=uuid.uuid4),
    Column("created_date", DateTime, default=datetime.utcnow),
    Column("rating", Integer, nullable=True),
    Column("prompt_classification", String, nullable=True),
    Column("topic_classification", String, nullable=True),
)

course_topics = Table(
    "course_topics",
    metadata,
    Column("topic_id", Integer, primary_key=True, autoincrement=True),
    Column("course_id", String, ForeignKey("courses.course_id")),
    Column("topic_name", String, nullable=False),
    Column("topic_description", Text, nullable=True),
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
    access_token = create_access_token(data={"sub": user.username, 'subid': user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/documents", response_model=DocumentRead)
async def create_document(document: DocumentCreate):
    query = documents.insert().values(document_url=document.document_url, user_id=document.user_id, course_id=document.course_id)
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
    
    minio_client = Minio(
        MINIO_ADDRESS,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False
    )
    bucket_name = course_id.lower()
    if not minio_client.bucket_exists(bucket_name):
        minio_client.make_bucket(bucket_name)
    file_location = f"{bucket_name}/documents_uploaded/{file.filename}"
    
    async with aiofiles.open(file.filename, 'wb') as out_file:
        while content := await file.read(1024):  
            await out_file.write(content)
    minio_client.fput_object(bucket_name, file.filename, file.filename)
    
    loader = PyPDFLoader(file.filename)
    pages = loader.load_and_split()
    local_embedding_model = "all-MiniLM-L6-v2"
    embeddings = HuggingFaceEmbeddings(model_name=local_embedding_model)
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    docs = text_splitter.split_documents(pages)
    
    
    for doc in docs:
        doc.metadata.update({"course_id": course_id})
    
    vector_db = Milvus.from_documents(
        docs,
        embeddings,
        collection_name=course_id.lower(),
        connection_args={"host": MILVUS_HOST, "port": MILVUS_PORT},
    )
    
    return {"message": "Course Content Updated", "course_id": course_id}

@app.post("/courses", response_model=CourseRead)
async def create_course(course: CourseCreate, user_id: int = Depends(get_current_user_id)):
    print('Course details -',{
        "course_id":course.course_id,
        "course_name":course.course_name,
        "course_description":course.course_description,
        "course_lead":user_id
    })
    query = courses.insert().values(
        course_id=course.course_id,
        course_name=course.course_name,
        course_description=course.course_description,
        course_lead=user_id
    )
    last_record_id = await database.execute(query)
    return {**course.dict(), "id": last_record_id, "course_id":course.course_id, "course_name":course.course_name, "course_description":course.course_description, "course_lead":user_id, "course_lead": user_id}

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

@app.post("/chat_sessions", response_model=ChatSessionRead)
async def create_chat_session(chat_session: ChatSessionCreate):
    chat_session_id = uuid.uuid4()
    query = chat_sessions.insert().values(
        id=chat_session_id,
        email=chat_session.email,
        name=chat_session.name,
        course_id=chat_session.course_id,
        created_date=datetime.utcnow()  
    ).returning(chat_sessions.c.id, chat_sessions.c.created_date, chat_sessions.c.email, chat_sessions.c.name, chat_sessions.c.course_id, chat_sessions.c.chat_heading)
    row = await database.fetch_one(query)
    return row

@app.get("/chat_sessions/{chat_session_id}/messages", response_model=List[ChatMessageRead])
async def get_chat_messages(chat_session_id: uuid.UUID):
    query = chat_messages.select().where(chat_messages.c.chat_session_id == chat_session_id).order_by(chat_messages.c.created_date)
    messages = await database.fetch_all(query)
    return messages

@app.put("/chat_sessions/{chat_session_id}/heading", response_model=ChatSessionRead)
async def set_chat_session_heading(chat_session_id: uuid.UUID, heading: SetChatSessionHeading):
    query = chat_sessions.update().where(chat_sessions.c.id == chat_session_id).values(chat_heading=heading.chat_heading).returning(
        chat_sessions.c.id, chat_sessions.c.created_date, chat_sessions.c.email, chat_sessions.c.name, chat_sessions.c.course_id, chat_sessions.c.chat_heading)
    row = await database.fetch_one(query)
    if not row:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return row

@app.get("/chat_sessions/by_email/{email}", response_model=List[ChatSessionRead])
async def get_chat_sessions_by_email(email: EmailStr):
    query = chat_sessions.select().where(chat_sessions.c.email == email).order_by(chat_sessions.c.created_date)
    sessions = await database.fetch_all(query)
    return sessions

@app.get("/chat_sessions/by_course/{course_id}", response_model=List[ChatSessionRead])
async def get_chat_sessions_by_course(course_id: str):
    query = chat_sessions.select().where(chat_sessions.c.course_id == course_id).order_by(chat_sessions.c.created_date)
    sessions = await database.fetch_all(query)
    return sessions

@app.get("/chat_messages/by_user/{user_id}", response_model=List[ChatMessageRead])
async def get_chat_messages_by_user(user_id: int):
    query = chat_messages.select().join(chat_sessions).where(chat_sessions.c.user_id == user_id).order_by(chat_messages.c.created_date)
    messages = await database.fetch_all(query)
    return messages

@app.get("/chat_messages/by_course/{course_id}", response_model=List[ChatMessageRead])
async def get_chat_messages_by_course(course_id: str):
    query = chat_messages.select().join(chat_sessions).where(chat_sessions.c.course_id == course_id).order_by(chat_messages.c.created_date)
    messages = await database.fetch_all(query)
    return messages

@app.post("/course_topics", response_model=CourseTopicRead)
async def create_course_topic(topic: CourseTopicCreate):
    query = course_topics.insert().values(
        course_id=topic.course_id,
        topic_name=topic.topic_name,
        topic_description=topic.topic_description
    )
    last_record_id = await database.execute(query)
    return {**topic.dict(), "topic_id": last_record_id}

@app.get("/course_topics", response_model=List[CourseTopicRead])
async def read_course_topics(skip: int = 0, limit: int = 10):
    query = course_topics.select().offset(skip).limit(limit)
    return await database.fetch_all(query)

@app.get("/course_topics/{topic_id}", response_model=CourseTopicRead)
async def read_course_topic(topic_id: int):
    query = course_topics.select().where(course_topics.c.topic_id == topic_id)
    topic = await database.fetch_one(query)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic

@app.put("/course_topics/{topic_id}", response_model=CourseTopicRead)
async def update_course_topic(topic_id: int, topic: CourseTopicCreate):
    query = course_topics.update().where(course_topics.c.topic_id == topic_id).values(
        topic_name=topic.topic_name,
        topic_description=topic.topic_description
    )
    await database.execute(query)
    return {**topic.dict(), "topic_id": topic_id}

@app.delete("/course_topics/{topic_id}")
async def delete_course_topic(topic_id: int):
    query = course_topics.delete().where(course_topics.c.topic_id == topic_id)
    await database.execute(query)
    return {"detail": "Topic deleted"}

@app.post("/add_rating")
async def add_rating(message_uuid: uuid.UUID, rating: int):
    if rating < 0 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 0 and 5")
    query = chat_messages.update().where(chat_messages.c.message_uuid == message_uuid).values(rating=rating)
    await database.execute(query)
    return {"detail": "Rating added"}

async def stream_and_save_ollama_model(question: str, chat: List[dict], context: str, chat_session_id: uuid.UUID, message_uuid: str) -> AsyncGenerator[str, None]:
    url = OLLAMA_ENDPOINT
    payload = {
        "model": "llama3",
        "messages": [
            {
                "role": "system",
                "content": f"You are a teaching assistant; If someone asks about yourself or introduces themselves, be encouraging and kind to the student to encourage them to ask and resolve as many questions about the course and introduce yourself. Use only the Course information, to answer the question kindly and encouragingly, stating  - I donot know the answer to that based on the Course information provided. If the answer is not found in the Course or local database; always maintain a polite and supportive tone. The context in relevant to this chat is as follows, plz answer only and only on the basis of this information provided ahead and refuse to contribute to an answer if the answer is not related or present in the ahead presented context/course material - {context}"                
            }
        ] + chat + [
            {
                "role": "user",
                "content": question
            }
        ],
    }

    headers = {
        "Content-Type": "application/json"
    }

    logger.info( payload)

    response_chunks = []

    timeout = httpx.Timeout(3600.0, read=3600.0, connect=3600.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            async with client.stream("POST", url, json=payload, headers=headers) as response:                
                if response.status_code != 200:
                    detail = await response.text()
                    logger.error(f"Received non-200 response: {response.status_code}, detail: {detail}")
                    raise HTTPException(status_code=response.status_code, detail=detail)
                async for chunk in response.aiter_text():
                    logger.info(f"Received chunk: {chunk}")
                    try:
                        chunk_data = json.loads(chunk)
                        if 'message' in chunk_data:
                            response_chunks.append(chunk_data['message']['content'])
                            yield chunk
                    except json.JSONDecodeError as e:
                        logger.error(f"JSON decode error: {e} - Chunk: {chunk}")
                        continue  

            ai_response = ''.join(response_chunks)
            ai_message_query = chat_messages.insert().values(
                chat_session_id=chat_session_id,
                message=ai_response,
                message_sender='RAG',
                created_date=datetime.utcnow(),
                message_uuid=message_uuid
            )
            await database.execute(ai_message_query)

        except httpx.ConnectError as e:
            logger.error(f"Connection error: {e}")
            raise HTTPException(status_code=502, detail="Failed to connect to the Ollama server.")
        except httpx.ReadTimeout as e:
            logger.error(f"Read timeout error: {e}")
            raise HTTPException(status_code=504, detail="Read timeout from the Ollama server.")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")
        

async def classifyPrompt(question: str, course_id: str, chat_session_id: str, msguuid: str):
    query = course_topics.select().where(course_topics.c.course_id == course_id)
    topics = await database.fetch_all(query)
    
    logger.info(f"Course topics for course_id {course_id}: {topics}")
    
    system_message = """
    Classify the provided text into one or more of these classes. Make sure to follow the format given below. Here are the available topics:

    """
    for topic in topics:
        system_message += f"{topic.topic_name}: {topic.topic_description}\n"
    system_message += "Other: Anything that doesn't fit into the other categories.\n\n"
    
    system_message += """Additionally, classify the provided text into one or more of these types. Make sure to follow the format given below. Here are the available types:

    Conceptual Understanding: Definition and Explanation, Theoretical Questions
    Practical Implementation: How-to Guides, Examples and Use Cases
    Analytical: Comparison and Contrast, Advantages and Disadvantages
    Problem-Solving: Debugging Help, Optimization
    Application: Project Ideas, Integration
    Contextual Understanding: Historical Context, Ethical and Societal Impact
    Evaluation and Critique: Critical Analysis, Reviews and Feedback
    Resource Requests: Reference Materials, Tool Recommendations
    Other: Anything that doesn't fit into the other categories.

    Please follow these strict guidelines:
    1. Only use the topic names and types provided above.
    2. Respond strictly in the format: PromptTopic //// PromptClassification
    3. If it doesn't fit in any topic or type, return only: Other
    4. Do not include any additional text or explanation.
    5. Make sure to return exactly one line of text with the topic names separated by a comma.
    6. Please make sure to strictly follow the format in the response: PromptTopic: One of the topics listed //// PromptClassification : Prompt types given (use only the name, not the text after :)
    6. AT ANY POINT IF YOU DONOT KNOW WHAT TO REPLY JUST REPLY: Other //// Other

    Examples:
    - For a text about creating Python lists and adding elements, you will respond with: Python Lists, Practical Implementation: How-to Guides //// Practical Implementation
    - For a text that doesn't fit any provided topic, you will respond with: Other
    - Answer strictly in the format and maintaining only the topics and types given, or for any other non classifiable prompt or text just return: Other 
    """
    
    logger.info(f"Constructed system message: {system_message}")

    prompt_messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": f"{topics[0].topic_description}"},
        {"role": "assistant", "content": f"{topics[0].topic_name} //// Conceptual Understanding, Analytical"},
        {"role": "user", "content": f"{topics[0].topic_description} and {topics[1].topic_description}"},
        {"role": "assistant", "content": f"{topics[0].topic_name}, {topics[1].topic_name} //// Conceptual Understanding, Analytical"},
        {"role": "user", "content": f"{topics[1].topic_description}"},
        {"role": "assistant", "content": f"{topics[1].topic_name} //// Resource Requests, Application"},
        {"role": "user", "content": question}
    ]
    
    payload = {
        "model": "llama3.1",
        "messages": prompt_messages,
        "stream": False
    }

    headers = {
        "Content-Type": "application/json"
    }

    timeout = httpx.Timeout(30.0, read=30.0, connect=30.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(OLLAMA_ENDPOINT, json=payload, headers=headers)
            if response.status_code != 200:
                detail = response.text
                logger.error(f"Received non-200 response: {response.status_code}, detail: {detail}")
                raise HTTPException(status_code=response.status_code, detail=detail)
            
            response_data = response.json()
            classification = response_data['message']['content']
            
            logger.info(f"Classification result: {classification}")

            user_message_query = chat_messages.insert().values(
                chat_session_id=chat_session_id,
                message=question,
                message_sender='USER',
                created_date=datetime.utcnow(),
                message_uuid=msguuid,
                topic_classification=classification
            )
            await database.execute(user_message_query)
            logger.info(f"Saved prompt to DB: {classification}")

        except httpx.RequestError as exc:
            logger.error(f"An error occurred while requesting {exc.request.url!r}.")
            raise HTTPException(status_code=500, detail="Error communicating with the classification service.")
        except httpx.HTTPStatusError as exc:
            logger.error(f"Error response {exc.response.status_code} while requesting {exc.request.url!r}.")
            raise HTTPException(status_code=exc.response.status_code, detail=exc.response.text)

# Updated classifyTopic function to be async
async def classifyTopic(question: str, course_id: str, chat_session_id: str, msguuid: str):
    await classifyPrompt(question, course_id, chat_session_id, msguuid)

@app.post("/chat")
async def chat(request: ChatRequest, chat_session_id: uuid.UUID):
    course_id = request.course_id
    chat = request.chat
    question = request.question
    msguuid = request.message_uuid

    # Run classifyTopic asynchronously to avoid blocking
    asyncio.create_task(classifyTopic(question, course_id, chat_session_id, msguuid))
    
    embeddings = HuggingFaceEmbeddings(model_name=local_embedding_model)
    vector_db = Milvus(
        embeddings,
        collection_name=course_id.lower(),
        connection_args={"host": MILVUS_HOST, "port": MILVUS_PORT}
    )

    relevant_docs = vector_db.similarity_search(question, k=5)

    context = ""
    for doc in relevant_docs:
        context += f"- {doc.page_content}\n"

    return StreamingResponse(stream_and_save_ollama_model(question, chat, context, chat_session_id, msguuid), media_type="text/plain")


async def stream_and_save_ollama_model_garchat(question: str, context: str, chat_session_id: uuid.UUID, message_uuid: str) -> AsyncGenerator[str, None]:
    url = OLLAMA_ENDPOINT
    payload = {
        "model": "llama3",
        "messages": [
            {
                "role": "system",
                "content": f"You are a teaching assistant; If someone asks about yourself or introduces themselves, be encouraging and kind to the student to encourage them to ask and resolve as many questions about the course and introduce yourself. Use only the Course information, to answer the question kindly and encouragingly, stating  - I donot know the answer to that based on the Course information provided. If the answer is not found in the Course or local database; always maintain a polite and supportive tone. The context in relevant to this chat is as follows, plz answer only and only on the basis of this information provided ahead and refuse to contribute to an answer if the answer is not related or present in the ahead presented context/course material - {context}"                
            }
        ] + chat + [
            {
                "role": "user",
                "content": question
            }
        ],
    }

    headers = {
        "Content-Type": "application/json"
    }

    logger.info( payload)

    response_chunks = []

    timeout = httpx.Timeout(3600.0, read=3600.0, connect=3600.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            async with client.stream("POST", url, json=payload, headers=headers) as response:                
                if response.status_code != 200:
                    detail = await response.text()
                    logger.error(f"Received non-200 response: {response.status_code}, detail: {detail}")
                    raise HTTPException(status_code=response.status_code, detail=detail)
                async for chunk in response.aiter_text():
                    logger.info(f"Received chunk: {chunk}")
                    try:
                        chunk_data = json.loads(chunk)
                        if 'message' in chunk_data:
                            response_chunks.append(chunk_data['message']['content'])
                            yield chunk
                    except json.JSONDecodeError as e:
                        logger.error(f"JSON decode error: {e} - Chunk: {chunk}")
                        continue  

            ai_response = ''.join(response_chunks)
            ai_message_query = chat_messages.insert().values(
                chat_session_id=chat_session_id,
                message=ai_response,
                message_sender='RAG',
                created_date=datetime.utcnow(),
                message_uuid=message_uuid
            )
            await database.execute(ai_message_query)

        except httpx.ConnectError as e:
            logger.error(f"Connection error: {e}")
            raise HTTPException(status_code=502, detail="Failed to connect to the Ollama server.")
        except httpx.ReadTimeout as e:
            logger.error(f"Read timeout error: {e}")
            raise HTTPException(status_code=504, detail="Read timeout from the Ollama server.")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/garchat")
async def garchat(request: ChatRequest, chat_session_id: uuid.UUID):
    course_id = request.course_id
    chat = request.chat
    question = request.question
    msguuid = request.message_uuid

    # Run classifyTopic asynchronously to avoid blocking
    asyncio.create_task(classifyTopic(question, course_id, chat_session_id, msguuid))
    
    embeddings = HuggingFaceEmbeddings(model_name=local_embedding_model)
    vector_db = Milvus(
        embeddings,
        collection_name=course_id.lower(),
        connection_args={"host": MILVUS_HOST, "port": MILVUS_PORT}
    )

    relevant_docs = vector_db.similarity_search(question, k=5)

    context = ""
    for doc in relevant_docs:
        context += f"- {doc.page_content}\n"

    return StreamingResponse(stream_and_save_ollama_model_garchat(question, chat, context, chat_session_id, msguuid), media_type="text/plain")

