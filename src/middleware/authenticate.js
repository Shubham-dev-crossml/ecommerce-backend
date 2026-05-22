const { verifyAccessToken } = require("../utils/jwt");
const { AppError } = require("./errorHandler");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      throw new AppError("Access token missing", 401);

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    req.user = payload; // { id, role }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return next(new AppError("Access token expired", 401));
    if (err.name === "JsonWebTokenError")
      return next(new AppError("Invalid access token", 401));
    next(err);
  }
};

module.exports = authenticate;
