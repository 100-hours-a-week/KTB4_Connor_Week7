import { formatDate } from "../utils/format.js";
import { renderBackgroundImage } from "../utils/image.js";
import { currentProfileImage, isCurrentUser } from "../utils/session.js";
import { COMMENT_FAILURE, COMMENT_REQUIRED } from "../constants/messages.js";

const COMMENT_ACTION = {
    CANCEL_EDIT: "cancel-comment-edit",
    EDIT: "edit-comment",
    DELETE: "delete-comment",
};

function createCommentList({ listElement, onEdit, onDelete, onUpdate, onCancelEdit }) {
    function resolveCommentProfileImage(comment) {
        return comment.profileImage
            || comment.authorProfileImage
            || (isCurrentUser(comment.userId) ? currentProfileImage() : "");
    }

    function createEditForm(comment) {
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

    function createCommentItem(comment, editingCommentId) {
        const item = document.createElement("article");
        item.className = "comment-item";
        item.dataset.commentId = comment.commentId;
        const isEditing = editingCommentId === comment.commentId;

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
            body.append(header, createEditForm(comment));
        } else {
            body.append(header, content);
        }

        if (isCurrentUser(comment.userId) && !isEditing) {
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
            item.append(avatar, body, actions);
        } else {
            item.append(avatar, body);
        }

        return item;
    }

    function render(comments, { editingCommentId = "" } = {}) {
        const fragment = document.createDocumentFragment();

        comments.forEach((comment) => {
            fragment.append(createCommentItem(comment, editingCommentId));
        });

        listElement.replaceChildren(fragment);

        if (editingCommentId) {
            listElement.querySelector(`[data-comment-id="${editingCommentId}"] .comment-edit-textarea`)?.focus();
        }
    }

    listElement.addEventListener("click", (event) => {
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
            onCancelEdit();
            return;
        }

        if (actionButton.dataset.action === COMMENT_ACTION.DELETE) {
            onDelete(commentId);
            return;
        }

        if (actionButton.dataset.action === COMMENT_ACTION.EDIT) {
            onEdit(commentId);
        }
    });

    listElement.addEventListener("input", (event) => {
        const textarea = event.target.closest(".comment-edit-textarea");

        if (!textarea) {
            return;
        }

        const form = textarea.closest(".comment-edit-form");
        form.querySelector(".comment-edit-helper").textContent = "";
        form.querySelector(".comment-edit-submit").disabled = !textarea.value.trim();
    });

    listElement.addEventListener("submit", async (event) => {
        const form = event.target.closest(".comment-edit-form");

        if (!form) {
            return;
        }

        event.preventDefault();

        const item = form.closest(".comment-item");
        const textarea = form.querySelector(".comment-edit-textarea");
        const helper = form.querySelector(".comment-edit-helper");
        const submitButton = form.querySelector(".comment-edit-submit");
        const commentId = item?.dataset.commentId;
        const content = textarea.value.trim();

        if (!content) {
            helper.textContent = COMMENT_REQUIRED;
            submitButton.disabled = true;
            return;
        }

        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");

        try {
            await onUpdate(commentId, content);
        } catch (error) {
            helper.textContent = error.message || COMMENT_FAILURE;
        } finally {
            submitButton.removeAttribute("aria-busy");

            if (form.isConnected) {
                submitButton.disabled = !textarea.value.trim();
            }
        }
    });

    return {
        render,
    };
}

export { createCommentList };
