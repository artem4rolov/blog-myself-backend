const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const passport = require("passport");
const validatePostInput = require("../../validation/post");

// получение всех постов
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.find({ author: req.user.user_name })
      .then((posts) => res.status(200).json(posts))
      .catch((err) =>
        res.status(400).json({ user: "Ошибка при получении постов" })
      );
  }
);

// получение конкретного поста
router.get("/post/:id", (req, res) => {
  Post.find({ _id: req.params.id })
    .then((post) => res.status(200).json(post))
    .catch((err) => res.status(400).json({ id: "Не удалось получить статью" }));
});

//
router.get("/author/:author", (req, res) => {
  Post.find({ author: req.params.author })
    .then((posts) => res.status(200).json(posts))
    .catch((err) =>
      res
        .status(400)
        .json({ author: "Error fetching posts of specific author" })
    );
});

// создание поста
router.post(
  "/create",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const author = req.user.user_name;
    const post = req.body;
    const { errors, isValid } = validatePostInput(post);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    post.author = author;
    const newPost = new Post(post);
    newPost
      .save()
      .then((doc) => res.json(doc))
      .catch((err) => console.log({ create: "Ошибка при создании поста" }));
  }
);

// обновление поста
router.patch(
  "/update/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const author = req.user.user_name;
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const { title, body } = req.body;
    Post.findOneAndUpdate(
      { author, _id: req.params.id },
      { $set: { title, body } },
      { new: true }
    )
      .then((doc) => res.status(200).json(doc))
      .catch((err) =>
        res.status(400).json({ update: "Ошибка при обновлении поста" })
      );
  }
);

// удаление поста
router.delete(
  "/delete/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const author = req.user.user_name;
    Post.findOneAndDelete({ author, _id: req.params.id })
      .then((doc) => res.status(200).json(doc))
      .catch((err) =>
        res.status(400).json({ delete: "Ошибка при удалении поста" })
      );
  }
);

module.exports = router;
