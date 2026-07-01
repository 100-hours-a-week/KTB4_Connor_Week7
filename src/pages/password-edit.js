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
import { getAccessToken } from "../utils/session.js";
import { isValidPassword, setValidationMessage } from "../utils/validation.js";

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

function canSubmitPasswordEditForm() {
    return Boolean(getAccessToken()) && isValidPassword(currentPasswordInput.value) && isValidPassword(newPasswordInput.value);
}

function validateCurrentPasswordInput(shouldShowMessage = false) {
    const value = currentPasswordInput.value;
    let message = "";

    if (!value) {
        message = PASSWORD_CURRENT_REQUIRED;
    } else if (!isValidPassword(value)) {
        message = PASSWORD_POLICY;
    }

    return setValidationMessage(currentPasswordHelper, message, shouldShowMessage);
}

function validateNewPasswordInput(shouldShowMessage = false) {
    const value = newPasswordInput.value;
    let message = "";

    if (!value) {
        message = PASSWORD_NEW_REQUIRED;
    } else if (!isValidPassword(value)) {
        message = PASSWORD_POLICY;
    }

    return setValidationMessage(newPasswordHelper, message, shouldShowMessage);
}

function syncPasswordEditSubmitButton() {
    setHelperText(formHelper);
    submitButton.disabled = !canSubmitPasswordEditForm();
}

function setPasswordEditSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting || !canSubmitPasswordEditForm();
    setButtonLoading(submitButton, isSubmitting, "수정 중...", "수정하기");
}

async function loadPasswordEditHeaderProfile() {
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
    syncPasswordEditSubmitButton();
});

newPasswordInput.addEventListener("input", () => {
    setHelperText(newPasswordHelper);
    setHelperText(formHelper);
    syncPasswordEditSubmitButton();
});

currentPasswordInput.addEventListener("blur", () => validateCurrentPasswordInput(true));
newPasswordInput.addEventListener("blur", () => validateNewPasswordInput(true));

async function submitPasswordEditForm(event) {
    event.preventDefault();
    setHelperText(formHelper);

    const isValid = validateCurrentPasswordInput(true) && validateNewPasswordInput(true);

    if (!isValid) {
        syncPasswordEditSubmitButton();
        return;
    }

    setPasswordEditSubmitting(true);

    try {
        await updatePassword({
            currentPassword: currentPasswordInput.value,
            newPassword: newPasswordInput.value,
        });

        form.reset();
        syncPasswordEditSubmitButton();
        updateToast.show();
    } catch (error) {
        if (handleUnauthorized(error)) return;

        setHelperText(formHelper, error.message || PASSWORD_UPDATE_FAILURE);
    } finally {
        setPasswordEditSubmitting(false);
    }
}

form.addEventListener("submit", submitPasswordEditForm);

loadPasswordEditHeaderProfile();
