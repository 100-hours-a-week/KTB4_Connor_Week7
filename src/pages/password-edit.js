import { updatePassword } from "../api/users.js";
import { createHeaderProfile } from "../components/header-profile.js";
import { createToast } from "../components/toast.js";
import {
    PASSWORD_CONFIRM_REQUIRED,
    PASSWORD_MISMATCH,
    PASSWORD_POLICY,
    PASSWORD_REQUIRED,
    PASSWORD_UPDATE_FAILURE,
} from "../constants/messages.js";
import { setButtonLoading, setHelperText } from "../utils/form.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { getAccessToken } from "../utils/session.js";
import { isValidPassword, setValidationMessage } from "../utils/validation.js";

const form = document.querySelector(".password-edit-form");
const newPasswordInput = document.querySelector("#new-password");
const passwordConfirmInput = document.querySelector("#password-confirm");
const newPasswordHelper = document.querySelector("#new-password-helper");
const passwordConfirmHelper = document.querySelector("#password-confirm-helper");
const formHelper = document.querySelector("#form-helper");
const submitButton = document.querySelector(".password-submit");
const toast = document.querySelector(".toast");

const headerProfile = createHeaderProfile();
const updateToast = createToast(toast);

function canSubmitPasswordEditForm() {
    return (
        Boolean(getAccessToken()) &&
        isValidPassword(newPasswordInput.value) &&
        passwordConfirmInput.value === newPasswordInput.value
    );
}

function validateNewPasswordInput(shouldShowMessage = false) {
    const value = newPasswordInput.value;
    let message = "";

    if (!value) {
        message = PASSWORD_REQUIRED;
    } else if (!isValidPassword(value)) {
        message = PASSWORD_POLICY;
    } else if (passwordConfirmInput.value && value !== passwordConfirmInput.value) {
        message = PASSWORD_MISMATCH;
    }

    return setValidationMessage(newPasswordHelper, message, shouldShowMessage);
}

function validatePasswordConfirmInput(shouldShowMessage = false) {
    const value = passwordConfirmInput.value;
    let message = "";

    if (!value) {
        message = PASSWORD_CONFIRM_REQUIRED;
    } else if (value !== newPasswordInput.value) {
        message = PASSWORD_MISMATCH;
    }

    return setValidationMessage(passwordConfirmHelper, message, shouldShowMessage);
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

newPasswordInput.addEventListener("input", () => {
    setHelperText(newPasswordHelper);
    setHelperText(passwordConfirmHelper);
    setHelperText(formHelper);
    syncPasswordEditSubmitButton();
});

passwordConfirmInput.addEventListener("input", () => {
    setHelperText(passwordConfirmHelper);
    setHelperText(formHelper);
    syncPasswordEditSubmitButton();
});

newPasswordInput.addEventListener("blur", () => {
    validateNewPasswordInput(true);
    validatePasswordConfirmInput(Boolean(passwordConfirmInput.value));
});
passwordConfirmInput.addEventListener("blur", () => validatePasswordConfirmInput(true));

async function submitPasswordEditForm(event) {
    event.preventDefault();
    setHelperText(formHelper);

    const isValid = validateNewPasswordInput(true) && validatePasswordConfirmInput(true);

    if (!isValid) {
        syncPasswordEditSubmitButton();
        return;
    }

    setPasswordEditSubmitting(true);

    try {
        await updatePassword({
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
