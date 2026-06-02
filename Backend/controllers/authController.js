import express from "express";
import User from "../models/User.js";
import crypto from "crypto";

const app = express();

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Please fill all the fields",
    });
  }
  const normalizedEmail = email.toLowerCase();

  const token = crypto.randomBytes(32).toString("hex");
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    verificationToken: token,
  });
  res.status(201).json({
    success: true,
    message: "User has been Registered",
  });
};

export default registerUser;
