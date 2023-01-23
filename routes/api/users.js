const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET;

const validateSignUpInput = require("../../validation/register.js");
const validateLoginInput = require("../../validation/login.js");
const User = require("../../models/User");
const verifyToken = require("../../middleware/auth.js");

router.get("/profile", verifyToken, (req, res) => {
  const user = req.user;

  return res.status(201).json(user);
});

// при регистрации пользователя
router.post("/register", async (req, res) => {
  try {
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
        message: "Такой пользователь уже существует, Вы можете войти",
      });
    }

    // шифруем пароль
    encryptedPassword = await bcrypt.hash(password, 10);

    // создаем пользователя в БД
    const user = await User.create({
      user_name,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });

    // создаем токен
    const token = jwt.sign({ user_id: user._id, email, user_name }, SECRET, {
      expiresIn: 3600,
    });

    user.token = token;

    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }

  // User.findOne({ $or: [{ email }, { user_name }] }).then((user) => {
  //   if (user) {
  //     // если такой пользователь уже есть (имя или почта одинаковые)
  //     if (user.email === email)
  //       return res.status(400).json({ email: "Такой e-mail уже использутся" });
  //     else return res.status(400).json({ user_name: "Такое имя уже занято" });
  //   } else {
  //     // если такого пользователя нет в БД MongoDB - создаем нового пользователя
  //     const newUser = new User({ user_name, email, password });
  //     // Создаем токен
  //     const token = jwt.sign(
  //       {
  //         user_id: newUser.id,
  //         email: newUser.email,
  //         user_name: newUser.user_name,
  //       },
  //       SECRET,
  //       {
  //         expiresIn: 500,
  //       }
  //     );
  //     // сохраняем токен юзера
  //     newUser.token = token;
  //     // шифруем пароль пользователя до того, как создадим объект пользователя в БД MongoDB
  //     bcrypt.genSalt(10, (err, salt) => {
  //       bcrypt.hash(newUser.password, salt, (err, hash) => {
  //         if (err) throw err;
  //         // если ошибок после шифрования нет - шифруем пароль в БД MongoDB
  //         newUser.password = hash;
  //         // сохраняем пользователя в БД MongoDB
  //         newUser
  //           .save()
  //           .then((user) => res.json(user))
  //           .catch((err) => console.log({ error: "Ошибка при регистрации" }));
  //       });
  //     });
  //   }
  // });
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
    const { email, password } = req.body;
    // ищем юзера в БД MongoDB

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).send({ message: "Такого пользователя не существует" });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      // создаем токен
      const newToken = jwt.sign(
        { user_id: user._id, email, user_name: user.user_name },
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

  // User.findOne({ email }).then((user) => {
  //   if (!user) {
  //     return res.status(404).json({ email: "Такого e-mail не существует" });
  //   }
  //   // если юзер найден - сверяем пароль
  //   bcrypt.compare(password, user.password).then((isMatch) => {
  //     // если все ок - достаем id, имя и email пользователя из БД MongoDB, даем токен пользователю
  //     if (isMatch) {
  //       const payload = {
  //         id: user.id,
  //         email: user.email,
  //         user_name: user.user_name,
  //       };
  //       // даем токен пользователю, чтобы он мог работать с постами (удалять / создавать)
  //       const token = jwt.sign(payload, SECRET, { expiresIn: "2h" });
  //       user.token = token;
  //     } else {
  //       return res.status(400).json({ password: "Неверный пароль" });
  //     }
  //   });
  //   res.send(user);
  // });
});
module.exports = router;
