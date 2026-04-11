const JWT = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_SECRET;

if (!secret) {
  process.exit(1);
}

const FIELDS = [
  "id",
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

const createtoken = (user) => {
  const payloadEntries = Object.entries(user).filter(([k, v]) => {
    return FIELDS.includes(k) && v != null;
  });

  const payload = Object.fromEntries(payloadEntries);

  return JWT.sign(payload, secret, { expiresIn: "7d" });
};

const validatetoken = (token) => {
  if (!token) {
    throw new Error("No token provided");
  }

  try {
    return JWT.verify(token, secret);
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      throw new Error("Token expired");
    } else {
      throw new Error("Invalid token");
    }
  }
};

module.exports = {
  createtoken,
  validatetoken,
};