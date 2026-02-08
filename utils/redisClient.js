const { createClient } = require("redis");
require("dotenv").config();

const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

client.on("error", (err) => console.error("Redis Client Error:", err));
client.on("connect", () => console.log("Redis Connected"));

async function connectRedis() {
  try {
    await client.connect();
    // ping check
    await client.set('heartbeat', 'ok', { EX: 5 });
    console.log("Redis is Ready");
  } catch (err) {
    console.error("Redis Failed to Connect:", err.message);
    throw err;
  }
}
module.exports = { client, connectRedis };