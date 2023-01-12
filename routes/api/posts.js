const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const passport = require("passport");
const validatePostInput = require("../../validation/post");

// получение всех постов
// доступно любому пользователю
router.get("/", (req, res) => {
  Post.find()
    .then((posts) => res.status(200).json(posts))
    .catch((err) =>
      res.status(400).json({ user: "Ошибка при получении постов" })
    );
});

// получение конкретного поста
router.get("/:id", (req, res) => {
  Post.find({ _id: req.params.id })
    .then((post) => res.status(200).json(post))
    .catch((err) => res.status(400).json({ id: "Не удалось получить статью" }));
});

// Получение комментов конкретного поста
router.get("/:id/comment", (req, res) => {
  res.render("post-comment", { title: "Напишите комментарий" });
});

//
router.get("/author/:author", (req, res) => {
  Post.find({ author: req.params.author })
    .then((posts) => res.status(200).json(posts))
    .catch((err) =>
      res.status(400).json({ author: "Ошибка поиска потов по автору" })
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

// создание комментария к посту
router.post(
  "/:id/comment",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // находим id поста, к которому хотим создать комментарий
    const id = req.params.id;
    // запоминаем автора, который создал комменатрий
    const author = req.user.user_name;
    // создаем комментарий и запоминаем id поста, в котором находится этот комментарий
    const comment = req.body;
    comment.author = author;
    comment.post = id;

    const newComment = new Comment(comment);
    // save comment
    newComment.save();
    // get this particular post
    const postRelated = await Post.findById(id);
    // push the comment into the post.comments array
    postRelated.comments.push(newComment);
    // save and redirect...
    postRelated
      .save()
      .then((doc) => res.json(doc))
      .catch((err) =>
        console.log({ create: "Ошибка при создании комментария" })
      );
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
