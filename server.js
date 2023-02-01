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

// достаем переменную окружения
const MONGO_URI = process.env.MONGO_URI;
// подключаем бд MongoDB
mongoose
  // используем переменную окружения
  .connect(
    "mongodb+srv://admin:12345@cluster0.ptyjg7b.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB ОK"))
  .catch((err) => console.log(err));

// mongoose.set("useFindAndModify", false);
// mongoose.Promise = global.Promise;

// // используем данные jwt-токена авторизации пользователя
// app.use(passport.initialize());
// require("./middleware/passport")(passport);

// запросы
// тест
app.get("/", (req, res) => {
  res.json({
    message: "Hello from backend",
  });
});
app.use("/public", express.static("public"));
// авторизация, регистрация
app.use("/api/users", users);
// посты - получение, создание, обновление, удаление
app.use("/api/posts/", require("./routes/api/posts"));

// создаем порт для хоста
const PORT = process.env.PORT || 5000;
// запускаем сервер на порту localHost:2222
app.listen(PORT, () => {
  console.log("Сервер запущен на порту " + PORT);
});
