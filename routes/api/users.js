const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET;

const validateSignUpInput = require("../../validation/signup.js");
const validateLoginInput = require("../../validation/login.js");
const User = require("../../models/User");

// при регистрации пользователя
router.post("/signup", (req, res) => {
  // достаем объект ошибок и значение isValid из функции validateLoginInput
  const { errors, isValid } = validateSignUpInput(req.body);
  // достаем имя пользователя, почту и пароль из запроса пользователя (при регистрации)
  const { user_name, email, password } = req.body;
  if (!isValid) {
    return res.status(400).json(errors);
  }
  // если нет ошибок валидации - сначала ищем пользователя в БД MongoDB
  User.findOne({ $or: [{ email }, { user_name }] }).then((user) => {
    if (user) {
      // если такой пользователь уже есть (имя или почта одинаковые)
      if (user.email === email)
        return res.status(400).json({ email: "Такой e-mail уже использутся" });
      else return res.status(400).json({ user_name: "Такое имя уже занято" });
    } else {
      // если такого пользователя нет в БД MongoDB - создаем нового пользователя
      const newUser = new User({ user_name, email, password });
      // шифруем пароль пользователя до того, как создадим объект пользователя в БД MongoDB
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          // если ошибок после шифрования нет - шифруем пароль в БД MongoDB
          newUser.password = hash;
          // сохраняем пользователя в БД MongoDB
          newUser
            .save()
            .then((user) => res.json(user))
            .catch((err) => console.log({ error: "Ошибка при регистрации" }));
        });
      });
    }
  });
});

// при авторизации пользователя
router.post("/login", (req, res) => {
  // достаем объект ошибок и значение isValid из функции validateLoginInput
  const { errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  // если ошибок валидации нет - достаем логин и пароль из запроса пользователя (req.body)
  const { email, password } = req.body;
  // ищем юзера в БД MongoDB
  User.findOne({ email }).then((user) => {
    if (!user) {
      return res.status(404).json({ email: "Такого e-mail не существует" });
    }
    // если юзер найден - сверяем пароль
    bcrypt.compare(password, user.password).then((isMatch) => {
      // если все ок - достаем id и имя пользователя из БД MongoDB, даем токен пользователю
      if (isMatch) {
        const payload = {
          id: user.id,
          user_name: user.user_name,
        };
        // даем токен пользователю, чтобы он мог работать с постами (удалять / создавать)
        jwt.sign(payload, SECRET, { expiresIn: 3600 }, (err, token) => {
          if (err) {
            console.log(err);
          }
          return res.json({
            success: true,
            token: "Bearer " + token,
          });
        });
      } else {
        return res.status(400).json({ password: "Неверный пароль" });
      }
    });
  });
});
module.exports = router;
