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
      // Silently handle expected auth failures (invalid/expired tokens)
      // Only log if it's an unexpected error type
      if (!error.message.includes('Invalid token') && !error.message.includes('Token expired')) {
        console.error(`Unexpected error validating ${cookie}:`, error);
      }
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

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized - Please login" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Forbidden - You don't have permission to access this resource",
        requiredRole: allowedRoles,
        yourRole: req.user.role
      });
    }
    
    next();
  };
}

module.exports = {
  checkcookie,
  requireAuth,
  requireRole
};
