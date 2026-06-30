function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,20}$/.test(value);
}

function isValidNickname(value) {
  return Boolean(value.trim()) && !/\s/.test(value) && value.length <= 10;
}

function showMessage(helper, message, showMessageValue) {
  helper.textContent = showMessageValue ? message : "";
  return message === "";
}

export { isValidEmail, isValidNickname, isValidPassword, showMessage };
