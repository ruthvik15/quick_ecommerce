// Input validation middleware
// Prevents common invalid inputs from reaching controllers

const validateEmail = (email) => {
  if(!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  if(!phone) return false;
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone?.toString()?.replace(/\D/g, ''));
};

const validateLocation = (location) => {
  if(!location) return false;
  const validLocations = ['hyderabad', 'bengaluru', 'mumbai', 'delhi'];
  return validLocations.includes(location?.toLowerCase());
};

const validatePrice = (price) => {
  if(!price) return false;
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0;
};

const validateQuantity = (quantity) => {
  if(!quantity) return false;
  const num = parseInt(quantity);
  return !isNaN(num) && num > 0;
};

const ValidatePassword = (password) => {
  if(!password || password.length < 6) return false;
  return true;
};

const ValidateName = (name) => {
  if(!name || name.trim().length < 2) return false;
  return true;
};

const ValidateAddress = (address) => {
  if(!address || address.trim().length < 5) return false;
  return true;
};

const ValidateDeliveryDate = (deliveryDate) => {
  if(!deliveryDate) return false;
  const date = new Date(deliveryDate);
  return !isNaN(date.getTime());
};

const ValidateDeliverySlot = (deliverySlot) => {
  if(!deliverySlot) return false;
  const validSlots = ['10-12', '12-2', '2-4', '4-6'];
  return validSlots.includes(deliverySlot);
};

const ValidateCoordinates = (latitude, longitude) => {
  if(latitude === undefined || longitude === undefined) return false;
  return !isNaN(parseFloat(latitude)) && !isNaN(parseFloat(longitude));
};

const ValidateRole = (role) => {
  if(!role) return false;
  const validRoles = ['user', 'seller', 'rider'];
  return validRoles.includes(role.toLowerCase());
};

const ValidateRating = (rating) => {
  if(!rating || rating < 1 || rating > 5) return false;
  return true;
};

const ValidateComment = (comment) => {
  if(!comment || comment.trim().length < 5) return false;
  return true;
};


const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!ValidatePassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (!ValidateRole(req.body.role)) {
    return res.status(400).json({ error: 'Valid role is required' });
  }

  next();
};

const validateSignupInput = (req, res, next) => {
  const { email, password, phone, name } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!ValidatePassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format (10 digits required)' });
  }

  if (!ValidateName(name)) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' });
  }

  if (!ValidateRole(req.body.role)) {
    return res.status(400).json({ error: 'Valid role is required' });
  }

  next();
};


const validateProductInput = (req, res, next) => {
  const { name, price, quantity, location, category } = req.body;

  if (!ValidateName(name)) {
    return res.status(400).json({ error: 'Product name must be at least 2 characters' });
  }

  if (!validatePrice(price)) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  if (!validateQuantity(quantity)) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  if (!validateLocation(location)) {
    return res.status(400).json({ error: 'Invalid location' });
  }

  const validCategories = ['groceries', 'electronics', 'clothing', 'food', 'other'];
  if (category && !validCategories.includes(category?.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  next();
};

const validateReviewInput = (req, res, next) => {
  const { rating, comment } = req.body;

  if (!ValidateRating(rating)) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  if (!ValidateComment(comment)) {
    return res.status(400).json({ error: 'Comment must be at least 5 characters' });
  }
  next();
};


const validateCheckoutInput = (req, res, next) => {
  const { deliveryDate, deliverySlot, latitude, longitude, address, phone } = req.body;

  if (!ValidateDeliveryDate(deliveryDate)) {
    return res.status(400).json({ error: 'Delivery date is required' });
  }

  if (!ValidateDeliverySlot(deliverySlot)) {
    return res.status(400).json({ error: 'Invalid delivery slot' });
  }

  if (!ValidateCoordinates(latitude, longitude)) {
    return res.status(400).json({ error: 'Coordinates are required' });
  }

  if (!ValidateAddress(address)) {
    return res.status(400).json({ error: 'Address must be at least 5 characters' });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }
  next();
};

module.exports = {
  validateLoginInput,
  validateSignupInput,
  validateProductInput,
  validateReviewInput,
  validateCheckoutInput,
};
