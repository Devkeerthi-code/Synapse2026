// server/middleware/auth.js
const { verifyToken } = require('../utils/jwt');

module.exports = function protect(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};
