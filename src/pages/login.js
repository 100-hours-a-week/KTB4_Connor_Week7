import { login } from "../api/auth.js";
import { routes } from "../utils/routes.js";
import { saveSession } from "../utils/session.js";
import { isValidEmail } from "../utils/validation.js";

const EMAIL_REQUIRED_MESSAGE = "* 이메일을 입력해주세요.";
const EMAIL_FORMAT_MESSAGE = "* 올바른 이메일 주소 형식을 입력해주세요.";
const PASSWORD_REQUIRED_MESSAGE = "* 비밀번호를 입력해주세요";

const form = document.querySelector(".login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const emailHelper = document.querySelector("#email-helper");
const passwordHelper = document.querySelector("#password-helper");
const formHelper = document.querySelector("#form-helper");
const submitButton = document.querySelector(".login-button");

function validateEmail(showMessage = false) {
  const value = emailInput.value.trim();
  let message = "";

  if (!value) {
    message = EMAIL_REQUIRED_MESSAGE;
  } else if (!isValidEmail(value)) {
    message = EMAIL_FORMAT_MESSAGE;
  }

  emailHelper.textContent = showMessage ? message : "";
  return message === "";
}

function validatePassword(showMessage = false) {
  const value = passwordInput.value;
  let message = "";

  if (!value) {
    message = PASSWORD_REQUIRED_MESSAGE;
  }

  passwordHelper.textContent = showMessage ? message : "";
  return message === "";
}

function updateSubmitState() {
  formHelper.textContent = "";
  submitButton.disabled = !(validateEmail(false) && validatePassword(false));
}

emailInput.addEventListener("input", updateSubmitState);
passwordInput.addEventListener("input", updateSubmitState);
emailInput.addEventListener("input", () => validateEmail(true));
passwordInput.addEventListener("input", () => validatePassword(true));

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const isEmailValid = validateEmail(true);
  const isPasswordValid = validatePassword(true);

  if (!isEmailValid || !isPasswordValid) {
    return;
  }

  try {
    const user = await login({
      email: emailInput.value.trim(),
      password: passwordInput.value,
    });
    saveSession(user);
    globalThis.location.href = routes.posts;
  } catch (error) {
    formHelper.textContent = error.message;
  }
});

updateSubmitState();
