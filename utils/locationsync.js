const cron = require('node-cron');
const { getCache } = require('./cache');
const Rider = require('../models/rider');

// FIXED: Add error recovery and sync tracking
let lastSyncTime = new Date();
let syncErrors = 0;

async function syncRiderLocations() {
  try {
    const allRiders = await Rider.find({}, '_id');
    let successCount = 0;
    let failCount = 0;

    for (const rider of allRiders) {
      try {
        const redisKey = `rider:location:${rider._id}`;
        const coords = await getCache(redisKey);

        if (coords?.latitude && coords?.longitude) {
          await Rider.findByIdAndUpdate(rider._id, {
            latitude: coords.latitude,
            longitude: coords.longitude,
            updatedAt: new Date()
          });
          successCount++;
          console.log(`✅ Synced location for rider ${rider._id}`);
        }
      } catch (riderErr) {
        failCount++;
        console.error(`⚠️  Failed to sync rider ${rider._id}:`, riderErr.message);
      }
    }
    
    lastSyncTime = new Date();
    syncErrors = 0; // Reset error count on success
    console.log(`📊 Location sync complete: ${successCount} succeeded, ${failCount} failed at ${lastSyncTime.toISOString()}`);
  } catch (err) {
    syncErrors++;
    console.error("❌ Critical error in location sync:", err.message);
    if (syncErrors > 5) {
      console.error("⚠️  Multiple sync failures detected - manual intervention may be needed");
    }
  }
}

// ⏰ Run every 20 minutes with error recovery
cron.schedule('*/20 * * * *', syncRiderLocations);

module.exports = { syncRiderLocations };
