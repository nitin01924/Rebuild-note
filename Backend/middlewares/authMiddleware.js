import User from "../models/User.js";
import asyncHandler from "./asyncHandler.js";
import jwt from "jsonwebtoken";

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({
      success: false,
      message: "Not authorized or no token",
    });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decode.id);

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid Token.",
    });
  }
});
export default protect;
