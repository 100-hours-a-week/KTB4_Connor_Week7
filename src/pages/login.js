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

function validateLoginEmail(shouldShowMessage = false) {
  const value = emailInput.value.trim();
  let message = "";

  if (!value) {
    message = LOGIN_EMAIL_REQUIRED;
  } else if (!isValidEmail(value)) {
    message = LOGIN_EMAIL_FORMAT;
  }
  emailHelper.textContent = shouldShowMessage ? message : "";
  return message === "";
}

function validateLoginPassword(shouldShowMessage = false) {
  const value = passwordInput.value;
  let message = "";

  if (!value) message = LOGIN_PASSWORD_REQUIRED;

  passwordHelper.textContent = shouldShowMessage ? message : "";
  return message === "";
}

function syncLoginSubmitButton() {
  formHelper.textContent = "";
  submitButton.disabled = !(validateLoginEmail(false) && validateLoginPassword(false));
}

emailInput.addEventListener("input", syncLoginSubmitButton);
passwordInput.addEventListener("input", syncLoginSubmitButton);
emailInput.addEventListener("blur", () => validateLoginEmail(true));
passwordInput.addEventListener("blur", () => validateLoginPassword(true));

async function submitLoginForm(event) {
  event.preventDefault();

  const isEmailValid = validateLoginEmail(true);
  const isPasswordValid = validateLoginPassword(true);

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
}

form.addEventListener("submit", submitLoginForm);

syncLoginSubmitButton();
