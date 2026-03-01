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
    return true;
  } catch (err) {
    console.error("Redis SET error for key "+key+":", err.message);
    return false;
  }
};

const delCache = async (key) => {
  try {
    const result = await client.del(key);
    return result > 0;
  } catch (err) {
    console.error("Redis DEL error for key "+key+":", err.message);
    return false;
  }
};

const delCachePattern = async (pattern) => {
  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;
    const deletedCount = await client.del(keys);
    console.log(`🗑️  Deleted ${deletedCount} cache keys matching pattern: ${pattern}`);
    return deletedCount;
  } catch (err) {
    console.error("Redis PATTERN DEL error for pattern "+pattern+":", err.message);
    return 0;
  }
};

const clearDashboardCache = async (userId) => {
  const key = `dashboard:seller:${userId}`;
  await delCache(key);
};

const clearLocationProductCache = async (location) => {
  const pattern = `products:${location.toLowerCase()}:*`;
  return await delCachePattern(pattern);
};

module.exports = {
  getCache,
  setCache,
  delCache,
  delCachePattern,
  clearDashboardCache,
  clearLocationProductCache
};