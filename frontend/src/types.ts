// Mirrors the backend Pydantic schemas (backend/app/schemas.py).

export interface Property {
  id: number
  name: string
  location: string
  price: number // whole rupees
  size_sqft: number
  bedrooms: number
  bathrooms: number
  description: string
  image_url: string
  created_at: string
  updated_at: string
}

export type PropertyInput = Omit<Property, 'id' | 'created_at' | 'updated_at'>

export interface Inquiry {
  id: number
  property_id: number | null
  property_name: string | null // null when the listing was deleted
  name: string
  email: string
  phone: string
  message: string
  created_at: string
}

export type InquiryInput = Pick<Inquiry, 'name' | 'email' | 'phone' | 'message'>

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'size_desc'

export interface PropertyFilters {
  location?: string
  min_bedrooms?: number
  sort?: SortOption
}

/** Field name -> message, as returned by the API on a 422. */
export type FieldErrors = Record<string, string>
