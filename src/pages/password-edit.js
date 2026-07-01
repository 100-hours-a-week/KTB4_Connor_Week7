import { updatePassword } from "../api/users.js";
import { createHeaderProfile } from "../components/header-profile.js";
import { createToast } from "../components/toast.js";
import {
    PASSWORD_CURRENT_REQUIRED,
    PASSWORD_NEW_REQUIRED,
    PASSWORD_POLICY,
    PASSWORD_UPDATE_FAILURE,
} from "../constants/messages.js";
import { setButtonLoading, setHelperText } from "../utils/form.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { accessToken } from "../utils/session.js";
import { isValidPassword, showMessage } from "../utils/validation.js";

const form = document.querySelector(".password-edit-form");
const currentPasswordInput = document.querySelector("#current-password");
const newPasswordInput = document.querySelector("#new-password");
const currentPasswordHelper = document.querySelector("#current-password-helper");
const newPasswordHelper = document.querySelector("#new-password-helper");
const formHelper = document.querySelector("#form-helper");
const submitButton = document.querySelector(".password-submit");
const toast = document.querySelector(".toast");

const headerProfile = createHeaderProfile();
const updateToast = createToast(toast);

function canSubmit() {
    return Boolean(accessToken()) && isValidPassword(currentPasswordInput.value) && isValidPassword(newPasswordInput.value);
}

function validateCurrentPassword(showMessageValue = false) {
    const value = currentPasswordInput.value;
    let message = "";

    if (!value) {
        message = PASSWORD_CURRENT_REQUIRED;
    } else if (!isValidPassword(value)) {
        message = PASSWORD_POLICY;
    }

    return showMessage(currentPasswordHelper, message, showMessageValue);
}

function validateNewPassword(showMessageValue = false) {
    const value = newPasswordInput.value;
    let message = "";

    if (!value) {
        message = PASSWORD_NEW_REQUIRED;
    } else if (!isValidPassword(value)) {
        message = PASSWORD_POLICY;
    }

    return showMessage(newPasswordHelper, message, showMessageValue);
}

function updateSubmitState() {
    setHelperText(formHelper);
    submitButton.disabled = !canSubmit();
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading || !canSubmit();
    setButtonLoading(submitButton, isLoading, "수정 중...", "수정하기");
}

async function loadProfile() {
    if (!requireAccessToken()) {
        return;
    }

    await headerProfile.loadCurrentUser({
        fallbackMessage: PASSWORD_UPDATE_FAILURE,
        onError(error) {
            if (handleUnauthorized(error)) return;

            setHelperText(formHelper, error.message || PASSWORD_UPDATE_FAILURE);
        },
    });
}

currentPasswordInput.addEventListener("input", () => {
    setHelperText(currentPasswordHelper);
    setHelperText(formHelper);
    updateSubmitState();
});

newPasswordInput.addEventListener("input", () => {
    setHelperText(newPasswordHelper);
    setHelperText(formHelper);
    updateSubmitState();
});

currentPasswordInput.addEventListener("blur", () => validateCurrentPassword(true));
newPasswordInput.addEventListener("blur", () => validateNewPassword(true));

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setHelperText(formHelper);

    const isValid = validateCurrentPassword(true) && validateNewPassword(true);

    if (!isValid) {
        updateSubmitState();
        return;
    }

    setLoading(true);

    try {
        await updatePassword({
            currentPassword: currentPasswordInput.value,
            newPassword: newPasswordInput.value,
        });

        form.reset();
        updateSubmitState();
        updateToast.show();
    } catch (error) {
        if (handleUnauthorized(error)) return;

        setHelperText(formHelper, error.message || PASSWORD_UPDATE_FAILURE);
    } finally {
        setLoading(false);
    }
});

loadProfile();
