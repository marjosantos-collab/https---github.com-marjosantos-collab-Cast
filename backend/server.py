from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
from datetime import datetime, timezone, timedelta, date as date_cls
from typing import Annotated, List, Literal, Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import AliasChoices, BaseModel, BeforeValidator, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware
from email_service import notify_new_booking

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()
api = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

JWT_ALGORITHM = "HS256"
TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"]
SERVICES = ["passaporte", "visto-americano", "renovacao-visto", "familia"]
SERVICE_LABELS = {
    "passaporte": "Passaporte Brasileiro",
    "visto-americano": "Visto Americano",
    "renovacao-visto": "Renovação de Visto",
    "familia": "Assessoria Familiar",
}

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, validation_alias=AliasChoices("_id", "id"))

    @classmethod
    def from_mongo(cls, doc: dict):
        return cls.model_validate(doc)

    def to_mongo(self) -> dict:
        return self.model_dump(exclude={"id"}, exclude_none=True)


# ---------- Models ----------
class BookingIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=8, max_length=30)
    service: Literal["passaporte", "visto-americano", "renovacao-visto", "familia"]
    date: str
    time: str
    notes: Optional[str] = Field(default="", max_length=1000)


class Booking(BaseDocument, BookingIn):
    status: str = "pendente"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(default="", max_length=30)
    subject: str = Field(min_length=2, max_length=160)
    message: str = Field(min_length=5, max_length=3000)


class Contact(BaseDocument, ContactIn):
    status: str = "novo"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class BookingStatusIn(BaseModel):
    status: Literal["pendente", "confirmado", "concluido", "cancelado"]


class ContactStatusIn(BaseModel):
    status: Literal["novo", "respondido", "arquivado"]


# ---------- Auth helpers ----------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())


def create_token(user_id: str, email: str, kind: str, delta: timedelta) -> str:
    payload = {"sub": user_id, "email": email, "type": kind, "exp": datetime.now(timezone.utc) + delta}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    access = create_token(user_id, email, "access", timedelta(minutes=15))
    refresh = create_token(user_id, email, "refresh", timedelta(days=7))
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Não autenticado")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")
    if payload.get("type") != "access":
        raise HTTPException(401, "Token inválido")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(401, "Usuário não encontrado")
    return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name"), "role": user.get("role")}


def public_user(u: dict) -> dict:
    return {"id": str(u["_id"]), "email": u["email"], "name": u.get("name"), "role": u.get("role")}


# ---------- Auth routes ----------
@api.post("/auth/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower()
    ip = request.client.host if request.client else "unknown"
    ident = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": ident})
    now = datetime.now(timezone.utc)
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = datetime.fromisoformat(attempt["last"]) + timedelta(minutes=15)
        if now < locked_until:
            raise HTTPException(429, "Muitas tentativas. Tente novamente em 15 minutos.")
        await db.login_attempts.delete_one({"identifier": ident})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": ident}, {"$inc": {"count": 1}, "$set": {"last": now.isoformat()}}, upsert=True
        )
        raise HTTPException(401, "E-mail ou senha inválidos")
    await db.login_attempts.delete_one({"identifier": ident})
    set_auth_cookies(response, str(user["_id"]), user["email"])
    return public_user(user)


@api.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(401, "Não autenticado")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Token inválido")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(401, "Usuário não encontrado")
    set_auth_cookies(response, str(user["_id"]), user["email"])
    return public_user(user)


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/", secure=True, samesite="none")
    response.delete_cookie("refresh_token", path="/", secure=True, samesite="none")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------- Public routes ----------
@api.get("/")
async def root():
    return {"message": "Cast Assessoria API"}


@api.get("/bookings/availability")
async def availability(date: str):
    try:
        date_cls.fromisoformat(date)
    except ValueError:
        raise HTTPException(400, "Data inválida")
    taken = await db.bookings.find(
        {"date": date, "status": {"$ne": "cancelado"}}, {"time": 1, "_id": 0}
    ).to_list(100)
    taken_set = {t["time"] for t in taken}
    return {"date": date, "slots": [{"time": s, "available": s not in taken_set} for s in TIME_SLOTS]}


@api.post("/bookings", response_model=Booking)
async def create_booking(body: BookingIn, background: BackgroundTasks):
    try:
        d = date_cls.fromisoformat(body.date)
    except ValueError:
        raise HTTPException(400, "Data inválida")
    if d <= datetime.now(timezone.utc).date() or d.weekday() >= 5:
        raise HTTPException(400, "Escolha um dia útil a partir de amanhã")
    if body.time not in TIME_SLOTS:
        raise HTTPException(400, "Horário inválido")
    if await db.bookings.find_one({"date": body.date, "time": body.time, "status": {"$ne": "cancelado"}}):
        raise HTTPException(409, "Este horário acabou de ser reservado. Escolha outro.")
    booking = Booking(**body.model_dump())
    res = await db.bookings.insert_one(booking.to_mongo())
    booking.id = str(res.inserted_id)
    background.add_task(notify_new_booking, booking.model_dump(), SERVICE_LABELS[booking.service])
    return booking


@api.post("/contacts", response_model=Contact)
async def create_contact(body: ContactIn):
    contact = Contact(**body.model_dump())
    res = await db.contacts.insert_one(contact.to_mongo())
    contact.id = str(res.inserted_id)
    return contact


# ---------- Admin routes ----------
@api.get("/admin/bookings", response_model=List[Booking])
async def list_bookings(_: dict = Depends(get_current_user)):
    docs = await db.bookings.find().sort("created_at", -1).to_list(1000)
    return [Booking.from_mongo(d) for d in docs]


@api.patch("/admin/bookings/{bid}", response_model=Booking)
async def update_booking(bid: str, body: BookingStatusIn, _: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(bid):
        raise HTTPException(404, "Agendamento não encontrado")
    doc = await db.bookings.find_one_and_update(
        {"_id": ObjectId(bid)}, {"$set": {"status": body.status}}, return_document=True
    )
    if not doc:
        raise HTTPException(404, "Agendamento não encontrado")
    return Booking.from_mongo(doc)


@api.delete("/admin/bookings/{bid}")
async def delete_booking(bid: str, _: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(bid):
        raise HTTPException(404, "Agendamento não encontrado")
    await db.bookings.delete_one({"_id": ObjectId(bid)})
    return {"ok": True}


@api.get("/admin/contacts", response_model=List[Contact])
async def list_contacts(_: dict = Depends(get_current_user)):
    docs = await db.contacts.find().sort("created_at", -1).to_list(1000)
    return [Contact.from_mongo(d) for d in docs]


@api.patch("/admin/contacts/{cid}", response_model=Contact)
async def update_contact(cid: str, body: ContactStatusIn, _: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(cid):
        raise HTTPException(404, "Mensagem não encontrada")
    doc = await db.contacts.find_one_and_update(
        {"_id": ObjectId(cid)}, {"$set": {"status": body.status}}, return_document=True
    )
    if not doc:
        raise HTTPException(404, "Mensagem não encontrada")
    return Contact.from_mongo(doc)


@api.delete("/admin/contacts/{cid}")
async def delete_contact(cid: str, _: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(cid):
        raise HTTPException(404, "Mensagem não encontrada")
    await db.contacts.delete_one({"_id": ObjectId(cid)})
    return {"ok": True}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ["CORS_ORIGINS"].split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.bookings.create_index([("date", 1), ("time", 1)])
    email = os.environ["ADMIN_EMAIL"].lower()
    pwd = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "email": email, "password_hash": hash_password(pwd), "name": "Admin",
            "role": "admin", "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(pwd, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(pwd)}})


@app.on_event("shutdown")
async def shutdown():
    client.close()
