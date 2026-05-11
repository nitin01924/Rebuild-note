import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Webapp Working");
});

app.listen(port, async () => {
  await connectDB();
  console.log(`Server is running on port ${port}`);
});
