"""FastAPI entry point. Run locally with: uvicorn app.main:app --reload"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import properties

app = FastAPI(title="White Lotus - Property Showcase API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties.router)


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
