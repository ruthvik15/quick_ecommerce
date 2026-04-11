const { pool } = require("../utils/dbConnection");

async function createUser({ name, email, password, phone, location, address }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, phone, location, address)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, name, email, phone, location, address, created_at, 'user' as role`,
    [name, email, password, phone, location, address || null]
  );

  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(
    "SELECT *, 'user' AS role FROM users WHERE email = $1",
    [email]
  );

  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
};
