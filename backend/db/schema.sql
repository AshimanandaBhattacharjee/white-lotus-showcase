-- Plain-SQL equivalent of alembic/versions/0001 (generated with: alembic upgrade head --sql).
-- Alembic is the source of truth; this file is for reading/reviewing the schema.


CREATE TABLE properties (
    id SERIAL NOT NULL,
    name VARCHAR(120) NOT NULL,
    location VARCHAR(120) NOT NULL,
    price BIGINT NOT NULL,
    size_sqft INTEGER NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT ck_properties_bathrooms_non_negative CHECK (bathrooms >= 0),
    CONSTRAINT ck_properties_bedrooms_non_negative CHECK (bedrooms >= 0),
    CONSTRAINT ck_properties_price_positive CHECK (price > 0),
    CONSTRAINT ck_properties_size_positive CHECK (size_sqft > 0)
);

CREATE INDEX ix_properties_bedrooms ON properties (bedrooms);

CREATE INDEX ix_properties_location ON properties (location);

CREATE TABLE inquiries (
    id SERIAL NOT NULL,
    property_id INTEGER,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY(property_id) REFERENCES properties (id) ON DELETE SET NULL
);

CREATE INDEX ix_inquiries_property_id ON inquiries (property_id);

