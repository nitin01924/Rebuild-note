import express from "express";
import User from "../models/User.js";
import crypto from "crypto";
import { toUSVString } from "util";
import generateToken from "../utils/generateToken.js";
import { get } from "http";
import asyncHandler from "../middlewares/asyncHandler.js";
import {
  resetPasswordEmail,
  sendVerificationEmail,
} from "../utils/SendEmail.js";

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

    // sending email to the user for verify the email
    await sendVerificationEmail(user.email, token);

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

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found !!",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "User is not verified!",
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
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong with Server",
    });
  }
};

export const getMe = (req, res) => {
  res.json({
    user: req.user,
  });
};

// ================= verify-email ============

export const verify_email = asyncHandler(async (req, res, next) => {
  const { token } = req.query;

  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found / token is invalid",
    });
  }
  if (user.isVerified) {
    return res.status(200).json({
      success: true,
      message: "User is already Verified",
    });
  }

  ((user.isVerified = true), (user.verificationToken = null));

  await user.save();
  res.json({
    success: true,
    message: "Email verified successfully",
  });
});

// ================= forgot-password ============
export const forgotPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email } = req.body;

    // const normalizedEmail = email.toLowerCase();
    // const user = await User.findOne({ email: normalizedEmail });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    ((user.resetPasswordToken = token),
      (user.resetPasswordExpire = Date.now() + 10 * 60 * 1000));

    await user.save();

    // sending email to the user for resetting password
    await resetPasswordEmail(user.email, token);

    res.status(200).json({
      message: "forgot password email sent successful.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "something goes wrong with backend. can't send email",
    });
  }
});
