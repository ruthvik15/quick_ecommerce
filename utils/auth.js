const JWT = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_SECRET;

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
  "vehicle_type"  // Only for Rider
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
    return JWT.verify(token, secret);
  } catch (error) {
    return null;
  }
}

module.exports = {
  createtoken,
  validatetoken,
};