// Input validation middleware
// Prevents common invalid inputs from reaching controllers

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  // Accept 10-digit phone numbers
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone?.toString()?.replace(/\D/g, ''));
};

const validateLocation = (location) => {
  const validLocations = ['hyderabad', 'bengaluru', 'mumbai', 'delhi'];
  return validLocations.includes(location?.toLowerCase());
};

const validatePrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0;
};

const validateQuantity = (quantity) => {
  const num = parseInt(quantity);
  return !isNaN(num) && num > 0;
};

// Middleware for login route (email and password only)
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  next();
};

// Middleware for signup route (includes name, phone, etc.)
const validateSignupInput = (req, res, next) => {
  const { email, password, phone, name } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (phone && !validatePhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format (10 digits required)' });
  }

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }

  next();
};

// DEPRECATED: Use validateLoginInput or validateSignupInput instead
const validateAuthInput = validateSignupInput;

// Middleware for product operations
const validateProductInput = (req, res, next) => {
  const { name, price, quantity, location, category } = req.body;

  if (name && name.trim().length < 2) {
    return res.status(400).json({ error: 'Product name must be at least 2 characters' });
  }

  if (price !== undefined && !validatePrice(price)) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  if (quantity !== undefined && !validateQuantity(quantity)) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  if (location && !validateLocation(location)) {
    return res.status(400).json({ error: 'Invalid location' });
  }

  const validCategories = ['groceries', 'electronics', 'clothing', 'food', 'other'];
  if (category && !validCategories.includes(category?.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  next();
};

// Middleware for review input
const validateReviewInput = (req, res, next) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  if (!comment || comment.trim().length < 5) {
    return res.status(400).json({ error: 'Comment must be at least 5 characters' });
  }

  next();
};

// Middleware for checkout input
const validateCheckoutInput = (req, res, next) => {
  const { deliveryDate, deliverySlot, latitude, longitude, address, phone } = req.body;

  if (!deliveryDate) {
    return res.status(400).json({ error: 'Delivery date is required' });
  }

  const validSlots = ['10-12', '12-2', '2-4', '4-6'];
  if (!validSlots.includes(deliverySlot)) {
    return res.status(400).json({ error: 'Invalid delivery slot' });
  }

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Coordinates are required' });
  }

  if (isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
    return res.status(400).json({ error: 'Invalid coordinates format' });
  }

  if (!address || address.trim().length < 5) {
    return res.status(400).json({ error: 'Address must be at least 5 characters' });
  }

  if (phone && !validatePhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  next();
};

module.exports = {
  validateLoginInput,
  validateSignupInput,
  validateAuthInput, // Deprecated, kept for backward compatibility
  validateProductInput,
  validateReviewInput,
  validateCheckoutInput,
  validateEmail,
  validatePhone,
  validateLocation,
  validatePrice,
  validateQuantity
};
