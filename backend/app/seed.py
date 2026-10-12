"""Sample listings so the app isn't empty on first run.

    python -m app.seed          # inserts only if there are no properties yet
    python -m app.seed --reset  # wipes properties + inquiries, then inserts

Images are Unsplash stock photos (free to use); the frontend shows a
placeholder if any image fails to load.
"""
import sys

from sqlalchemy import delete, func, select

from app.database import SessionLocal
from app.models import Inquiry, Property


def _img(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=1200&q=80"


SAMPLE_PROPERTIES = [
    {
        "name": "The Lakeview Estate",
        "location": "Whitefield",
        "price": 72_500_000,
        "size_sqft": 6200,
        "bedrooms": 5,
        "bathrooms": 6,
        "description": "A five-bedroom villa on a private plot facing Varthur Lake. Double-height living room, "
        "Italian marble throughout, a temperature-controlled pool and a landscaped garden with mature trees.",
        "image_url": _img("1600596542815-ffad4c1539a9"),
    },
    {
        "name": "Palm Court Residence",
        "location": "Whitefield",
        "price": 41_000_000,
        "size_sqft": 3900,
        "bedrooms": 4,
        "bathrooms": 4,
        "description": "A four-bedroom courtyard home built around a central palm garden. Teak joinery, "
        "a chef's kitchen with island seating, and a home office that opens onto the courtyard.",
        "image_url": _img("1600585154340-be6161a56a0c"),
    },
    {
        "name": "Skyline Penthouse",
        "location": "UB City, CBD",
        "price": 125_000_000,
        "size_sqft": 5400,
        "bedrooms": 4,
        "bathrooms": 5,
        "description": "A full-floor penthouse with 270-degree city views, a private elevator lobby, "
        "wraparound terrace with plunge pool and a dedicated staff suite.",
        "image_url": _img("1613490493576-7fde63acd811"),
    },
    {
        "name": "Banyan House",
        "location": "Koramangala",
        "price": 58_000_000,
        "size_sqft": 4800,
        "bedrooms": 4,
        "bathrooms": 5,
        "description": "A contemporary family home on a quiet tree-lined street, minutes from Koramangala's "
        "cafes. Rooftop deck, basement media room and parking for three cars.",
        "image_url": _img("1512917774080-9991f1c4c750"),
    },
    {
        "name": "Ivory Terraces",
        "location": "Indiranagar",
        "price": 36_500_000,
        "size_sqft": 3100,
        "bedrooms": 3,
        "bathrooms": 4,
        "description": "A three-bedroom duplex with stepped garden terraces on every level. Floor-to-ceiling "
        "glazing, oak floors and a private lift.",
        "image_url": _img("1580587771525-78b9dba3b914"),
    },
    {
        "name": "Hebbal Lakeside Villa",
        "location": "Hebbal",
        "price": 49_500_000,
        "size_sqft": 4500,
        "bedrooms": 4,
        "bathrooms": 4,
        "description": "A lakeside villa twenty minutes from the airport. Open-plan living, a sunken courtyard, "
        "solar roof and a separate guest cottage.",
        "image_url": _img("1564013799919-ab600027ffc6"),
    },
    {
        "name": "The Sandalwood",
        "location": "Sadashivanagar",
        "price": 210_000_000,
        "size_sqft": 9800,
        "bedrooms": 6,
        "bathrooms": 7,
        "description": "A landmark six-bedroom mansion in one of Bengaluru's most established neighbourhoods. "
        "Formal and family living wings, a wine cellar, home theatre and half an acre of gardens.",
        "image_url": _img("1605276374104-dee2a0ed3cd6"),
    },
    {
        "name": "Nandi Hills Retreat",
        "location": "Devanahalli",
        "price": 28_000_000,
        "size_sqft": 3400,
        "bedrooms": 3,
        "bathrooms": 3,
        "description": "A weekend retreat with views of Nandi Hills. Stone and timber construction, an "
        "infinity-edge pool and an organic orchard maintained by the estate.",
        "image_url": _img("1600607687939-ce8a6c25118c"),
    },
]


def main() -> None:
    reset = "--reset" in sys.argv
    with SessionLocal() as db:
        if reset:
            db.execute(delete(Inquiry))
            db.execute(delete(Property))
        elif db.scalar(select(func.count()).select_from(Property)):
            print("Properties already exist; skipping seed (use --reset to replace).")
            return
        db.add_all(Property(**p) for p in SAMPLE_PROPERTIES)
        db.commit()
    print(f"Seeded {len(SAMPLE_PROPERTIES)} properties.")


if __name__ == "__main__":
    main()
