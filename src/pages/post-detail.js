import { createComment, deleteComment, fetchComments, updateComment } from "../api/comments.js";
import { deletePost, fetchPost, likePost, unlikePost } from "../api/posts.js";
import { createCommentList } from "../components/comment-list.js";
import { createConfirmDialog } from "../components/confirm-dialog.js";
import { createHeaderProfile } from "../components/header-profile.js";
import {
    AUTH_EXPIRED,
    COMMENT_FAILURE,
    COMMENT_REQUIRED,
    AUTH_LOGIN_REQUIRED,
    POST_LOAD_FAILURE,
    POST_NOT_FOUND_STATE,
} from "../constants/messages.js";
import { formatCount, formatDate } from "../utils/format.js";
import { renderBackgroundImage, resolveImageUrl } from "../utils/image.js";
import { routes } from "../utils/routes.js";
import { getAccessToken, clearSession, getCurrentProfileImage, isCurrentUser } from "../utils/session.js";

const postId = new URLSearchParams(globalThis.location.search).get("postId");
const detailState = document.querySelector(".detail-state");
const detailArticle = document.querySelector(".post-detail");
const detailTitle = document.querySelector(".detail-title");
const authorAvatar = document.querySelector(".detail-author-avatar");
const authorName = document.querySelector(".detail-author-name");
const createdAt = document.querySelector(".detail-created-at");
const ownerActions = document.querySelector(".detail-owner-actions");
const editLink = document.querySelector(".detail-edit-link");
const deletePostButton = document.querySelector(".detail-delete-button");
const imageFrame = document.querySelector(".detail-image-frame");
const detailImage = document.querySelector(".detail-image");
const detailContent = document.querySelector(".detail-content");
const likeButton = document.querySelector(".like-stat");
const likeCountText = document.querySelector(".like-count");
const viewCountText = document.querySelector(".view-count");
const commentCountText = document.querySelector(".comment-count");
const commentForm = document.querySelector(".comment-form");
const commentInput = document.querySelector("#comment-content");
const commentHelper = document.querySelector("#comment-helper");
const commentSubmit = document.querySelector(".comment-submit");
const commentsList = document.querySelector(".comments-list");
const confirmBackdrop = document.querySelector(".confirm-backdrop");
const confirmTitle = document.querySelector("#confirm-title");
const confirmDescription = document.querySelector("#confirm-description");
const confirmCancel = document.querySelector(".confirm-cancel");
const confirmOk = document.querySelector(".confirm-ok");

const headerProfile = createHeaderProfile();
const state = {
    post: null,
    comments: [],
    editingCommentId: "",
    isLikeRequestPending: false,
};
const DELETE_TARGET_TYPE = {
    POST: "post",
    COMMENT: "comment",
};
const confirmDialog = createConfirmDialog({
    backdrop: confirmBackdrop,
    cancelButton: confirmCancel,
    confirmButton: confirmOk,
    titleElement: confirmTitle,
    descriptionElement: confirmDescription,
});
const commentList = createCommentList({
    listElement: commentsList,
    onDeleteRequest(commentId) {
        openDeleteConfirmDialog(DELETE_TARGET_TYPE.COMMENT, commentId);
    },
    onEditRequest(commentId) {
        startEditingComment(commentId);
    },
    onEditCancel() {
        cancelEditingComment();
    },
    onEditSubmit(commentId, content) {
        return submitEditedComment(commentId, content);
    },
});

function setDetailStatusMessage(message) {
    detailState.textContent = message;
    detailState.hidden = !message;
}

function resetDetailPageAfterAuthExpired() {
    clearSession();
    state.editingCommentId = "";
    headerProfile.loadCurrentUser();
    headerProfile.toggleMenu(false);

    if (state.post) {
        syncPostStats(state.post);
    }

    renderCommentList();
    syncNewCommentSubmitButton();
}

async function withAuthExpiryHandling(promise) {
    try {
        return await promise;
    } catch (error) {
        if (error.status === 401) {
            resetDetailPageAfterAuthExpired();
            throw new Error(AUTH_EXPIRED);
        }

        throw error;
    }
}

function renderPostDetail(post) {
    const imageUrl = resolveImageUrl(post.imageUrl);
    const canEditPost = isCurrentUser(post.userId);
    const authorProfileImage = post.profileImage
        || post.authorProfileImage
        || (canEditPost ? getCurrentProfileImage() : "");

    detailTitle.textContent = post.title || "";
    authorName.textContent = post.nickname || "알 수 없음";
    createdAt.dateTime = post.createdAt || "";
    createdAt.textContent = formatDate(post.createdAt);
    detailContent.textContent = post.content || "";
    ownerActions.hidden = !canEditPost;
    editLink.href = routes.postEdit(post.postId);

    renderBackgroundImage(authorAvatar, authorProfileImage);

    if (imageUrl) {
        detailImage.src = imageUrl;
        imageFrame.hidden = false;
    } else {
        detailImage.removeAttribute("src");
        imageFrame.hidden = true;
    }

    syncPostStats(post);
    detailArticle.hidden = false;
    setDetailStatusMessage("");
}

function syncPostStats(post) {
    likeCountText.textContent = formatCount(post.likeCount);
    viewCountText.textContent = formatCount(post.viewCount);
    commentCountText.textContent = formatCount(post.commentCount);
    likeButton.classList.toggle("is-liked", Boolean(post.isLiked));
    likeButton.setAttribute("aria-pressed", String(Boolean(post.isLiked)));
    likeButton.disabled = !getAccessToken() || state.isLikeRequestPending;
}

async function loadPostDetailPage() {
    if (!postId) {
        setDetailStatusMessage(POST_NOT_FOUND_STATE);
        return;
    }

    try {
        setDetailStatusMessage("게시글을 불러오는 중입니다.");
        const [post, comments] = await Promise.all([
            withAuthExpiryHandling(fetchPost(postId, POST_LOAD_FAILURE)),
            withAuthExpiryHandling(fetchComments(postId)),
        ]);
        state.post = post;
        state.comments = comments;
        renderPostDetail(post);
        renderCommentList();
    } catch (error) {
        detailArticle.hidden = true;
        setDetailStatusMessage(error.message || POST_LOAD_FAILURE);
    }
}

function syncNewCommentSubmitButton() {
    commentSubmit.disabled = !getAccessToken() || !commentInput.value.trim();
}

function resetNewCommentForm() {
    commentInput.value = "";
    commentHelper.textContent = "";
    commentSubmit.textContent = "댓글 등록";
    syncNewCommentSubmitButton();
}

function renderCommentList() {
    commentList.render(state.comments, {
        editingCommentId: state.editingCommentId,
    });
}

async function reloadPostDetailAfterCommentChange() {
    const [post, comments] = await Promise.all([
        withAuthExpiryHandling(fetchPost(postId, POST_LOAD_FAILURE)),
        withAuthExpiryHandling(fetchComments(postId)),
    ]);
    state.post = post;
    state.comments = comments;
    renderPostDetail(post);
    renderCommentList();
}

async function submitNewComment() {
    const content = commentInput.value.trim();

    if (!getAccessToken()) {
        commentHelper.textContent = AUTH_LOGIN_REQUIRED;
        return;
    }

    if (!content) {
        commentHelper.textContent = COMMENT_REQUIRED;
        commentSubmit.disabled = true;
        return;
    }

    commentSubmit.disabled = true;
    commentSubmit.setAttribute("aria-busy", "true");

    try {
        await withAuthExpiryHandling(createComment(postId, content));
        resetNewCommentForm();
        await reloadPostDetailAfterCommentChange();
    } catch (error) {
        commentHelper.textContent = error.message || COMMENT_FAILURE;
    } finally {
        commentSubmit.removeAttribute("aria-busy");
        syncNewCommentSubmitButton();
    }
}

async function togglePostLike() {
    if (!getAccessToken()) {
        commentHelper.textContent = AUTH_LOGIN_REQUIRED;
        return;
    }

    if (!state.post || state.isLikeRequestPending) {
        return;
    }

    state.isLikeRequestPending = true;
    syncPostStats(state.post);

    try {
        if (state.post.isLiked) {
            await withAuthExpiryHandling(unlikePost(postId));
            state.post = {
                ...state.post,
                isLiked: false,
                likeCount: Math.max(0, Number(state.post.likeCount) - 1),
            };
        } else {
            const like = await withAuthExpiryHandling(likePost(postId));
            state.post = {
                ...state.post,
                isLiked: Boolean(like.isLiked),
                likeCount: typeof like.likeCount === "number" ? like.likeCount : Number(state.post.likeCount) + 1,
            };
        }

        syncPostStats(state.post);
    } catch (error) {
        commentHelper.textContent = error.message || POST_LOAD_FAILURE;
    } finally {
        state.isLikeRequestPending = false;
        syncPostStats(state.post);
    }
}

function openDeleteConfirmDialog(type, id = "") {
    confirmDialog.open({
        title: type === DELETE_TARGET_TYPE.POST ? "게시글을 삭제하시겠습니까?" : "댓글을 삭제하시겠습니까?",
        description: "삭제한 내용은 복구 할 수 없습니다.",
        payload: { type, id },
    });
}

async function deleteConfirmedTarget() {
    const pendingDelete = confirmDialog.getPayload();

    if (!pendingDelete) {
        return;
    }

    confirmDialog.setConfirmButtonLoading(true);

    try {
        if (pendingDelete.type === DELETE_TARGET_TYPE.POST) {
            await withAuthExpiryHandling(deletePost(postId));
            globalThis.location.href = routes.posts;
            return;
        }

        await withAuthExpiryHandling(deleteComment(postId, pendingDelete.id));
        confirmDialog.close();
        await reloadPostDetailAfterCommentChange();
    } catch (error) {
        confirmDialog.close();
        commentHelper.textContent = error.message || COMMENT_FAILURE;
    } finally {
        confirmDialog.setConfirmButtonLoading(false);
    }
}

function findCommentById(commentId) {
    return state.comments.find((comment) => String(comment.commentId) === String(commentId));
}

function startEditingComment(commentId) {
    const comment = findCommentById(commentId);

    if (!comment) {
        return;
    }

    state.editingCommentId = comment.commentId;
    renderCommentList();
}

function cancelEditingComment() {
    state.editingCommentId = "";
    renderCommentList();
}

async function submitEditedComment(commentId, content) {
    if (!commentId) {
        throw new Error(COMMENT_FAILURE);
    }

    if (!getAccessToken()) {
        throw new Error(AUTH_LOGIN_REQUIRED);
    }

    if (!content) {
        throw new Error(COMMENT_REQUIRED);
    }

    await withAuthExpiryHandling(updateComment(postId, commentId, content));
    state.editingCommentId = "";
    await reloadPostDetailAfterCommentChange();
}

deletePostButton.addEventListener("click", () => openDeleteConfirmDialog(DELETE_TARGET_TYPE.POST));
likeButton.addEventListener("click", togglePostLike);

commentInput.addEventListener("input", () => {
    commentHelper.textContent = "";
    syncNewCommentSubmitButton();
});

commentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitNewComment();
});

confirmOk.addEventListener("click", deleteConfirmedTarget);

headerProfile.loadCurrentUser().then(loadPostDetailPage);
