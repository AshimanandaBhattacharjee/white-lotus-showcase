"""FastAPI entry point. Run locally with: uvicorn app.main:app --reload"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import properties

app = FastAPI(title="White Lotus - Property Showcase API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Flatten Pydantic's error list into {"field": "message"} so the frontend
    can show each message under the matching input."""
    errors: dict[str, str] = {}
    for err in exc.errors():
        field = str(err["loc"][-1]) if err["loc"] else "request"
        msg = err["msg"].removeprefix("Value error, ")
        if err["type"].startswith("url_"):
            msg = "Enter a full URL starting with http:// or https://"
        errors.setdefault(field, msg)
    return JSONResponse(
        status_code=422,
        content={"detail": "Please fix the highlighted fields.", "errors": errors},
    )


app.include_router(properties.router)


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
