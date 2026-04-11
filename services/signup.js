const { signup } = require("./auth");
const { createUser } = require("../repositories/userRepository");
const { createSeller } = require("../repositories/sellerRepository");
const { createRider } = require("../repositories/riderRepository");

async function signupByRole(data) {
  const { role, vehicle_type, address, shopName } = data;

  let user;
  let redirectUrl;

  if (role === "rider") {
    if (!vehicle_type || !address) {
      throw new Error("Vehicle and Address required");
    }
    user = await signup(createRider, {
      ...data,
      number_plate: data.number_plate || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    });
    redirectUrl = "/rider/dashboard";
  }

  else if (role === "seller") {
    if (!address || !shopName) {
      throw new Error("Shop Name and Address required");
    }
    user = await signup(createSeller, {
      ...data,
      shop_name: shopName,
    });
    redirectUrl = "/seller/dashboard";
  }
  else {
    user = await signup(createUser, data);
    redirectUrl = "/";
  }
  return { user, redirectUrl };
}

module.exports = {
  signupByRole,
};