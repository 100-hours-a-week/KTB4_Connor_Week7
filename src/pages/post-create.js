import { uploadImage } from "../api/images.js";
import { createPost } from "../api/posts.js";
import { createHeaderProfile } from "../components/header-profile.js";
import {
    AUTH_LOGIN_REQUIRED,
    POST_CONTENT_REQUIRED,
    POST_CREATE_FAILURE,
    POST_FORM_REQUIRED,
    POST_TITLE_REQUIRED,
} from "../constants/messages.js";
import { setButtonLoading, setHelperText, validateRequired } from "../utils/form.js";
import { formatLimitText } from "../utils/format.js";
import { routes } from "../utils/routes.js";
import { accessToken } from "../utils/session.js";

const TITLE_MAX_LENGTH = 26;
const FILE_EMPTY_TEXT = "파일을 선택해주세요.";
const CREATE_LOADING_TEXT = "등록 중...";
const CREATE_SUBMIT_TEXT = "완료";

const form = document.querySelector(".post-create-form");
const titleInput = document.querySelector("#post-title");
const contentInput = document.querySelector("#post-content");
const imageInput = document.querySelector("#post-image");
const fileButton = document.querySelector(".file-select-button");
const fileRemoveButton = document.querySelector(".file-remove-button");
const fileName = document.querySelector(".post-file-name");
const formHelper = document.querySelector("#form-helper");
const submitButton = document.querySelector(".post-create-submit");

const headerProfile = createHeaderProfile();
let selectedImageFile = null;

function titleValue() {
    return titleInput.value.trim();
}

function contentValue() {
    return contentInput.value.trim();
}

function isLoggedIn() {
    return Boolean(accessToken());
}

function canSubmit() {
    return isLoggedIn() && Boolean(titleValue()) && Boolean(contentValue());
}

function setHelper(message = "") {
    setHelperText(formHelper, message);
}

function getSubmitErrorMessage() {
    const hasTitle = Boolean(titleValue());
    const hasContent = Boolean(contentValue());

    if (!isLoggedIn()) return AUTH_LOGIN_REQUIRED;
    if (!hasTitle && !hasContent) return POST_FORM_REQUIRED;
    return hasTitle ? POST_CONTENT_REQUIRED : POST_TITLE_REQUIRED;
}

function updateSubmitState() {
    setHelper();
    submitButton.disabled = false;
    submitButton.setAttribute("aria-disabled", String(!canSubmit()));
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.setAttribute("aria-disabled", String(isLoading || !canSubmit()));
    setButtonLoading(submitButton, isLoading, CREATE_LOADING_TEXT, CREATE_SUBMIT_TEXT);
}

function trimTitleToLimit() {
    titleInput.value = formatLimitText(titleInput.value, TITLE_MAX_LENGTH);
}

function setSelectedImageFile(file) {
    selectedImageFile = file || null;
    imageInput.value = "";
    fileName.textContent = selectedImageFile ? selectedImageFile.name : FILE_EMPTY_TEXT;
    fileRemoveButton.hidden = !selectedImageFile;
}

async function loadProfile() {
    if (!isLoggedIn()) {
        await headerProfile.loadCurrentUser();
        setHelper(AUTH_LOGIN_REQUIRED);
        submitButton.setAttribute("aria-disabled", "true");
        return;
    }

    await headerProfile.loadCurrentUser({
        fallbackMessage: POST_CREATE_FAILURE,
        onError(error) {
            setHelper(error.message || POST_CREATE_FAILURE);
        },
    });
}

async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit()) {
        setHelper(getSubmitErrorMessage());
        submitButton.setAttribute("aria-disabled", "true");
        return;
    }

    setLoading(true);

    try {
        const imageUrl = selectedImageFile ? await uploadImage(selectedImageFile, POST_CREATE_FAILURE) : null;
        const post = await createPost({
            title: titleValue(),
            content: contentValue(),
            imageUrl,
        });

        globalThis.location.href = post.postId ? routes.postDetail(post.postId) : routes.posts;
    } catch (error) {
        setHelper(error.message || POST_CREATE_FAILURE);
    } finally {
        setLoading(false);
    }
}

function bindEvents() {
    titleInput.addEventListener("input", () => {
        trimTitleToLimit();
        updateSubmitState();
    });

    contentInput.addEventListener("input", updateSubmitState);
    titleInput.addEventListener("blur", () => validateRequired(titleInput, formHelper, POST_TITLE_REQUIRED, true));
    contentInput.addEventListener("blur", () => validateRequired(contentInput, formHelper, POST_CONTENT_REQUIRED, true));

    fileButton.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", () => setSelectedImageFile(imageInput.files[0]));
    fileRemoveButton.addEventListener("click", () => {
        setSelectedImageFile(null);
        setHelper();
    });

    form.addEventListener("submit", handleSubmit);
}

bindEvents();
loadProfile();
