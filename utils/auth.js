const JWT = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_SECRET;


if (!secret) {
  console.error('ERROR: JWT_SECRET not configured in environment variables');
  process.exit(1);
}

const ALLOWED_FIELDS = [
  "_id",
  "name",
  "email",
  "role",         
  "location", 
  "phone",
  "address",  
  "latitude", 
  "longitude", 
  "vehicle_type"  
];

function createtoken(user) {
  const payload = {};

  ALLOWED_FIELDS.forEach((field) => {
    if (user[field] !== undefined && user[field] !== null) {
      payload[field] = user[field];
    }
  });

  return JWT.sign(payload, secret, { expiresIn: "7d" });
}

function validatetoken(token) {
  try {
    if (!token) {
      const error = new Error('No token provided');
      error.name = 'NoTokenError';
      throw error;
    }
    return JWT.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NoTokenError') {
      throw error;
    } else {
      console.error('Unexpected token validation error:', error);
    }
    return null;
  }
}

module.exports = {
  createtoken,
  validatetoken,
};