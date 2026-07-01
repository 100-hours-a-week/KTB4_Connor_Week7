import { uploadImage } from "../api/images.js";
import { fetchMe, updateMe, withdrawMe } from "../api/users.js";
import { createConfirmDialog } from "../components/confirm-dialog.js";
import { createHeaderProfile } from "../components/header-profile.js";
import { createToast } from "../components/toast.js";
import {
    USER_NICKNAME_DUPLICATE,
    USER_NICKNAME_REQUIRED,
    USER_NICKNAME_SPACE,
    PROFILE_LOAD_FAILURE,
    PROFILE_NICKNAME_LENGTH,
    PROFILE_UPDATE_FAILURE,
    PROFILE_WITHDRAW_FAILURE,
} from "../constants/messages.js";
import { setButtonLoading, setHelperText } from "../utils/form.js";
import { createImagePreviewController } from "../utils/image-preview.js";
import { routes } from "../utils/routes.js";
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { clearSession, updateStoredUser } from "../utils/session.js";

const form = document.querySelector(".profile-edit-form");
const profileInput = document.querySelector("#edit-profile-image");
const profilePreview = document.querySelector(".edit-profile-preview");
const profileFallback = document.querySelector(".edit-profile-fallback");
const emailText = document.querySelector(".profile-email");
const nicknameInput = document.querySelector("#edit-nickname");
const nicknameHelper = document.querySelector("#nickname-helper");
const formHelper = document.querySelector("#form-helper");
const submitButton = document.querySelector(".profile-submit");
const withdrawButton = document.querySelector(".withdraw-button");
const modalBackdrop = document.querySelector(".modal-backdrop");
const dialogCancel = document.querySelector(".dialog-cancel");
const dialogConfirm = document.querySelector(".dialog-confirm");
const toast = document.querySelector(".toast");

const headerProfile = createHeaderProfile();
let selectedProfileFile = null;
let savedProfileImageUrl = "";
const profilePreviewController = createImagePreviewController({
    image: profilePreview,
    fallback: profileFallback,
});
const updateToast = createToast(toast);
const withdrawDialog = createConfirmDialog({
    backdrop: modalBackdrop,
    cancelButton: dialogCancel,
    confirmButton: dialogConfirm,
    returnFocusElement: withdrawButton,
});

function showProfilePreview(imageUrl) {
    profilePreviewController.show(imageUrl);
}

function validateProfileNickname(shouldShowMessage = false) {
    const value = nicknameInput.value;
    let message = "";

    if (!value.trim()) {
        message = USER_NICKNAME_REQUIRED;
    } else if (/\s/.test(value)) {
        message = USER_NICKNAME_SPACE;
    } else if (value.length > 10) {
        message = PROFILE_NICKNAME_LENGTH;
    }

    nicknameHelper.textContent = shouldShowMessage ? message : "";
    return message === "";
}

function setProfileSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting;
    setButtonLoading(submitButton, isSubmitting, "수정 중...", "수정하기");
}

function showProfileUpdateFailure(message) {
    if (message.includes("닉네임")) {
        setHelperText(nicknameHelper, USER_NICKNAME_DUPLICATE);
        return;
    }

    setHelperText(formHelper, message || PROFILE_UPDATE_FAILURE);
}

function setSelectedProfileImageFile(file) {
    profilePreviewController.showFile(file);
    selectedProfileFile = file;
}

async function loadProfileEditForm() {
    if (!requireAccessToken()) {
        return;
    }

    headerProfile.setVisible(true);

    try {
        const user = await fetchMe(PROFILE_LOAD_FAILURE);

        emailText.textContent = user.email || "";
        nicknameInput.value = user.nickname || "";
        savedProfileImageUrl = user.profileImage || "";
        selectedProfileFile = null;
        profilePreviewController.revoke();
        headerProfile.setAvatar(savedProfileImageUrl);
        showProfilePreview(savedProfileImageUrl);
        updateStoredUser(user);
    } catch (error) {
        if (handleUnauthorized(error)) {
            return;
        }

        setHelperText(formHelper, error.message || PROFILE_LOAD_FAILURE);
    }
}

function openWithdrawConfirmDialog() {
    withdrawDialog.open();
}

async function withdrawCurrentUser() {
    withdrawDialog.setConfirmButtonLoading(true);

    try {
        await withdrawMe();
        clearSession();
        window.location.href = routes.login;
    } catch (error) {
        if (handleUnauthorized(error)) {
            return;
        }

        withdrawDialog.close();
        setHelperText(formHelper, error.message || PROFILE_WITHDRAW_FAILURE);
    } finally {
        withdrawDialog.setConfirmButtonLoading(false);
    }
}

profileInput.addEventListener("change", () => {
    const file = profileInput.files[0];

    if (!file) {
        return;
    }

    setSelectedProfileImageFile(file);
});

nicknameInput.addEventListener("input", () => {
    setHelperText(nicknameHelper);
    setHelperText(formHelper);
});

nicknameInput.addEventListener("blur", () => validateProfileNickname(true));

async function submitProfileEditForm(event) {
    event.preventDefault();
    setHelperText(formHelper);

    if (!validateProfileNickname(true)) {
        return;
    }

    setProfileSubmitting(true);

    try {
        let profileImage = savedProfileImageUrl || null;

        if (selectedProfileFile) {
            profileImage = await uploadImage(selectedProfileFile, PROFILE_UPDATE_FAILURE);
        }

        const user = await updateMe({
            nickname: nicknameInput.value.trim(),
            profileImage,
        });

        savedProfileImageUrl = user.profileImage || profileImage;
        selectedProfileFile = null;
        profilePreviewController.revoke();
        headerProfile.setAvatar(savedProfileImageUrl);
        showProfilePreview(savedProfileImageUrl);
        updateStoredUser({ ...user, profileImage: savedProfileImageUrl });
        updateToast.show();
    } catch (error) {
        if (handleUnauthorized(error)) {
            return;
        }

        showProfileUpdateFailure(error.message || PROFILE_UPDATE_FAILURE);
    } finally {
        setProfileSubmitting(false);
    }
}

form.addEventListener("submit", submitProfileEditForm);
withdrawButton.addEventListener("click", openWithdrawConfirmDialog);
dialogConfirm.addEventListener("click", withdrawCurrentUser);

loadProfileEditForm();
