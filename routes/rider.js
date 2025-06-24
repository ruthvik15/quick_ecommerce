const express = require("express");
const router = express.Router();
const {acceptOrder,
  rejectOrder,
  dashboard,
  signup,
  updateLocationById,
  updateLocation,
  
} = require("../controllers/riderController");


router.post("/orders/accept", acceptOrder);
router.post("/orders/reject",rejectOrder);
router.get("/dashboard", dashboard);
router.post("/signup", signup);
router.post("/:id/location", updateLocationById);
router.post("/update-location", updateLocation);


module.exports = router;
