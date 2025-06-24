const JWT=require("jsonwebtoken");
require("dotenv").config();
const secret=process.env.JWT_SECRET;

function createtoken(user){
  console.log(user)
    const payload={
        _id:user._id,
        name:user.name,
        email:user.email,
        location:user.location,
        role:user.role,
        phone:user.phone,
        address:user.address,
        latitude:user.latitude,
        longitude:user.longitude

    }
      if (user.role) {
    payload.role = user.role; // for users
  }
  if (user.address) {
    payload.address = user.address; // for users
  }
  if (user.vehicle_type) {
    payload.vehicle_type = user.vehicle_type; // for riders
  }
  console.log(payload)
    const token=JWT.sign(payload,secret);
    
    return token;

}

function validatetoken(token){
    const payload=JWT.verify(token,secret);
    return payload;

}
module.exports={
    createtoken,
    validatetoken
}
