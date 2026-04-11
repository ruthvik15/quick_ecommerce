const { login } = require("./auth");
const { findUserByEmail } = require("../repositories/userRepository");
const { findSellerByEmail } = require("../repositories/sellerRepository");
const { findRiderByEmail } = require("../repositories/riderRepository");

async function loginByRole({ email, password, role }) {
  let result;
  let redirectUrl;

  if (role === "rider") {
    result = await login(findRiderByEmail, email, password);
    redirectUrl = "/rider/dashboard";
  }

  else if (role === "seller") {
    result = await login(findSellerByEmail, email, password);
    redirectUrl = "/seller/dashboard";
  }

  else {
    result = await login(findUserByEmail, email, password);
    redirectUrl = "/";
  }

  return { ...result, redirectUrl };
}

module.exports = {
  loginByRole,
};