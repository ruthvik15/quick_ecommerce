const mongoose = require('mongoose');
require("dotenv").config();
async function connectToMongoDb() {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("Mongo DB connected");
}

module.exports = connectToMongoDb;