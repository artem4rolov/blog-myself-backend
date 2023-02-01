const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = validateUpdateProfileInput = (data) => {
  let errors = {};

  // достаем данные, которые дал пользователь
  let { user_name } = data;
  user_name = !isEmpty(user_name) ? user_name : "";

  // если поле с именем пользователя пустое
  if (Validator.isEmpty(user_name)) {
    errors.user_name = "Укажите имя";
  }

  // если все ок - возвращаем объект isValid в значении true
  return {
    errors,
    isValid: isEmpty(errors),
  };
};
