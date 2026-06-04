const { errorResponse } = require('../utils/helpers');

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return errorResponse(res, 'Access denied. Admin privileges required.', 403);
};

const requirePatient = (req, res, next) => {
  if (req.user && req.user.role === 'patient') {
    return next();
  }
  return errorResponse(res, 'Access denied. Patient login required.', 403);
};

module.exports = { requireAdmin, requirePatient };
