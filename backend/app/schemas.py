"""Request/response shapes (Pydantic). Validation lives here, so bad input is
rejected with a 422 before it reaches the database."""
import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, field_validator

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


class InquiryIn(BaseModel):
    """Body a prospective buyer submits from a property page."""

    model_config = _strict

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=1, max_length=20)
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("phone")
    @classmethod
    def _phone_shape(cls, v: str) -> str:
        # Allow "+91 98765-43210" style input but require 7-15 digits overall.
        if not re.fullmatch(r"\+?[\d\s\-()]+", v):
            raise ValueError("Phone may only contain digits, spaces, +, - and brackets")
        digits = re.sub(r"\D", "", v)
        if not 7 <= len(digits) <= 15:
            raise ValueError("Phone must have between 7 and 15 digits")
        return v


class InquiryOut(BaseModel):
    """What the admin dashboard sees. property_name is None if the listing
    was deleted after the inquiry came in."""

    id: int
    property_id: int | None
    property_name: str | None
    name: str
    email: str
    phone: str
    message: str
    created_at: datetime
