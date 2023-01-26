const express = require("express");
const router = express.Router();
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const passport = require("passport");
const validatePostInput = require("../../validation/post");
const auth = require("../../middleware/auth");

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
router.get("/:id/comment", (req, res) => {
  res.render("post-comment", { title: "Напишите комментарий" });
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
router.post(
  "/create",
  // passport.authenticate("jwt", { session: false }),
  auth,
  (req, res) => {
    const author = req.user.email;
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

// Создание комментария к посту
router.post(
  "/:id/comment",
  // passport.authenticate("jwt", { session: false }),
  auth,
  async (req, res) => {
    // находим id поста, к которому хотим создать комментарий
    const id = req.params.id;
    // запоминаем автора, который создал комменатрий
    const author = req.user.email;
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

// Обновление поста
router.patch(
  "/update/:id",
  // passport.authenticate("jwt", { session: false }),
  auth,
  (req, res) => {
    // вытаскиваем автора из запроса
    const author = req.user.email;
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
  auth,
  async (req, res) => {
    // ищем автора поста
    const author = req.user.email;
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
            .then((res) =>
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
  "/:id/comment/:id",
  // идентифицируем пользователя
  // passport.authenticate("jwt", { session: false }),
  auth,
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
        )
        .then(() =>
          console.log(
            "Комментарий удален из модели поста и из модели комментариев"
          )
        );
    } else {
      return;
    }

    // находим пост, в котором этот коммент, если комментарий есть

    res.send("Комментарий удален из модели поста и из модели комментариев");
  }
);

module.exports = router;
