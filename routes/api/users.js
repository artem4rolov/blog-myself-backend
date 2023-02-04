const express = require("express");
const router = express.Router();
const multer = require("multer");
const uuidv4 = require("uuid/v4");
const path = require("path");
const fs = require("fs");

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

// директория с автарами пользователей
const DIR = "./assets/users/";

// создаем путь к хранилищу аватаров
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    cb(null, uuidv4() + "-" + fileName);
  },
});

// функция загрузки аватара в хранилище
var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(
        new Error(
          "Допускаются только форматы .png, .jpg and .jpeg для аватара!"
        )
      );
    }
  },
});

// обновление токена авторизации
router.get("/profile", verifyToken, async (req, res) => {
  const { email } = req.user;
  // ищем юзера в БД по email и возвращаем на клиент
  const user = await User.findOne({ email });
  return res.status(200).json(user);
});

// при регистрации пользователя
router.post("/register", upload.single("avatar"), async (req, res) => {
  try {
    const url = req.protocol + "://" + req.get("host");

    // достаем объект ошибок и значение isValid из функции validateLoginInput
    const { errors, isValid } = validateSignUpInput(req.body);
    // достаем имя пользователя, почту и пароль из запроса пользователя (при регистрации)
    const { user_name, email, password } = req.body;
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
      avatar: req.file ? url + "/assets/users/" + req.file.filename : null,
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
router.patch(
  "/editProfile",
  verifyToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      // код со сменой имени закомментил
      // достаем объект ошибок и значение isValid из функции validateLoginInput
      const { errors, isValid } = validateUpdateProfileInput(req.body);
      if (!isValid && errors) {
        return res.status(400).json({ message: errors });
      }
      // путь к нашему бэкенду, для изображений
      const url = req.protocol + "://" + req.get("host");

      // если ошибок валидации нет - достаем никнейм из запроса пользователя (req.body)
      const { user_name } = req.body;
      // далее достаем почту пользователя, чтобы найти его (пользователя) в БД MongoDB
      const { email } = req.user;

      // ищем пользователя в БД
      const user = await User.findOne({ email });
      // достаем старый аватар пользователя, оставляем только название файла, он понадобится в случае обновления аватара, чтобы удалить старый файл из хранилища
      const oldPhoto = user.avatar
        ? user.avatar.split("/assets/users/")[1]
        : null;

      // Если есть старое фото и новое загруженное (польлзователь хочет поменять свой аватар)
      // удаляем старое фото из директории public
      if (oldPhoto && req.file) {
        const oldPath = path.join("assets/users/", oldPhoto);
        // удаляем старый аватар, если новый загружен пользователем
        fs.unlink(oldPath, (err) => {
          if (err) {
            console.error(err);
            return;
          }
        });
      }

      // создаем новый токен
      const newToken = jwt.sign(
        {
          user_id: req.user._id,
          email: req.user.email,
          user_name: user_name,
          // в новый токен также помещаем наш новый аватар, если он есть, если нет - оставляем старый
          avatar: req.file
            ? url + "/assets/users/" + req.file.filename
            : user.avatar,
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
            avatar: req.file
              ? url + "/assets/users/" + req.file.filename
              : user.avatar,
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
              comment.userImg = req.file
                ? url + "/assets/users/" + req.file.filename
                : req.user.avatar;
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
  }
);

module.exports = router;
