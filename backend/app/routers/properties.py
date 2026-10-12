"""/api/properties: list, read, create, update, delete."""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Property
from app.schemas import PropertyIn, PropertyOut

router = APIRouter(prefix="/api/properties", tags=["properties"])


def _get_or_404(db: Session, property_id: int) -> Property:
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


# Whitelist of sort options -> ORDER BY clauses. A whitelist means a client can
# never inject arbitrary column names. `id` is a tiebreaker for stable order.
SORTS = {
    "newest": (Property.created_at.desc(), Property.id.desc()),
    "price_asc": (Property.price.asc(), Property.id.asc()),
    "price_desc": (Property.price.desc(), Property.id.desc()),
    "size_desc": (Property.size_sqft.desc(), Property.id.desc()),
}
SortOption = Literal["newest", "price_asc", "price_desc", "size_desc"]


@router.get("", response_model=list[PropertyOut])
def list_properties(
    location: str | None = Query(None, max_length=120, description="Exact location, e.g. Whitefield"),
    min_bedrooms: int | None = Query(None, ge=0),
    min_price: int | None = Query(None, ge=0),
    max_price: int | None = Query(None, ge=0),
    sort: SortOption = "newest",
    db: Session = Depends(get_db),
):
    query = select(Property)
    if location:
        query = query.where(func.lower(Property.location) == location.strip().lower())
    if min_bedrooms is not None:
        query = query.where(Property.bedrooms >= min_bedrooms)
    if min_price is not None:
        query = query.where(Property.price >= min_price)
    if max_price is not None:
        query = query.where(Property.price <= max_price)
    return db.scalars(query.order_by(*SORTS[sort])).all()


@router.get("/locations", response_model=list[str])
def list_locations(db: Session = Depends(get_db)):
    """Distinct locations, used to populate the filter dropdown.
    Declared before /{property_id} so 'locations' isn't parsed as an id.
    Grouped case-insensitively ("Whitefield" and "whitefield" are one entry),
    matching the case-insensitive comparison in the location filter."""
    label = func.min(Property.location)
    query = select(label).group_by(func.lower(Property.location)).order_by(label)
    return db.scalars(query).all()


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, property_id)


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
def create_property(body: PropertyIn, db: Session = Depends(get_db)):
    prop = Property(**body.model_dump(mode="json"))
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.put("/{property_id}", response_model=PropertyOut)
def update_property(property_id: int, body: PropertyIn, db: Session = Depends(get_db)):
    prop = _get_or_404(db, property_id)
    for field, value in body.model_dump(mode="json").items():
        setattr(prop, field, value)
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(property_id: int, db: Session = Depends(get_db)):
    prop = _get_or_404(db, property_id)
    db.delete(prop)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
