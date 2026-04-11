const mongoose = require("mongoose");
const { Pool } = require("pg");

require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_DB_URI,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function connectPgDB() {
  const client = await pool.connect();
  console.log("Postgres DB connected");
  client.release();
}

async function connectToMongoDb() {
  await mongoose.connect(process.env.MONGO_DB_URI);
  console.log("Mongo DB connected");
}

module.exports = {
  pool,
  connectPgDB,
  connectToMongoDb,
};