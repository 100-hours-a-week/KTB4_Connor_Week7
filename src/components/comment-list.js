import { formatDate } from "../utils/format.js";
import { renderBackgroundImage } from "../utils/image.js";
import { isCurrentUser } from "../utils/session.js";

const COMMENT_ACTION = {
    EDIT: "edit-comment",
    DELETE: "delete-comment",
};

function createCommentList({ listElement, onEdit, onDelete }) {
    function createCommentItem(comment) {
        const item = document.createElement("article");
        item.className = "comment-item";
        item.dataset.commentId = comment.commentId;

        const avatar = document.createElement("span");
        avatar.className = "comment-avatar";
        avatar.setAttribute("aria-hidden", "true");
        renderBackgroundImage(avatar, comment.profileImage || comment.authorProfileImage);

        const body = document.createElement("div");
        body.className = "comment-body";

        const header = document.createElement("div");
        header.className = "comment-header";

        const nickname = document.createElement("strong");
        nickname.textContent = comment.nickname || "알 수 없음";

        const time = document.createElement("time");
        time.dateTime = comment.createdAt || "";
        time.textContent = formatDate(comment.createdAt);

        header.append(nickname, time);

        const content = document.createElement("p");
        content.textContent = comment.content || "";

        body.append(header, content);

        if (isCurrentUser(comment.userId)) {
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

    function render(comments) {
        const fragment = document.createDocumentFragment();

        comments.forEach((comment) => {
            fragment.append(createCommentItem(comment));
        });

        listElement.replaceChildren(fragment);
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

        if (actionButton.dataset.action === COMMENT_ACTION.DELETE) {
            onDelete(commentId);
            return;
        }

        if (actionButton.dataset.action === COMMENT_ACTION.EDIT) {
            onEdit(commentId);
        }
    });

    return {
        render,
    };
}

export { createCommentList };
