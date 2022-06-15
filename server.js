import express from "express";
import { connectDB } from "./config/db.js";
import users from "./routes/api/users.js";
import auth from "./routes/api/auth.js";
import profile from "./routes/api/profile.js";
import posts from "./routes/api/posts.js";

const app = express();

// connect database;
connectDB();

// Init Middleware
app.use(express.json({ extented: false }));

app.get("/", (req, res) => res.send("Api running"));

app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/profile", profile);
app.use("/api/posts", posts);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server started ${PORT}`));
