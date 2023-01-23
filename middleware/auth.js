const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET;

// проверяем наличие токена jwt при запросе пользователя на сервер

const verifyToken = (req, res, next) => {
  const token = req.body.token || req.query.token || req.headers["token"];

  if (!token) {
    return res.status(403).send("Токен авторизации не получен");
  }
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Неверный токен");
  }
  return next();
};

module.exports = verifyToken;
