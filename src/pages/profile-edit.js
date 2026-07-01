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
let currentProfileImage = "";
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

function setProfilePreview(imageUrl) {
    profilePreviewController.show(imageUrl);
}

function validateNickname(showMessage = false) {
    const value = nicknameInput.value;
    let message = "";

    if (!value.trim()) {
        message = USER_NICKNAME_REQUIRED;
    } else if (/\s/.test(value)) {
        message = USER_NICKNAME_SPACE;
    } else if (value.length > 10) {
        message = PROFILE_NICKNAME_LENGTH;
    }

    nicknameHelper.textContent = showMessage ? message : "";
    return message === "";
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    setButtonLoading(submitButton, isLoading, "수정 중...", "수정하기");
}

function showUpdateError(message) {
    if (message.includes("닉네임")) {
        setHelperText(nicknameHelper, USER_NICKNAME_DUPLICATE);
        return;
    }

    setHelperText(formHelper, message || PROFILE_UPDATE_FAILURE);
}

function setSelectedProfileFile(file) {
    profilePreviewController.showFile(file);
    selectedProfileFile = file;
}

async function loadProfile() {
    if (!requireAccessToken()) {
        return;
    }

    headerProfile.setVisible(true);

    try {
        const user = await fetchMe(PROFILE_LOAD_FAILURE);

        emailText.textContent = user.email || "";
        nicknameInput.value = user.nickname || "";
        currentProfileImage = user.profileImage || "";
        selectedProfileFile = null;
        profilePreviewController.revoke();
        headerProfile.setAvatar(currentProfileImage);
        setProfilePreview(currentProfileImage);
        updateStoredUser(user);
    } catch (error) {
        if (handleUnauthorized(error)) {
            return;
        }

        setHelperText(formHelper, error.message || PROFILE_LOAD_FAILURE);
    }
}

function openWithdrawDialog() {
    withdrawDialog.open();
}

async function withdraw() {
    withdrawDialog.setConfirmLoading(true);

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
        withdrawDialog.setConfirmLoading(false);
    }
}

profileInput.addEventListener("change", () => {
    const file = profileInput.files[0];

    if (!file) {
        return;
    }

    setSelectedProfileFile(file);
});

nicknameInput.addEventListener("input", () => {
    setHelperText(nicknameHelper);
    setHelperText(formHelper);
});

nicknameInput.addEventListener("blur", () => validateNickname(true));

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setHelperText(formHelper);

    if (!validateNickname(true)) {
        return;
    }

    setLoading(true);

    try {
        let profileImage = currentProfileImage || null;

        if (selectedProfileFile) {
            profileImage = await uploadImage(selectedProfileFile, PROFILE_UPDATE_FAILURE);
        }

        const user = await updateMe({
            nickname: nicknameInput.value.trim(),
            profileImage,
        });

        currentProfileImage = user.profileImage || profileImage;
        selectedProfileFile = null;
        profilePreviewController.revoke();
        headerProfile.setAvatar(currentProfileImage);
        setProfilePreview(currentProfileImage);
        updateStoredUser({ ...user, profileImage: currentProfileImage });
        updateToast.show();
    } catch (error) {
        if (handleUnauthorized(error)) {
            return;
        }

        showUpdateError(error.message || PROFILE_UPDATE_FAILURE);
    } finally {
        setLoading(false);
    }
});

withdrawButton.addEventListener("click", openWithdrawDialog);
dialogConfirm.addEventListener("click", withdraw);

loadProfile();
