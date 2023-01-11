const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../models/User");
const SECRET = process.env.SECRET;

// объект opts содержит jwt-токен пользователя и секретный ключ
// это нужно, чтобы пользователь постоянно не авторизовывался при создании/удалении постов
const opts = {};
// достаем jwt-токен
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
// указываем секретный ключ из переменной окружения
opts.secretOrKey = SECRET;

module.exports = (passport) => {
  passport.use(
    // JwtStrategy принимает данные - id и имя пользователя
    new JwtStrategy(opts, (jwt_payload, done) => {
      // ищем пользователя с таким id в БД MongoDB
      User.findOne({ _id: jwt_payload.id })
        .then((user) => {
          if (user) {
            // если такой юзер найден - возвращаем пустой объект с ошибками, и объект юзера
            return done(null, user);
          } else {
            return done(null, false);
          }
        })
        .catch((err) =>
          console.log({ error: "Ошибка авторизации пользователя" })
        );
    })
  );
};
