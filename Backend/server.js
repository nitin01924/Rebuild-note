import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import registerUser from "./controllers/authcontroller.js";

dotenv.config();

const app = express();
app.use(express.json());

const port = 3000;

app.get("/", (req, res) => {
  res.send("Webapp Working");
});

app.post("/register", registerUser);

app.listen(port, async () => {
  await connectDB();
  console.log(`Server is running on port ${port}`);
});
