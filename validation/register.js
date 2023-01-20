const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = validateRegisterInput = (data) => {
  let errors = {};

  // достаем данные, которые дал пользователь
  let { user_name, email, password } = data;
  // конвертируем пустые значения в пустые строки "", поскольку валидатор работает только со строками (String)
  user_name = !isEmpty(user_name) ? user_name : "";
  email = !isEmpty(email) ? email : "";
  password = !isEmpty(password) ? password : "";

  if (Validator.isEmpty(user_name)) {
    errors.user_name = "Укажите имя пользователя";
  }

  if (Validator.isEmpty(email)) {
    errors.email = "Укажите e-mail";
  } else if (!Validator.isEmail(email)) {
    errors.email = "Укажите корректный e-mail (пример - ivan@mail.ru)";
  }

  if (Validator.isEmpty(password)) {
    errors.password = "Укажите пароль";
  } else if (!Validator.isLength(password, { min: 6, max: 30 })) {
    errors.password = "Пароль должен состоять минимум из 6 символов";
  }

  // если все ок - возвращаем объект isValid в значении true
  return {
    errors,
    isValid: isEmpty(errors),
  };
};
