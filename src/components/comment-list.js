import { formatDate } from "../utils/format.js";
import { renderBackgroundImage } from "../utils/image.js";
import { getCurrentProfileImage, isCurrentUser } from "../utils/session.js";
import { COMMENT_FAILURE, COMMENT_REQUIRED } from "../constants/messages.js";

const COMMENT_ACTION = {
    CANCEL_EDIT: "cancel-comment-edit",
    EDIT: "edit-comment",
    DELETE: "delete-comment",
};

function normalizeCommentId(commentId) {
    return commentId == null ? "" : String(commentId);
}

function isMatchingCommentId(firstCommentId, secondCommentId) {
    return normalizeCommentId(firstCommentId) === normalizeCommentId(secondCommentId);
}

function resolveCommentProfileImage(comment) {
    return comment.profileImage
        || comment.authorProfileImage
        || (isCurrentUser(comment.userId) ? getCurrentProfileImage() : "");
}

function createCommentEditForm(comment) {
    const form = document.createElement("form");
    form.className = "comment-edit-form";

    const textarea = document.createElement("textarea");
    textarea.className = "comment-edit-textarea";
    textarea.name = "content";
    textarea.value = comment.content || "";
    textarea.setAttribute("aria-label", "댓글 수정 내용");

    const footer = document.createElement("div");
    footer.className = "comment-edit-footer";

    const helper = document.createElement("p");
    helper.className = "helper-text comment-edit-helper";
    helper.setAttribute("aria-live", "polite");

    const actions = document.createElement("div");
    actions.className = "comment-edit-actions";

    const cancelButton = document.createElement("button");
    cancelButton.className = "outline-action";
    cancelButton.type = "button";
    cancelButton.dataset.action = COMMENT_ACTION.CANCEL_EDIT;
    cancelButton.textContent = "취소";

    const submitButton = document.createElement("button");
    submitButton.className = "comment-submit comment-edit-submit";
    submitButton.type = "submit";
    submitButton.disabled = !textarea.value.trim();
    submitButton.textContent = "댓글 수정";

    actions.append(cancelButton, submitButton);
    footer.append(helper, actions);
    form.append(textarea, footer);

    return form;
}

function createCommentActionButtons() {
    const actions = document.createElement("div");
    actions.className = "comment-actions";

    const editButton = document.createElement("button");
    editButton.className = "outline-action";
    editButton.type = "button";
    editButton.dataset.action = COMMENT_ACTION.EDIT;
    editButton.textContent = "수정";

    const deleteButton = document.createElement("button");
    deleteButton.className = "outline-action";
    deleteButton.type = "button";
    deleteButton.dataset.action = COMMENT_ACTION.DELETE;
    deleteButton.textContent = "삭제";

    actions.append(editButton, deleteButton);

    return actions;
}

function createCommentItem(comment, editingCommentId) {
    const item = document.createElement("article");
    item.className = "comment-item";
    item.dataset.commentId = normalizeCommentId(comment.commentId);

    const isEditing = isMatchingCommentId(editingCommentId, comment.commentId);
    const avatar = document.createElement("span");
    avatar.className = "comment-avatar";
    avatar.setAttribute("aria-hidden", "true");
    renderBackgroundImage(avatar, resolveCommentProfileImage(comment));

    const body = document.createElement("div");
    body.className = "comment-body";

    const header = document.createElement("div");
    header.className = "comment-header";

    const nickname = document.createElement("strong");
    nickname.textContent = comment.nickname;

    const time = document.createElement("time");
    time.dateTime = comment.createdAt;
    time.textContent = formatDate(comment.createdAt);

    header.append(nickname, time);

    const content = document.createElement("p");
    content.textContent = comment.content || "";

    if (isEditing) {
        body.append(header, createCommentEditForm(comment));
    } else {
        body.append(header, content);
    }

    if (isCurrentUser(comment.userId) && !isEditing) {
        item.append(avatar, body, createCommentActionButtons());
        return item;
    }

    item.append(avatar, body);
    return item;
}

function focusEditingTextarea(listElement, editingCommentId) {
    const editedItem = [...listElement.querySelectorAll(".comment-item")]
        .find((item) => isMatchingCommentId(item.dataset.commentId, editingCommentId));

    editedItem?.querySelector(".comment-edit-textarea")?.focus();
}

function getCommentEditFormControls(form) {
    return {
        helper: form.querySelector(".comment-edit-helper"),
        submitButton: form.querySelector(".comment-edit-submit"),
        textarea: form.querySelector(".comment-edit-textarea"),
    };
}

function syncCommentEditSubmitButton(form) {
    const { submitButton, textarea } = getCommentEditFormControls(form);

    if (submitButton && textarea) {
        submitButton.disabled = !textarea.value.trim();
    }
}

function setCommentEditHelperText(form, message) {
    const { helper } = getCommentEditFormControls(form);

    if (helper) {
        helper.textContent = message;
    }
}

function setCommentEditSubmitting(form, isSubmitting) {
    const { submitButton } = getCommentEditFormControls(form);

    if (!submitButton) {
        return;
    }

    submitButton.disabled = isSubmitting;

    if (isSubmitting) {
        submitButton.setAttribute("aria-busy", "true");
    } else {
        submitButton.removeAttribute("aria-busy");
    }
}

function createCommentList({ listElement, onEditRequest, onDeleteRequest, onEditSubmit, onEditCancel }) {
    function render(comments, { editingCommentId = "" } = {}) {
        const fragment = document.createDocumentFragment();

        comments.forEach((comment) => {
            fragment.append(createCommentItem(comment, editingCommentId));
        });

        listElement.replaceChildren(fragment);

        if (editingCommentId) {
            focusEditingTextarea(listElement, editingCommentId);
        }
    }

    function handleCommentActionClick(event) {
        const actionButton = event.target.closest("[data-action]");

        if (!actionButton) {
            return;
        }

        const item = actionButton.closest(".comment-item");
        const commentId = item?.dataset.commentId;

        if (!commentId) {
            return;
        }

        if (actionButton.dataset.action === COMMENT_ACTION.CANCEL_EDIT) {
            onEditCancel();
            return;
        }

        if (actionButton.dataset.action === COMMENT_ACTION.DELETE) {
            onDeleteRequest(commentId);
            return;
        }

        if (actionButton.dataset.action === COMMENT_ACTION.EDIT) {
            onEditRequest(commentId);
        }
    }

    function handleCommentEditInput(event) {
        const textarea = event.target.closest(".comment-edit-textarea");

        if (!textarea) {
            return;
        }

        const form = textarea.closest(".comment-edit-form");
        setCommentEditHelperText(form, "");
        syncCommentEditSubmitButton(form);
    }

    async function handleCommentEditSubmit(event) {
        const form = event.target.closest(".comment-edit-form");

        if (!form) {
            return;
        }

        event.preventDefault();

        const item = form.closest(".comment-item");
        const { textarea } = getCommentEditFormControls(form);
        const commentId = item?.dataset.commentId;

        if (!textarea) {
            return;
        }

        const content = textarea.value.trim();

        if (!content) {
            setCommentEditHelperText(form, COMMENT_REQUIRED);
            syncCommentEditSubmitButton(form);
            return;
        }

        setCommentEditSubmitting(form, true);

        try {
            await onEditSubmit(commentId, content);
        } catch (error) {
            setCommentEditHelperText(form, error.message || COMMENT_FAILURE);
        } finally {
            setCommentEditSubmitting(form, false);

            if (form.isConnected) {
                syncCommentEditSubmitButton(form);
            }
        }
    }

    listElement.addEventListener("click", handleCommentActionClick);
    listElement.addEventListener("input", handleCommentEditInput);
    listElement.addEventListener("submit", handleCommentEditSubmit);

    return {
        render,
    };
}

export { createCommentList };
