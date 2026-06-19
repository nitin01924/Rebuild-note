import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import {
  registerUser,
  LoginUser,
  getMe,
  verify_email,
} from "./controllers/authcontroller.js";
import protect from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();
app.use(express.json());

const port = 3000;

app.get("/", (req, res) => {
  res.send("Webapp Working");
});

app.post("/register", registerUser);
app.post("/login", LoginUser);
app.get("/me", protect, getMe);
app.get("/verify-email",verify_email)

app.listen(port, async () => {
  await connectDB();
  console.log(`Server is running on port ${port}`);
});
