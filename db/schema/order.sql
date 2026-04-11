CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rider_id INTEGER REFERENCES riders(id) ON DELETE SET NULL,

  phone TEXT,
  address TEXT,
  location TEXT NOT NULL,

  total DOUBLE PRECISION NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'confirmed',

  delivery_date DATE NOT NULL,
  delivery_slot TEXT NOT NULL,

  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  razorpay_payment_id TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);