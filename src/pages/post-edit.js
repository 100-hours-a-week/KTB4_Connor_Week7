import { uploadImage } from "../api/images.js";
import { fetchPost, updatePost } from "../api/posts.js";
import { createHeaderProfile } from "../components/header-profile.js";
import {
    AUTH_LOGIN_REQUIRED,
    POST_CONTENT_REQUIRED,
    POST_EDIT_FAILURE, POST_FORM_REQUIRED, POST_LOAD_FAILURE,
    POST_NOT_FOUND, POST_TITLE_REQUIRED,
} from "../constants/messages.js";
import { setButtonLoading, setHelperText, validateRequired } from "../utils/form.js";
import { formatLimitText } from "../utils/format.js";
import { extractFileName } from "../utils/image.js";
import { routes } from "../utils/routes.js";
import { accessToken } from "../utils/session.js";

const TITLE_MAX_LENGTH = 26;

const postId = new URLSearchParams(window.location.search).get("postId");
const backLink = document.querySelector(".back-link");
const form = document.querySelector(".post-edit-form");
const titleInput = document.querySelector("#post-title");
const contentInput = document.querySelector("#post-content");
const imageInput = document.querySelector("#post-image");
const fileButton = document.querySelector(".file-select-button");
const fileRemoveButton = document.querySelector(".file-remove-button");
const fileName = document.querySelector(".post-file-name");
const formHelper = document.querySelector("#form-helper");
const submitButton = document.querySelector(".post-edit-submit");

const headerProfile = createHeaderProfile();
const state = {
    post: null,
    selectedImageFile: null,
    isLoadingPost: true,
};

function existingFileName() {
    return extractFileName(state.post?.imageUrl) || "기존 파일 없음";
}

function canSubmit() {
    return (
        Boolean(accessToken()) &&
        Boolean(postId) &&
        !state.isLoadingPost &&
        Boolean(titleInput.value.trim()) &&
        Boolean(contentInput.value.trim())
    );
}

function getSubmitErrorMessage() {
    const hasTitle = Boolean(titleInput.value.trim());
    const hasContent = Boolean(contentInput.value.trim());

    if (!accessToken()) {
        return AUTH_LOGIN_REQUIRED;
    }

    if (!postId) {
        return POST_NOT_FOUND;
    }

    if (state.isLoadingPost) {
        return "게시글을 불러오는 중입니다.";
    }

    if (!hasTitle && !hasContent) {
        return POST_FORM_REQUIRED;
    }

    return hasTitle ? POST_CONTENT_REQUIRED : POST_TITLE_REQUIRED;
}

function trimTitleToLimit() {
    titleInput.value = formatLimitText(titleInput.value, TITLE_MAX_LENGTH);
}

function updateSubmitState() {
    if (
        formHelper.textContent === POST_FORM_REQUIRED ||
        formHelper.textContent === POST_TITLE_REQUIRED ||
        formHelper.textContent === POST_CONTENT_REQUIRED
    ) {
        setHelperText(formHelper);
    }

    submitButton.disabled = false;
    submitButton.setAttribute("aria-disabled", String(!canSubmit()));
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.setAttribute("aria-disabled", String(isLoading || !canSubmit()));
    setButtonLoading(submitButton, isLoading, "수정 중...", "수정하기");
}

async function loadProfile() {
    if (!accessToken()) {
        await headerProfile.loadCurrentUser();
        return;
    }

    await headerProfile.loadCurrentUser();
}

function renderPost(post) {
    state.post = post;
    titleInput.value = post.title || "";
    contentInput.value = post.content || "";
    state.selectedImageFile = null;
    fileName.textContent = existingFileName();
    fileRemoveButton.hidden = true;
    backLink.href = post.postId ? routes.postDetail(post.postId) : routes.posts;
}

async function loadPost() {
    if (!postId) {
        state.isLoadingPost = false;
        setHelperText(formHelper, POST_NOT_FOUND);
        updateSubmitState();
        return;
    }

    if (!accessToken()) {
        state.isLoadingPost = false;
        setHelperText(formHelper, AUTH_LOGIN_REQUIRED);
        updateSubmitState();
        return;
    }

    try {
        setHelperText(formHelper, "게시글을 불러오는 중입니다.");
        const post = await fetchPost(postId, POST_LOAD_FAILURE);
        renderPost(post);
        setHelperText(formHelper);
    } catch (error) {
        setHelperText(formHelper, error.message || POST_LOAD_FAILURE);
    } finally {
        state.isLoadingPost = false;
        updateSubmitState();
    }
}

function showRequiredMessage() {
    setHelperText(formHelper, getSubmitErrorMessage());
}

function validateTitle(showMessage = false) {
    return validateRequired(titleInput, formHelper, POST_TITLE_REQUIRED, showMessage);
}

function validateContent(showMessage = false) {
    return validateRequired(contentInput, formHelper, POST_CONTENT_REQUIRED, showMessage);
}

function setSelectedImageFile(file) {
    state.selectedImageFile = file || null;
    imageInput.value = "";
    fileName.textContent = file ? file.name : existingFileName();
    fileRemoveButton.hidden = !file;
}

titleInput.addEventListener("input", () => {
    trimTitleToLimit();
    updateSubmitState();
});

contentInput.addEventListener("input", updateSubmitState);

titleInput.addEventListener("blur", () => validateTitle(true));
contentInput.addEventListener("blur", () => validateContent(true));

fileButton.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    setSelectedImageFile(file);
});

fileRemoveButton.addEventListener("click", () => {
    setSelectedImageFile(null);
    setHelperText(formHelper);
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!canSubmit()) {
        showRequiredMessage();
        submitButton.setAttribute("aria-disabled", "true");
        return;
    }

    setLoading(true);

    try {
        const imageUrl = state.selectedImageFile
            ? await uploadImage(state.selectedImageFile, POST_EDIT_FAILURE)
            : state.post?.imageUrl || null;

        await updatePost({
            id: postId,
            title: titleInput.value.trim(),
            content: contentInput.value.trim(),
            imageUrl,
        });

        window.location.href = routes.postDetail(postId);
    } catch (error) {
        setHelperText(formHelper, error.message || POST_EDIT_FAILURE);
    } finally {
        setLoading(false);
    }
});

Promise.allSettled([loadProfile(), loadPost()]);
