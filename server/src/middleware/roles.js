function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "forbidden" });
    }

    
    return next();
  };
}

module.exports = allowRoles;
