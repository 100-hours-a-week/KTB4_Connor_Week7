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
import { isValidEmail, isValidNickname, isValidPassword, showMessage } from "../utils/validation.js";

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

function canSubmit() {
    return (
        Boolean(profileFile) &&
        isValidEmail(emailInput.value) &&
        isValidPassword(passwordInput.value) &&
        passwordConfirmInput.value === passwordInput.value &&
        isValidNickname(nicknameInput.value)
    );
}

function validateProfile(showMessageValue = false) {
    return showMessage(profileHelper, profileFile ? "" : SIGNUP_PROFILE_REQUIRED, showMessageValue);
}

function validateEmail(showMessageValue = false) {
    const value = emailInput.value;
    let message = "";

    if (!value.trim()) {message = SIGNUP_EMAIL_REQUIRED;}
    else if (/\s/.test(value)) {message = SIGNUP_EMAIL_SPACE;}
    else if (!isValidEmail(value)) {message = SIGNUP_EMAIL_FORMAT;}
    return showMessage(emailHelper, message, showMessageValue);
}

function validatePassword(showMessageValue = false) {
    const value = passwordInput.value;
    let message = "";

    if (!value) {message = SIGNUP_PASSWORD_REQUIRED;}
    else if (!isValidPassword(value)) {message = PASSWORD_POLICY;}
    else if (passwordConfirmInput.value && value !== passwordConfirmInput.value) {message = SIGNUP_PASSWORD_MISMATCH;}
    return showMessage(passwordHelper, message, showMessageValue);
}

function validatePasswordConfirm(showMessageValue = false) {
    const value = passwordConfirmInput.value;
    let message = "";

    if (!value) {message = SIGNUP_PASSWORD_CONFIRM_REQUIRED;}
    else if (value !== passwordInput.value) {message = SIGNUP_PASSWORD_MISMATCH;}
    return showMessage(passwordConfirmHelper, message, showMessageValue);
}

function validateNickname(showMessageValue = false) {
    const value = nicknameInput.value;
    let message = "";

    if (!value.trim()) {message = USER_NICKNAME_REQUIRED;}
    else if (String(value).includes(" ")) {message = USER_NICKNAME_SPACE;}
    else if (value.length > 10) {message = SIGNUP_NICKNAME_LENGTH;}
    return showMessage(nicknameHelper, message, showMessageValue);
}

function updateSubmitState() {
    setHelperText(formHelper);
    submitButton.disabled = !canSubmit();
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading || !canSubmit();
    setButtonLoading(submitButton, isLoading, "회원가입 중...", "회원가입");
}

function setProfileFile(file) {
    profileFile = file;
    profilePreviewController.showFile(file);
    setHelperText(profileHelper);
}

function clearProfileFile() {
    profileFile = null;
    profileInput.value = "";
    profilePreviewController.clear();
}

function showSignupError(message) {
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
    if (file) setProfileFile(file);
    updateSubmitState();
});

profileInput.addEventListener("click", () => {
    if (profileFile) {
        clearProfileFile();
        updateSubmitState();
    }
});

emailInput.addEventListener("input", () => {
    validateEmail(/\s/.test(emailInput.value));
    updateSubmitState();
});

passwordInput.addEventListener("input", () => {
    passwordHelper.textContent = "";
    passwordConfirmHelper.textContent = "";
    updateSubmitState();
});

passwordConfirmInput.addEventListener("input", () => {
    passwordConfirmHelper.textContent = "";
    updateSubmitState();
});

nicknameInput.addEventListener("input", () => {
    nicknameHelper.textContent = "";
    updateSubmitState();
});

profileInput.addEventListener("blur", () => validateProfile(true));
emailInput.addEventListener("blur", () => validateEmail(true));
passwordInput.addEventListener("blur", () => {
    validatePassword(true);
    validatePasswordConfirm(Boolean(passwordConfirmInput.value));
});
passwordConfirmInput.addEventListener("blur", () => validatePasswordConfirm(true));
nicknameInput.addEventListener("blur", () => validateNickname(true));

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const isValid = [
        validateProfile(true),
        validateEmail(true),
        validatePassword(true),
        validatePasswordConfirm(true),
        validateNickname(true),
    ].every(Boolean);

    if (!isValid) {
        submitButton.disabled = true;
        return;
    }

    setLoading(true);

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
        showSignupError(error.message || SIGNUP_FAILURE);
    } finally {
        setLoading(false);
    }
});

updateSubmitState();
