const redis = require("./redisClient");

const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Redis get error for key "${key}":`, err);
    return null;
  }
};

const setCache = async (key, value, ttl = 300) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    console.error(`Redis set error for key "${key}":`, err);
  }
};


const delCache = async (key) => {
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`Redis delete error for key "${key}":`, err);
  }
};

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
