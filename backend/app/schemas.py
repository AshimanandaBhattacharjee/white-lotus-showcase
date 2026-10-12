"""Request/response shapes (Pydantic). Validation lives here, so bad input is
rejected with a 422 before it reaches the database."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

# Strip leading/trailing spaces on every string, so "   " fails min_length=1.
_strict = ConfigDict(str_strip_whitespace=True)


class PropertyIn(BaseModel):
    """Body for creating or fully updating a property."""

    model_config = _strict

    name: str = Field(min_length=1, max_length=120)
    location: str = Field(min_length=1, max_length=120)
    price: int = Field(gt=0, le=10**12, description="Whole rupees")
    size_sqft: int = Field(gt=0, le=1_000_000)
    bedrooms: int = Field(ge=0, le=50)
    bathrooms: int = Field(ge=0, le=50)
    description: str = Field(min_length=10, max_length=5000)
    image_url: HttpUrl

    @field_validator("image_url")
    @classmethod
    def _url_max_length(cls, v: HttpUrl) -> HttpUrl:
        if len(str(v)) > 500:
            raise ValueError("URL must be 500 characters or fewer")
        return v


class PropertyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    location: str
    price: int
    size_sqft: int
    bedrooms: int
    bathrooms: int
    description: str
    image_url: str
    created_at: datetime
    updated_at: datetime
