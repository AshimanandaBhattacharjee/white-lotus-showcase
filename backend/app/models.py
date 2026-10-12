"""Database tables.

Two tables: a property has many inquiries. Price is stored as whole rupees in
a BIGINT, which avoids float rounding and fits values far beyond any listing.
"""
from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Property(Base):
    __tablename__ = "properties"
    __table_args__ = (
        CheckConstraint("price > 0", name="ck_properties_price_positive"),
        CheckConstraint("size_sqft > 0", name="ck_properties_size_positive"),
        CheckConstraint("bedrooms >= 0", name="ck_properties_bedrooms_non_negative"),
        CheckConstraint("bathrooms >= 0", name="ck_properties_bathrooms_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(120), index=True)
    price: Mapped[int] = mapped_column(BigInteger)  # whole INR
    size_sqft: Mapped[int] = mapped_column(Integer)
    bedrooms: Mapped[int] = mapped_column(Integer, index=True)
    bathrooms: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(Text)
    image_url: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    inquiries: Mapped[list["Inquiry"]] = relationship(back_populates="property")


class Inquiry(Base):
    __tablename__ = "inquiries"

    id: Mapped[int] = mapped_column(primary_key=True)
    # SET NULL rather than CASCADE: deleting a listing must not silently
    # destroy sales leads. The admin table shows "listing removed" instead.
    property_id: Mapped[int | None] = mapped_column(
        ForeignKey("properties.id", ondelete="SET NULL"), index=True, nullable=True
    )
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254))
    phone: Mapped[str] = mapped_column(String(20))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    property: Mapped[Property | None] = relationship(back_populates="inquiries")
