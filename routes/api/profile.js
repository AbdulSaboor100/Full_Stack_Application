import express from "express";
import Profile from "../../models/Profile.js";
import User from "../../models/User.js";
import authController from "../../middleware/authController.js";
import { check, validationResult } from "express-validator";
import request from "request";
import config from "config";

const router = express.Router();

router.get("/me", authController, async (req, res) => {
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

router.post(
  "/",
  [
    authController,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills)
      profileFields.skills = skills.split(",").map((skills) => skills.trim());
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
    try {
      let profile = await Profile.findOne({ id: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.status(200).json(profile);
      }
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

router.get("/all-profiles", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (error) {
    console.error(error.message);
    res.send("Server error");
  }
});

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);
    // if (!profile) res.status(400).json({ message: "Profile not found" });
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind == "ObjectId") {
      return res.status(400).json({ message: "Profile not found" });
    }
    return res.status(500).json("Server error");
  }
});

router.delete("/delete-account", authController, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ message: "Account deleted" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

router.put(
  "/experience",
  [
    authController,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is required").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const { company, title, location, from, description, to, current } =
        req.body;
      const experiencObj = {
        title,
        company,
        location,
        from,
        description,
        to,
        current,
      };
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(experiencObj);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.post("/delete-experience/:exp_id", authController, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });
    const removeIndex = profile.experience
      .map((exp) => exp._id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

router.put(
  "/education",
  [
    authController,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is required").not().isEmpty(),
      check("fieldofstudy", "Feild of study is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const { school, degree, fieldofstudy, from, description, to, current } =
        req.body;
      const educationObj = {
        school,
        degree,
        fieldofstudy,
        from,
        description,
        to,
        current,
      };
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(educationObj);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete("/delete-education/:edu_id", authController, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });
    const removeIndex = profile.education
      .map((exp) => exp._id)
      .indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

router.get("/github-repos/:username", async (req, res) => {
  try {
    const githubClientId = config.get("githubClientId");
    const githubClientSecret = config.get("githubClientSecret");
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${githubClientId}&client_secret=${githubClientSecret}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };
    request(options, (error, response, body) => {
      if (error) console.error(error);
      if (response.statusCode !== 200) {
        res.status(404).json({ message });
      }
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

export default router;
