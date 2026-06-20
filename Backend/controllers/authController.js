import User from "../models/User.js";
import crypto from "crypto";
import generateToken from "../utils/generateToken.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import {
  resetPasswordEmail,
  sendVerificationEmail,
} from "../utils/SendEmail.js";

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

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email",
      });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();
    await resetPasswordEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: "forgot password email sent successful.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "something goes wrong with backend. can't send email",
    });
  }
});

//  !!==================== Reset-Password ====================!!

export const resetPassword = asyncHandler(async (req, res) => {
  const token = req.query.token || req.body.token;
  const { password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error("Token and password are required");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("invalid or expired token");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;

  await user.save();
  res.json({ success: true, message: "Password reset successful" });
});
