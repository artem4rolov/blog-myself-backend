const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = validateLoginInput = (data) => {
  let errors = {};

  // достаем данные, которые дал пользователь
  let { email, password } = data;
  // конвертируем пустые значения в пустые строки "", поскольку валидатор работает только со строками (String)
  email = !isEmpty(email) ? email : "";
  password = !isEmpty(password) ? password : "";

  // если поле с мылом пустое
  if (Validator.isEmpty(email)) {
    errors.email = "Укажите e-mail";
    // если некорректное мыло
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
