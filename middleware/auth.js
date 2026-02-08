const { validatetoken } = require("../utils/auth");

function checkcookie(cookie) {
  return (req, res, next) => {
    const cookieValue = req.cookies[cookie];
    if (!cookieValue) {
      req.user = null;
      return next();
    }
    try {
      const payload = validatetoken(cookieValue);
      req.user = payload;
    } catch (error) {
      req.user = null;
    }
    return next();
  };
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

module.exports = {
  checkcookie,
  requireAuth
};
