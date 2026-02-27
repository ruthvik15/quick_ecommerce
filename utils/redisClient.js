const { createClient } = require("redis");
require("dotenv").config();

const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis reconnection attempts exceeded');
        return new Error('Redis max retries exceeded');
      }
      return retries * 100; // exponential backoff: 100ms, 200ms, 300ms...
    }
  }
});

// FIXED: Add proper event listeners for health monitoring
client.on("error", (err) => console.error("❌ Redis Error:", err));
client.on("connect", () => console.log("✅ Redis Connected"));
client.on("ready", () => console.log("✅ Redis Ready"));
client.on("reconnecting", () => console.log("🔄 Redis Reconnecting..."));

async function connectRedis() {
  try {
    await client.connect();
    // FIXED: Proper health check with ping
    const pong = await client.ping();
    if (pong === 'PONG') {
      await client.set('heartbeat', 'ok', { EX: 300 });
      console.log("✅ Redis is Ready");
    }
  } catch (err) {
    console.error("❌ Redis Failed to Connect:", err.message);
    throw err;
  }
}
module.exports = { client, connectRedis };