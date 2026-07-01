import { uploadImage } from "../api/images.js";
import { signup } from "../api/users.js";
import {
    PASSWORD_POLICY,
    SIGNUP_EMAIL_FORMAT,
    SIGNUP_EMAIL_REQUIRED,
    SIGNUP_EMAIL_SPACE,
    SIGNUP_FAILURE,
    SIGNUP_NICKNAME_LENGTH,
    SIGNUP_PASSWORD_CONFIRM_REQUIRED,
    SIGNUP_PASSWORD_MISMATCH,
    SIGNUP_PASSWORD_REQUIRED,
    SIGNUP_PROFILE_REQUIRED,
    USER_EMAIL_DUPLICATE,
    USER_NICKNAME_DUPLICATE,
    USER_NICKNAME_REQUIRED,
    USER_NICKNAME_SPACE,
} from "../constants/messages.js";
import { setButtonLoading, setHelperText } from "../utils/form.js";
import { createImagePreviewController } from "../utils/image-preview.js";
import { routes } from "../utils/routes.js";
import { isValidEmail, isValidNickname, isValidPassword, setValidationMessage } from "../utils/validation.js";

const form = document.querySelector(".signup-form");
const profileInput = document.querySelector("#profile-image");
const profileUpload = document.querySelector(".profile-upload");
const profilePreview = document.querySelector(".profile-preview");
const profileHelper = document.querySelector("#profile-helper");
const emailInput = document.querySelector("#signup-email");
const passwordInput = document.querySelector("#signup-password");
const passwordConfirmInput = document.querySelector("#password-confirm");
const nicknameInput = document.querySelector("#nickname");
const emailHelper = document.querySelector("#email-helper");
const passwordHelper = document.querySelector("#password-helper");
const passwordConfirmHelper = document.querySelector("#password-confirm-helper");
const nicknameHelper = document.querySelector("#nickname-helper");
const formHelper = document.querySelector("#form-helper");
const submitButton = document.querySelector(".signup-button");

let profileFile = null;
const profilePreviewController = createImagePreviewController({
    image: profilePreview,
    onShow() {
        profileUpload.classList.add("has-image");
    },
    onClear() {
        profileUpload.classList.remove("has-image");
    },
});

function canSubmitSignupForm() {
    return (
        Boolean(profileFile) &&
        isValidEmail(emailInput.value) &&
        isValidPassword(passwordInput.value) &&
        passwordConfirmInput.value === passwordInput.value &&
        isValidNickname(nicknameInput.value)
    );
}

function validateSignupProfileImage(shouldShowMessage = false) {
    return setValidationMessage(profileHelper, profileFile ? "" : SIGNUP_PROFILE_REQUIRED, shouldShowMessage);
}

function validateSignupEmail(shouldShowMessage = false) {
    const value = emailInput.value;
    let message = "";

    if (!value.trim()) {message = SIGNUP_EMAIL_REQUIRED;}
    else if (/\s/.test(value)) {message = SIGNUP_EMAIL_SPACE;}
    else if (!isValidEmail(value)) {message = SIGNUP_EMAIL_FORMAT;}
    return setValidationMessage(emailHelper, message, shouldShowMessage);
}

function validateSignupPassword(shouldShowMessage = false) {
    const value = passwordInput.value;
    let message = "";

    if (!value) {message = SIGNUP_PASSWORD_REQUIRED;}
    else if (!isValidPassword(value)) {message = PASSWORD_POLICY;}
    else if (passwordConfirmInput.value && value !== passwordConfirmInput.value) {message = SIGNUP_PASSWORD_MISMATCH;}
    return setValidationMessage(passwordHelper, message, shouldShowMessage);
}

function validateSignupPasswordConfirm(shouldShowMessage = false) {
    const value = passwordConfirmInput.value;
    let message = "";

    if (!value) {message = SIGNUP_PASSWORD_CONFIRM_REQUIRED;}
    else if (value !== passwordInput.value) {message = SIGNUP_PASSWORD_MISMATCH;}
    return setValidationMessage(passwordConfirmHelper, message, shouldShowMessage);
}

function validateSignupNickname(shouldShowMessage = false) {
    const value = nicknameInput.value;
    let message = "";

    if (!value.trim()) {message = USER_NICKNAME_REQUIRED;}
    else if (String(value).includes(" ")) {message = USER_NICKNAME_SPACE;}
    else if (value.length > 10) {message = SIGNUP_NICKNAME_LENGTH;}
    return setValidationMessage(nicknameHelper, message, shouldShowMessage);
}

function syncSignupSubmitButton() {
    setHelperText(formHelper);
    submitButton.disabled = !canSubmitSignupForm();
}

function setSignupSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting || !canSubmitSignupForm();
    setButtonLoading(submitButton, isSubmitting, "회원가입 중...", "회원가입");
}

function setSignupProfileFile(file) {
    profileFile = file;
    profilePreviewController.showFile(file);
    setHelperText(profileHelper);
}

function clearSignupProfileFile() {
    profileFile = null;
    profileInput.value = "";
    profilePreviewController.clear();
}

function showSignupFailure(message) {
    if (message.includes("이메일")) {
        setHelperText(emailHelper, USER_EMAIL_DUPLICATE);
        return;
    }

    if (message.includes("닉네임")) {
        setHelperText(nicknameHelper, USER_NICKNAME_DUPLICATE);
        return;
    }

    setHelperText(formHelper, message);
}

profileInput.addEventListener("change", () => {
    const file = profileInput.files[0];
    if (file) setSignupProfileFile(file);
    syncSignupSubmitButton();
});

profileInput.addEventListener("click", () => {
    if (profileFile) {
        clearSignupProfileFile();
        syncSignupSubmitButton();
    }
});

emailInput.addEventListener("input", () => {
    validateSignupEmail(/\s/.test(emailInput.value));
    syncSignupSubmitButton();
});

passwordInput.addEventListener("input", () => {
    passwordHelper.textContent = "";
    passwordConfirmHelper.textContent = "";
    syncSignupSubmitButton();
});

passwordConfirmInput.addEventListener("input", () => {
    passwordConfirmHelper.textContent = "";
    syncSignupSubmitButton();
});

nicknameInput.addEventListener("input", () => {
    nicknameHelper.textContent = "";
    syncSignupSubmitButton();
});

profileInput.addEventListener("blur", () => validateSignupProfileImage(true));
emailInput.addEventListener("blur", () => validateSignupEmail(true));
passwordInput.addEventListener("blur", () => {
    validateSignupPassword(true);
    validateSignupPasswordConfirm(Boolean(passwordConfirmInput.value));
});
passwordConfirmInput.addEventListener("blur", () => validateSignupPasswordConfirm(true));
nicknameInput.addEventListener("blur", () => validateSignupNickname(true));

async function submitSignupForm(event) {
    event.preventDefault();

    const isValid = [
        validateSignupProfileImage(true),
        validateSignupEmail(true),
        validateSignupPassword(true),
        validateSignupPasswordConfirm(true),
        validateSignupNickname(true),
    ].every(Boolean);

    if (!isValid) {
        submitButton.disabled = true;
        return;
    }

    setSignupSubmitting(true);

    try {
        const profileImage = await uploadImage(profileFile, SIGNUP_FAILURE);
        await signup({
            email: emailInput.value.trim(),
            password: passwordInput.value,
            nickname: nicknameInput.value.trim(),
            profileImage,
        });
        globalThis.location.href = routes.login;
    } catch (error) {
        showSignupFailure(error.message || SIGNUP_FAILURE);
    } finally {
        setSignupSubmitting(false);
    }
}

form.addEventListener("submit", submitSignupForm);

syncSignupSubmitButton();
