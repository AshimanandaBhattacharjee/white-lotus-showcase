"""/api/properties: list, read, create, update, delete."""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
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


@router.get("", response_model=list[PropertyOut])
def list_properties(db: Session = Depends(get_db)):
    return db.scalars(select(Property).order_by(Property.created_at.desc())).all()


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
