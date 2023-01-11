const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = validatePostInput = (data) => {
  let errors = {};

  // достаем данные, которые дал пользователь
  let { title, body } = data;
  // конвертируем пустые значения в пустые строки "", поскольку валидатор работает только со строками (String)
  title = !isEmpty(title) ? title : "";
  body = !isEmpty(body) ? body : "";

  if (Validator.isEmpty(title)) {
    errors.title = "Укажите заголовок";
  }
  if (Validator.isEmpty(body)) {
    errors.body = "Укажите описание";
  }

  // если все ок - возвращаем объект isValid в значении true
  return {
    errors,
    isValid: isEmpty(errors),
  };
};
