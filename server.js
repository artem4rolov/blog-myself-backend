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

const verifyToken = require("./middleware/auth.js");

// библиотека для расшифровки объекта запроса пользователя request (req.body)
const bodyParser = require("body-parser");

const multer = require("multer");
const fs = require("fs");

// достаем пути запросов для пользователей и постов
const users = require("./routes/api/users");
const posts = require("./routes/api/posts");
// учим наше приложение читать JSON - формат данных (который в req.body)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// подключаем бд MongoDB
mongoose
  // используем переменную окружения
  .connect(
    "mongodb+srv://admin:12345@cluster0.ptyjg7b.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB ОK"))
  .catch((err) => console.log(err));

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
    cb(null, "uploads");
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// запросы
// тест
app.get("/", (req, res) => {
  res.json({
    message: "Hello from backend",
  });
});

app.get("/uploads", verifyToken, (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});

// загрузка изображений
app.post("/upload", verifyToken, upload.single("image"), (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});
// отображаем загруженные картинки
app.use("/uploads/", express.static("uploads/"));
// авторизация, регистрация
app.use("/api/users", users);
// посты - получение, создание, обновление, удаление
app.use("/api/posts/", posts);

// создаем порт для хоста
const PORT = process.env.PORT || 5000;
// запускаем сервер на порту localHost:2222
app.listen(PORT, () => {
  console.log("Сервер запущен на порту " + PORT);
});
