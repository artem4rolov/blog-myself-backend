const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const validatePostInput = require("../../validation/post");
const verifyToken = require("../../middleware/auth.js");

const multer = require("multer");
const uuidv4 = require("uuid/v4");

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
// при открытии страницы с постом, увеличиваем счетчик просмотров статьи на 1
router.get("/:id", async (req, res) => {
  Post.findByIdAndUpdate(
    // находим пост по id
    { _id: req.params.id },
    // делаем инкремент на свойство viewCount
    { $inc: { viewCount: 1 } },
    // возвращаем новый документ в БД
    { new: true }
  )
    .then((post) => res.status(200).json(post))
    .catch((err) => {
      res.status(400).json({ id: "Не удалось получить статью" });
      console.log(err);
    });
});

// Получение комментов конкретного поста
router.get("/:id/comments", async (req, res) => {
  try {
    // берем id поста из запроса
    const id = req.params.id;
    // находим пост в БД по id
    const post = await Post.findById(id);
    // находим все комментарии к данному посту в БД по id поста (в каждом комментарии указан пост, к которому он (комментарий) относится)
    const comments = await Comment.find({ post: post._id }).then((data) => {
      return data;
    });
    // выводим данные на фронт
    res.json(comments);
  } catch (err) {
    console.log(err);
    res.status(400).send({ message: err });
  }
});

// Фильтр постов по автору
router.get("/author/:author", (req, res) => {
  Post.find({ author: req.params.author })
    .then((posts) => res.status(200).json(posts))
    .catch((err) =>
      res.status(400).json({ author: "Ошибка поиска потов по автору" })
    );
});

// Создание поста
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { user_name } = req.user;
    const post = req.body;
    const { errors, isValid } = validatePostInput(post);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    post.author = user_name;
    post.cover = req.body.cover;
    post.title = req.body.title;
    post.text = req.body.text;
    const newPost = new Post(post);
    newPost
      .save()
      .then((doc) => res.json(doc))
      .catch((err) => console.log({ create: "Ошибка при создании поста" }));
  } catch (err) {
    console.log(err);
  }
});

// Создание комментария к посту
router.post(
  "/:id/comments/create",
  // passport.authenticate("jwt", { session: false }),
  verifyToken,
  async (req, res) => {
    try {
      // находим id поста, к которому хотим создать комментарий
      const id = req.params.id;

      // запоминаем автора, который создал комменатрий
      const author = req.user.user_name;
      const avatar = req.user.avatar;

      // создаем комментарий и запоминаем id поста, в котором находится этот комментарий
      const comment = req.body;
      comment.author = author;
      comment.post = id;
      comment.userImg = avatar;
      const newComment = new Comment(comment);
      // сохраняем коммент
      newComment.save();
      // ищем пост, в который будем пихать новый комментарий
      const postRelated = await Post.findById(id);
      // пихаем комментарий в найденный пост
      postRelated.comments.push(newComment);
      // сохраняем пост
      postRelated
        .save()
        .then((doc) => res.json(doc))
        .catch((err) =>
          console.log({ create: "Ошибка при создании комментария" })
        );
    } catch (err) {
      console.log(err);
    }
  }
);

// Обновление поста
router.patch(
  "/update/:id",
  // passport.authenticate("jwt", { session: false }),
  verifyToken,
  (req, res) => {
    // вытаскиваем автора из запроса
    const author = req.user.user_name;
    // проверяем на валидацию ошибок при заполнении пользователем полей на фронте
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    // если все ок - достаем из запроса заголовок для поста и текст для поста
    const { title, body } = req.body;
    Post.findOneAndUpdate(
      // определяем автора и id поста, который нужно изменить
      { author, _id: req.params.id },
      // меняем заголовок и текст поста, увеличиваем счетчик просмоторв на 1
      { $inc: { viewCount: 1 }, $set: { title, body } },
      // возвращаем новый документ в БД
      { new: true }
    )
      .then((doc) => res.status(200).json(doc))
      .catch((err) => {
        res.status(400).json({ update: "Ошибка при обновлении поста" }),
          console.log(err);
      });
  }
);

// Удаление поста
// удаление чужого поста ограничим на фронтенде, если автор поста не совпадает с именем авторизованного пользователя - кнопка удаления поста будет недоступна
router.delete(
  "/delete/:id",
  // идентифицируем пользователя
  // passport.authenticate("jwt", { session: false }),
  verifyToken,
  async (req, res) => {
    // ищем автора поста
    const author = req.user.user_name;
    // находим id поста, к которому хотим создать комментарий
    const id = req.params.id;
    // ищем пост, который хотим удалить
    Post.findById({
      _id: id,
    }).then((res) => {
      if (res.comments.length > 0) {
        // перебираем массив с комментариями в посте
        res.comments.forEach((comment) =>
          // в этом массиве, в каждом комментарии находится id комментария
          // теперь идем в модель Comment, находим каждый комментарий по id (comment) и удаляем его
          Comment.findByIdAndDelete({
            _id: comment,
          })
            // затем удаляем сам пост, в котором были эти комментарии
            .then(() =>
              Post.findByIdAndDelete({
                author,
                _id: req.params.id,
              })
            )
            .then(() => console.log("Пост с комментариями удален"))
            .catch((err) => console.log(err))
        );
      } else {
        Post.findByIdAndDelete({
          author,
          _id: req.params.id,
        }).then(() => console.log("Пост удален"));
      }
    });
    res.send("Пост удален");
  }
);

// Удаление комментария
// удаление чужого комментария ограничим на фронтенде, если автор комментария не совпадает с именем авторизованного пользователя - кнопка удаления комментария будет недоступна
router.delete(
  "/:id/comments/:id",
  // идентифицируем пользователя
  verifyToken,
  async (req, res) => {
    const id = req.params.id;

    // находим id коммента, который хотим удалить
    const deletedComment = await Comment.find({
      _id: id,
    }).then((res) => {
      return res[0];
    });

    if (deletedComment) {
      Post.updateOne(
        { _id: deletedComment.post },
        {
          // удаляем коммент из поста в БД (массив comments в посте)
          $pullAll: {
            comments: [{ _id: req.params.id }],
          },
        }
      )
        // удаляем коммент из модели комментариев в БД
        .then(() =>
          Comment.findOneAndDelete({
            _id: id,
          })
        );
    } else {
      return;
    }

    // находим пост, в котором этот коммент, если комментарий есть

    res.status(200).send({
      message: "Комментарий удален из модели поста и из модели комментариев",
    });
  }
);

module.exports = router;
