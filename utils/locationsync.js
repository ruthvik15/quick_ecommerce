// cronJobs/locationSync.js

const cron = require('node-cron');
const { getCache } = require('./cache'); // ✅ your Redis helper
const Rider = require('../models/rider'); // ✅ your Rider model

// ⏰ Run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  try {
    const allRiders = await Rider.find({}, '_id'); // get all rider IDs

    for (const rider of allRiders) {
      const redisKey = `rider:location:${rider._id}`;
      const coords = await getCache(redisKey);

      if (coords?.latitude && coords?.longitude) {
        await Rider.findByIdAndUpdate(rider._id, {
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        console.log(`📍 Synced ${rider._id} location to MongoDB.`);
      }
    }
  } catch (err) {
    console.error("❌ Cron error syncing rider locations:", err.message);
  }
});
