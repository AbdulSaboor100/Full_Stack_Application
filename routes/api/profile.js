import express from "express";
import Profile from "../../models/Profile.js";
import User from "../../models/User.js";
import authController from "../../middleware/authController.js";

const router = express.Router();

router.post("/me", authController, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );
    if (!profile) {
      return res
        .status(400)
        .json({ message: "There is not profile for this user" });
    }
    res.json(profile);
  } catch (error) {
    console.error(error.message);
  }
});

export default router;
