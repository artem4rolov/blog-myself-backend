// библиотека для создания сервера
const express = require("express");
// создаем наше приложение на основе библиотеки express
const app = express();
// cors - politicy
const cors = require("cors");
// даем доступ к бэкенду (обходим cors)
app.use(cors());
// dotenv для использования переменных окружения
require("dotenv").config();
// библиотека для подключения к MongoDB
const mongoose = require("mongoose");
// библиотека для работа с jwt-токеном авторизации пользователя
const passport = require("passport");
// библиотека для расшифровки объекта запроса пользователя request (req.body)
const bodyParser = require("body-parser");

// достаем пути запросов для пользователей
const users = require("./routes/api/users");
// учим наше приложение читать JSON - формат данных (который в req.body)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// подключаем бд MongoDB
mongoose
  // используем переменную окружения
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB ОK"))
  .catch((err) => console.log(err));

// запросы
// тест
app.get("/", (req, res) => {
  res.json({
    message: "Hello from backend",
  });
});
app.use("/assets/users/", express.static("assets/users/"));
app.use("/assets/posts/", express.static("assets/posts/"));
// авторизация, регистрация
app.use("/api/users", users);
// посты - получение, создание, обновление, удаление
app.use("/api/posts/", require("./routes/api/posts"));

// создаем порт для хоста
const PORT = process.env.PORT || 5000;
// запускаем сервер на порту localHost:5000
app.listen(PORT, () => {
  console.log("Сервер запущен на порту " + PORT);
});
