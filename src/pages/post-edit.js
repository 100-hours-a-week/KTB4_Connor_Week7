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
import { handleUnauthorized, requireAccessToken } from "../utils/access.js";
import { getAccessToken, isCurrentUser } from "../utils/session.js";

const TITLE_MAX_LENGTH = 26;
const POST_EDIT_FORBIDDEN = "*작성자만 수정할 수 있습니다.";

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

function getExistingPostImageFileName() {
    return extractFileName(state.post?.imageUrl) || "기존 파일 없음";
}

function canSubmitPostEditForm() {
    return (
        Boolean(getAccessToken()) &&
        Boolean(postId) &&
        !state.isLoadingPost &&
        Boolean(titleInput.value.trim()) &&
        Boolean(contentInput.value.trim())
    );
}

function getPostEditSubmitBlockerMessage() {
    const hasTitle = Boolean(titleInput.value.trim());
    const hasContent = Boolean(contentInput.value.trim());

    if (!getAccessToken()) {
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

function trimPostEditTitleToLimit() {
    titleInput.value = formatLimitText(titleInput.value, TITLE_MAX_LENGTH);
}

function syncPostEditSubmitButton() {
    if (
        formHelper.textContent === POST_FORM_REQUIRED ||
        formHelper.textContent === POST_TITLE_REQUIRED ||
        formHelper.textContent === POST_CONTENT_REQUIRED
    ) {
        setHelperText(formHelper);
    }

    const isSubmittable = canSubmitPostEditForm();
    submitButton.disabled = !isSubmittable;
    submitButton.setAttribute("aria-disabled", String(!isSubmittable));
}

function setPostEditSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting;
    submitButton.setAttribute("aria-disabled", String(isSubmitting || !canSubmitPostEditForm()));
    setButtonLoading(submitButton, isSubmitting, "수정 중...", "수정하기");
}

async function loadPostEditHeaderProfile() {
    if (!requireAccessToken()) {
        return null;
    }

    return headerProfile.loadCurrentUser({
        fallbackMessage: POST_LOAD_FAILURE,
        onError(error) {
            if (handleUnauthorized(error)) {
                return;
            }

            setHelperText(formHelper, error.message || POST_LOAD_FAILURE);
        },
    });
}

function renderPostEditForm(post) {
    state.post = post;
    titleInput.value = post.title || "";
    contentInput.value = post.content || "";
    state.selectedImageFile = null;
    fileName.textContent = getExistingPostImageFileName();
    fileRemoveButton.hidden = true;
    backLink.href = post.postId ? routes.postDetail(post.postId) : routes.posts;
}

async function loadEditablePost() {
    if (!postId) {
        state.isLoadingPost = false;
        setHelperText(formHelper, POST_NOT_FOUND);
        syncPostEditSubmitButton();
        return;
    }

    if (!getAccessToken()) {
        state.isLoadingPost = false;
        setHelperText(formHelper, AUTH_LOGIN_REQUIRED);
        syncPostEditSubmitButton();
        return;
    }

    try {
        setHelperText(formHelper, "게시글을 불러오는 중입니다.");
        const post = await fetchPost(postId, POST_LOAD_FAILURE);

        if (!isCurrentUser(post.userId)) {
            setHelperText(formHelper, POST_EDIT_FORBIDDEN);
            return;
        }

        renderPostEditForm(post);
        setHelperText(formHelper);
    } catch (error) {
        if (handleUnauthorized(error)) {
            return;
        }

        setHelperText(formHelper, error.message || POST_LOAD_FAILURE);
    } finally {
        state.isLoadingPost = false;
        syncPostEditSubmitButton();
    }
}

function showPostEditBlockerMessage() {
    setHelperText(formHelper, getPostEditSubmitBlockerMessage());
}

function validatePostEditTitle(shouldShowMessage = false) {
    return validateRequired(titleInput, formHelper, POST_TITLE_REQUIRED, shouldShowMessage);
}

function validatePostEditContent(shouldShowMessage = false) {
    return validateRequired(contentInput, formHelper, POST_CONTENT_REQUIRED, shouldShowMessage);
}

function setPostEditImageFile(file) {
    state.selectedImageFile = file || null;
    imageInput.value = "";
    fileName.textContent = file ? file.name : getExistingPostImageFileName();
    fileRemoveButton.hidden = !file;
}

titleInput.addEventListener("input", () => {
    trimPostEditTitleToLimit();
    syncPostEditSubmitButton();
});

contentInput.addEventListener("input", syncPostEditSubmitButton);

titleInput.addEventListener("blur", () => validatePostEditTitle(true));
contentInput.addEventListener("blur", () => validatePostEditContent(true));

fileButton.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (!file) {
        return;
    }

    setPostEditImageFile(file);
});

fileRemoveButton.addEventListener("click", () => {
    setPostEditImageFile(null);
    setHelperText(formHelper);
});

async function submitPostEditForm(event) {
    event.preventDefault();

    if (!canSubmitPostEditForm()) {
        showPostEditBlockerMessage();
        submitButton.setAttribute("aria-disabled", "true");
        return;
    }

    setPostEditSubmitting(true);

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
        if (handleUnauthorized(error)) {
            return;
        }

        setHelperText(formHelper, error.message || POST_EDIT_FAILURE);
    } finally {
        setPostEditSubmitting(false);
    }
}

form.addEventListener("submit", submitPostEditForm);

async function initPostEditPage() {
    const user = await loadPostEditHeaderProfile();

    if (!user) {
        return;
    }

    await loadEditablePost();
}

syncPostEditSubmitButton();
initPostEditPage();
