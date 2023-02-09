const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET;

const validateSignUpInput = require("../../validation/register.js");
const validateLoginInput = require("../../validation/login.js");
const validateUpdateProfileInput = require("../../validation/updateProfile.js");
const User = require("../../models/User");
const Post = require("../../models/Post");
const Comment = require("../../models/Comment");
const verifyToken = require("../../middleware/auth.js");

// обновление токена авторизации
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    // ищем юзера в БД по email и возвращаем на клиент
    const user = await User.findOne({ email });
    return res.status(200).json(user);
  } catch (err) {
    res.json({ message: err });
  }
});

// добавляем выбранный пост в избранную коллекцию постов пользователя
router.post("/addFavorite/:id", verifyToken, async (req, res) => {
  try {
    // находим пост в БД, который хотим добавить в избранную коллекцию постов пользователя
    const { id } = req.body;
    // console.log(id);

    // находим текущего пользователя
    await User.findOne({ email: req.user.email })
      .then((user) => {
        // пихаем туда id избранного поста
        user.favorites.push(id);
        // возвращаем из промиса объект юзера
        return user;
      })
      .then((user) => {
        // сохраняем юзера
        user.save();
        // возвращаем избранную коллекцию юзера
        return user.favorites;
      })
      // отправляем на клиент массив из коллекции постов
      .then((arr) => res.status(200).json(arr));
  } catch (err) {
    console.log(err);
  }
});

// удаляем выбранный пост из избранной коллекции постов пользователя
router.post("/removeFavorite/:id", verifyToken, async (req, res) => {
  try {
    // находим пост в БД, который хотим добавить в избранную коллекцию постов пользователя
    const { id } = req.body;

    // находим текущего юзера
    await User.findOneAndUpdate({ email: req.user.email })
      .then((user) => {
        // ищем избранный пост в коллекции юзера
        const index = user.favorites.indexOf(id);
        if (index !== 1) {
          // если такой пост есть - удаляем его из коллекции
          user.favorites.splice(index, 1);
        }
        // возвращаем из промиса объект юзера
        return user;
      })
      .then((user) => {
        // сохраняем юзера
        user.save();
        // возвращаем из промиса коллекцию избранных постов юзера
        return user.favorites;
      })
      // отправляем коллекцию на клиент
      .then((arr) => res.status(200).json(arr));
  } catch (err) {
    console.log(err);
  }
});

// поиск автора по никнейму (открывается страница с информацией о пользователе)
router.get("/profile/:user_name", async (req, res) => {
  try {
    // const { user_name } = req.params.user_name;
    // ищем юзера в БД по user_name и возвращаем на клиент
    await User.find({ user_name: req.params.user_name }).then((user) =>
      res.status(200).json(user)
    );
  } catch (err) {
    res.json({ message: err });
  }
});

// при регистрации пользователя
router.post("/register", async (req, res) => {
  try {
    // достаем объект ошибок и значение isValid из функции validateLoginInput
    const { errors, isValid } = validateSignUpInput(req.body);
    // достаем имя пользователя, почту и пароль из запроса пользователя (при регистрации)
    const { user_name, email, password, avatar } = req.body;
    if (!isValid) {
      return res.status(400).json({ message: errors });
    }
    // если нет ошибок валидации - сначала ищем пользователя в БД MongoDB, вдруг он уже есть в базе
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(409).send({
        message: "Такой пользователь уже существует",
      });
    }

    // шифруем пароль
    encryptedPassword = await bcrypt.hash(password, 10);

    // создаем пользователя в БД
    const user = await User.create({
      // если аватар загружен пользователем - добавляем его к полю avatar, если нет - null
      avatar: avatar,
      user_name: user_name,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });

    // создаем токен
    const token = jwt.sign(
      {
        user_id: user._id,
        email: user.email,
        user_name: user.user_name,
        avatar: user.avatar,
      },
      SECRET,
      {
        expiresIn: 3600,
      }
    );

    // сохраняем токен пользователя
    user.token = token;
    user.save();

    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

// при авторизации пользователя
router.post("/login", async (req, res) => {
  try {
    // достаем объект ошибок и значение isValid из функции validateLoginInput
    const { errors, isValid } = validateLoginInput(req.body);
    if (!isValid && errors) {
      return res.status(400).json({ message: errors });
    }
    // если ошибок валидации нет - достаем логин и пароль из запроса пользователя (req.body)
    const { email, password, user_name } = req.body;
    // ищем юзера в БД MongoDB

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).send({ message: "Такого пользователя не существует" });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      // создаем новый токен
      const newToken = jwt.sign(
        {
          user_id: user._id,
          email: user.email,
          user_name: user.user_name,
          avatar: user.avatar,
        },
        SECRET,
        {
          expiresIn: 3600,
        }
      );

      // сохраняем новый токен пользователя
      user.token = newToken;

      // обновляем токен пользователя в БД
      user
        .updateOne({ _id: user._id }, { $set: { token: newToken } })
        .then(() => user.save());

      res.status(200).json(user);
    }
  } catch (err) {
    console.log(err);
  }
});

// при обновлении профиля пользователя
router.patch("/editProfile", verifyToken, async (req, res) => {
  try {
    // console.log(req);
    // код со сменой имени закомментил
    // достаем объект ошибок и значение isValid из функции validateLoginInput
    const { errors, isValid } = validateUpdateProfileInput(req.body);
    if (!isValid && errors) {
      return res.status(400).json({ message: errors });
    }
    // если ошибок валидации нет - достаем никнейм из запроса пользователя (req.body)
    const { user_name, avatar } = req.body;
    // далее достаем почту пользователя, чтобы найти его (пользователя) в БД MongoDB
    const { email } = req.user;

    // ищем пользователя в БД
    const user = await User.findOne({ email });

    // создаем новый токен
    const newToken = jwt.sign(
      {
        user_id: req.user._id,
        email: req.user.email,
        user_name: user_name,
        // в новый токен также помещаем наш новый аватар, если он есть, если нет - оставляем старый
        avatar: avatar !== null ? avatar : req.user.avatar,
      },
      SECRET,
      {
        expiresIn: 3600,
      }
    );

    // теперь обновляем поля с именем и аватаром пользователя
    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          // имя пользователя - значение из запроса (req.body)
          user_name: user_name,
          token: newToken,
          // в новый токен также помещаем наш новый аватар, если он есть, если нет - оставляем старый
          avatar: avatar !== null ? avatar : req.user.avatar,
        },
      }, // возвращаем новый документ в БД
      { new: true }
    )
      .then((doc) => res.status(200).json(doc))
      .catch((err) => {
        res.status(400).send({ message: "Ошибка при обновлении профиля" }),
          console.log(err);
      });

    // обновляем автора во всех комментариях этого автора
    await Comment.find({ author: req.user.user_name })
      .then((comments) => {
        comments.forEach((comment) => {
          if (comment.author === req.user.user_name || user.user_name) {
            comment.author = user_name;
            comment.userImg = avatar !== null ? avatar : req.user.avatar;
          }
          comment.save();
        });
      })
      .then(() => {});

    // обновляем автора во всех постах автора
    await Post.find({ author: req.user.user_name })
      .then((posts) => {
        posts.forEach((post) => {
          if (post.author === req.user.user_name) {
            post.author = user_name;
          }
          post.save();
        });
      })
      .then(() => {});
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
