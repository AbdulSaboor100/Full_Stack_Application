import express from "express";
import { check, validationResult } from "express-validator";
import Post from "../../models/Post.js";
import authController from "../../middleware/authController.js";
import User from "../../models/User.js";

const router = express.Router();

router.post(
  "/",
  [authController, [check("text", "Text is required")]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById({ _id: req.user.id }).select(
        "-password"
      );
      let posts = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      posts = new Post(posts);
      await posts.save();
      res.json(posts);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

router.get("/get-all-posts", authController, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

router.get("/get-post/:post_id", authController, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.post_id });
    if (!post) {
      return res.status(400).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    console.error(error.message);
    if (error.kind == "ObjectId") {
      return res.status(400).json({ message: "Post not found" });
    }
    return res.status(500).send("Server error");
  }
});

router.delete("/delete-post/:post_id", authController, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(400).json({ message: "Post not found" });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }
    await post.remove();
    res.json({ message: "Post Deleted" });
  } catch (error) {
    console.error(error.message);
    if (error.kind == "ObjectId") {
      return res.status(400).json({ message: "Post not found" });
    }
    return res.status(500).send("Server error");
  }
});

router.post("/like/:like_id", authController, async (req, res) => {
  try {
    const post = await Post.findById(req.params.like_id);
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ message: "Post already Like" });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

router.post("/unlike/:unlike_id", authController, async (req, res) => {
  try {
    const post = await Post.findById(req.params.unlike_id);
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ message: "Post has not yet been liked" });
    }
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

router.post(
  "/comment/:post_id",
  [authController, [check("text", "Text is required")]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById({ _id: req.user.id }).select(
        "-password"
      );
      const post = await Post.findById({ _id: req.params.post_id });
      let comment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      post.comments.unshift(comment);
      await post.save();
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  }
);

router.delete("/delete-comment/:post_id", authController, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const comment = post.comments.find(
      (comment) => comment.user.toString() === req.user.id
    );
    console.log(comment);
    if (!comment) {
      return res.status(400).json({ message: "Comment does not exits" });
    }
    if (comment.user !== req.user.id) {
      return res.status(400).json({ message: "User not authoried" });
    }
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    res.json(post.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

export default router;
