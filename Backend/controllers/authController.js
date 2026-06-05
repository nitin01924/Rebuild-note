import express from "express";
import User from "../models/User.js";
import crypto from "crypto";
import { toUSVString } from "util";

const app = express();

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all the fields",
      });
    }
    const normalizedEmail = email.toLowerCase();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: "User already exist.",
      });
    }

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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "something goes wrong with backend",
    });
  }
};

// =============Login===============

export const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter all credentials",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found !!",
      });
    }

    const isPasswordMatched = await user.matchPassword(password);
    if (!isPasswordMatched) {
      res.status(401).json({ message: "Invalid email or password " });
    }
    res.status(201).json({
      success: true,
      message: "user has been logged-In",
      data: {
        name: user.name,
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong with Server",
    });
  }
};
