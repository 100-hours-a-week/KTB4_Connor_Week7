import { login } from "../api/auth.js";
import { LOGIN_EMAIL_FORMAT, LOGIN_EMAIL_REQUIRED, LOGIN_PASSWORD_REQUIRED } from "../constants/messages.js";
import { routes } from "../utils/routes.js";
import { saveSession } from "../utils/session.js";
import { isValidEmail } from "../utils/validation.js";

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
    message = LOGIN_EMAIL_REQUIRED;
  } else if (!isValidEmail(value)) {
    message = LOGIN_EMAIL_FORMAT;
  }
  emailHelper.textContent = showMessage ? message : "";
  return message === "";
}

function validatePassword(showMessage = false) {
  const value = passwordInput.value;
  let message = "";

  if (!value) message = LOGIN_PASSWORD_REQUIRED;

  passwordHelper.textContent = showMessage ? message : "";
  return message === "";
}

function updateSubmitState() {
  formHelper.textContent = "";
  submitButton.disabled = !(validateEmail(false) && validatePassword(false));
}

emailInput.addEventListener("input", updateSubmitState);
passwordInput.addEventListener("input", updateSubmitState);
emailInput.addEventListener("blur", () => validateEmail(true));
passwordInput.addEventListener("blur", () => validatePassword(true));

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const isEmailValid = validateEmail(true);
  const isPasswordValid = validatePassword(true);

  if (!isEmailValid || !isPasswordValid) return;

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
