// const { createClient } = require("redis");
// require("dotenv").config(); // Load env variables

// const redis = createClient({
//   url: process.env.REDIS_URL ||
// });

// redis.on("error", (err) => console.error("❌ Redis Error:", err));
// redis.on("connect", () => console.log("✅ Redis connected"));

// (async () => {
//   try {
//     await redis.connect();
//   } catch (err) {
//     console.error("❌ Redis connection failed:", err);
//   }
// })();

// module.exports = redis;//use this for local redis (docker)
const { createClient } = require("redis");
require("dotenv").config(); // Load env variables

// Use environment variables for security
const REDIS_USERNAME = process.env.REDIS_USERNAME ;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD ;
const REDIS_HOST = process.env.REDIS_HOST ;
const REDIS_PORT = process.env.REDIS_PORT;

const redis = createClient({
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    tls: false, // Set to true if using TLS
    reconnectStrategy: (retries) => {
     
      const delay = Math.min(retries * 100, 5000);
      return delay;
    }
  }
});

redis.on("error", (err) => console.error("❌ Redis Error:", err));
redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("ready", () => console.log("🚀 Redis ready to accept commands"));
redis.on("reconnecting", () => console.log("🔁 Redis reconnecting..."));

(async () => {
  try {
    await redis.connect();
    
    
    await redis.set('connection_test', 'success', { EX: 10 }); // Expires in 10 seconds
    const testResult = await redis.get('connection_test');
    console.log(`Connection test: ${testResult === 'success' ? '✅ Success' : '❌ Failed'}`);
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
    process.exit(1);
  }
})();

module.exports = redis;
