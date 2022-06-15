import express from "express";

const app = express();

app.get("/", (req, res) => res.send("Api running"));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server started ${PORT}`));