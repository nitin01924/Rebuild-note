import User from "../models/User";
import asyncHandler from "./asyncHandler";
import jwt from "jsonwebtoken";

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.Header.authentication;

  if (!authHeader || !authHeader.startwith("Bearer")) {
    return res.status(401).json({
      success: false,
      message: "Not authorized or no token",
    });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne(decode.id);

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
