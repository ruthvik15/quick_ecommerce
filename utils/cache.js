// 1. Destructure to get the actual client!
const { client } = require("./redisClient"); 

const getCache = async (key) => {
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis GET error for key "+key+":", err.message);
    return null;
  }
};

const setCache = async (key, value, ttl = 300) => {
  try {
    await client.set(key, JSON.stringify(value), { EX: ttl });
  } catch (err) {
    console.error("Redis SET error for key "+key+":", err.message);
  }
};

const delCache = async (key) => {
  try {
    await client.del(key);
  } catch (err) {
    console.error("Redis DEL error for key "+key+":", err.message);
  }
};

// Specialized Helpers
const clearDashboardCache = async (userId) => {
  const key = `dashboard:seller:${userId}`;
  await delCache(key);
};

module.exports = {
  getCache,
  setCache,
  delCache,
  clearDashboardCache
};