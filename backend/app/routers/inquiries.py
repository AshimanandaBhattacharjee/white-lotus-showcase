"""Buyer inquiries: public submit, admin-only list."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import Inquiry, Property
from app.schemas import InquiryIn, InquiryOut

router = APIRouter(tags=["inquiries"])


@router.post(
    "/api/properties/{property_id}/inquiries",
    response_model=InquiryOut,
    status_code=status.HTTP_201_CREATED,
)
def create_inquiry(property_id: int, body: InquiryIn, db: Session = Depends(get_db)):
    """Public. The property comes from the URL, not the body, so a buyer can't
    attach an inquiry to a different listing than the page they're on."""
    prop = db.get(Property, property_id)
    if prop is None:
        raise HTTPException(status_code=404, detail="Property not found")
    inquiry = Inquiry(property_id=prop.id, **body.model_dump())
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return _to_out(inquiry, prop.name)


@router.get(
    "/api/inquiries",
    response_model=list[InquiryOut],
    dependencies=[Depends(require_admin)],
)
def list_inquiries(
    property_id: int | None = Query(None, description="Only inquiries for this property"),
    db: Session = Depends(get_db),
):
    """Admin. Newest first, with the property name joined in. LEFT JOIN so
    inquiries whose listing was deleted still show up."""
    query = (
        select(Inquiry, Property.name)
        .join(Property, Inquiry.property_id == Property.id, isouter=True)
        .order_by(Inquiry.created_at.desc(), Inquiry.id.desc())
    )
    if property_id is not None:
        query = query.where(Inquiry.property_id == property_id)
    return [_to_out(inq, prop_name) for inq, prop_name in db.execute(query).all()]


def _to_out(inquiry: Inquiry, property_name: str | None) -> InquiryOut:
    return InquiryOut(
        id=inquiry.id,
        property_id=inquiry.property_id,
        property_name=property_name,
        name=inquiry.name,
        email=inquiry.email,
        phone=inquiry.phone,
        message=inquiry.message,
        created_at=inquiry.created_at,
    )
