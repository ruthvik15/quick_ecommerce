CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL CHECK (price >= 0),
  image TEXT,
  description TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  location TEXT NOT NULL,
  category TEXT,
  seller_id INTEGER REFERENCES sellers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'live',
  sold_count INTEGER DEFAULT 0,
  average_rating DOUBLE PRECISION DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);