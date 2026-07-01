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
import { accessToken, clearSession, currentProfileImage, isCurrentUser } from "../utils/session.js";

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
    isLikeLoading: false,
};
const DELETE_TARGET = {
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
    onDelete(commentId) {
        openConfirm(DELETE_TARGET.COMMENT, commentId);
    },
    onEdit(commentId) {
        startCommentEdit(commentId);
    },
    onCancelEdit() {
        cancelCommentEdit();
    },
    onUpdate(commentId, content) {
        return submitCommentEdit(commentId, content);
    },
});

function showState(message) {
    detailState.textContent = message;
    detailState.hidden = !message;
}

function handleAuthFailure() {
    clearSession();
    state.editingCommentId = "";
    headerProfile.loadCurrentUser();
    headerProfile.toggleMenu(false);

    if (state.post) {
        updatePostCounts(state.post);
    }

    renderComments();
    updateCommentSubmitState();
}

async function withAuthHandling(promise) {
    try {
        return await promise;
    } catch (error) {
        if (error.status === 401) {
            handleAuthFailure();
            throw new Error(AUTH_EXPIRED);
        }

        throw error;
    }
}

function renderPost(post) {
    const imageUrl = resolveImageUrl(post.imageUrl);
    const canEditPost = isCurrentUser(post.userId);
    const authorProfileImage = post.profileImage
        || post.authorProfileImage
        || (canEditPost ? currentProfileImage() : "");

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

    updatePostCounts(post);
    detailArticle.hidden = false;
    showState("");
}

function updatePostCounts(post) {
    likeCountText.textContent = formatCount(post.likeCount);
    viewCountText.textContent = formatCount(post.viewCount);
    commentCountText.textContent = formatCount(post.commentCount);
    likeButton.classList.toggle("is-liked", Boolean(post.isLiked));
    likeButton.setAttribute("aria-pressed", String(Boolean(post.isLiked)));
    likeButton.disabled = !accessToken() || state.isLikeLoading;
}

async function loadDetail() {
    if (!postId) {
        showState(POST_NOT_FOUND_STATE);
        return;
    }

    try {
        showState("게시글을 불러오는 중입니다.");
        const [post, comments] = await Promise.all([
            withAuthHandling(fetchPost(postId, POST_LOAD_FAILURE)),
            withAuthHandling(fetchComments(postId)),
        ]);
        state.post = post;
        state.comments = comments;
        renderPost(post);
        renderComments();
    } catch (error) {
        detailArticle.hidden = true;
        showState(error.message || POST_LOAD_FAILURE);
    }
}

function updateCommentSubmitState() {
    commentSubmit.disabled = !accessToken() || !commentInput.value.trim();
}

function resetCommentForm() {
    commentInput.value = "";
    commentHelper.textContent = "";
    commentSubmit.textContent = "댓글 등록";
    updateCommentSubmitState();
}

function renderComments() {
    commentList.render(state.comments, {
        editingCommentId: state.editingCommentId,
    });
}

async function refreshAfterCommentChange() {
    const [post, comments] = await Promise.all([
        withAuthHandling(fetchPost(postId, POST_LOAD_FAILURE)),
        withAuthHandling(fetchComments(postId)),
    ]);
    state.post = post;
    state.comments = comments;
    renderPost(post);
    renderComments();
}

async function submitComment() {
    const content = commentInput.value.trim();

    if (!accessToken()) {
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
        await withAuthHandling(createComment(postId, content));
        resetCommentForm();
        await refreshAfterCommentChange();
    } catch (error) {
        commentHelper.textContent = error.message || COMMENT_FAILURE;
    } finally {
        commentSubmit.removeAttribute("aria-busy");
        updateCommentSubmitState();
    }
}

async function toggleLike() {
    if (!accessToken()) {
        commentHelper.textContent = AUTH_LOGIN_REQUIRED;
        return;
    }

    if (!state.post || state.isLikeLoading) {
        return;
    }

    state.isLikeLoading = true;
    updatePostCounts(state.post);

    try {
        if (state.post.isLiked) {
            await withAuthHandling(unlikePost(postId));
            state.post = {
                ...state.post,
                isLiked: false,
                likeCount: Math.max(0, Number(state.post.likeCount) - 1),
            };
        } else {
            const like = await withAuthHandling(likePost(postId));
            state.post = {
                ...state.post,
                isLiked: Boolean(like.isLiked),
                likeCount: typeof like.likeCount === "number" ? like.likeCount : Number(state.post.likeCount) + 1,
            };
        }

        updatePostCounts(state.post);
    } catch (error) {
        commentHelper.textContent = error.message || POST_LOAD_FAILURE;
    } finally {
        state.isLikeLoading = false;
        updatePostCounts(state.post);
    }
}

function openConfirm(type, id = "") {
    confirmDialog.open({
        title: type === DELETE_TARGET.POST ? "게시글을 삭제하시겠습니까?" : "댓글을 삭제하시겠습니까?",
        description: "삭제한 내용은 복구 할 수 없습니다.",
        payload: { type, id },
    });
}

async function confirmDelete() {
    const pendingDelete = confirmDialog.getPayload();

    if (!pendingDelete) {
        return;
    }

    confirmDialog.setConfirmLoading(true);

    try {
        if (pendingDelete.type === DELETE_TARGET.POST) {
            await withAuthHandling(deletePost(postId));
            globalThis.location.href = routes.posts;
            return;
        }

        await withAuthHandling(deleteComment(postId, pendingDelete.id));
        confirmDialog.close();
        await refreshAfterCommentChange();
    } catch (error) {
        confirmDialog.close();
        commentHelper.textContent = error.message || COMMENT_FAILURE;
    } finally {
        confirmDialog.setConfirmLoading(false);
    }
}

function findComment(commentId) {
    return state.comments.find((comment) => comment.commentId === commentId);
}

function startCommentEdit(commentId) {
    const comment = findComment(commentId);

    if (!comment) {
        return;
    }

    state.editingCommentId = comment.commentId;
    renderComments();
}

function cancelCommentEdit() {
    state.editingCommentId = "";
    renderComments();
}

async function submitCommentEdit(commentId, content) {
    if (!commentId) {
        throw new Error(COMMENT_FAILURE);
    }

    if (!accessToken()) {
        throw new Error(AUTH_LOGIN_REQUIRED);
    }

    if (!content) {
        throw new Error(COMMENT_REQUIRED);
    }

    await withAuthHandling(updateComment(postId, commentId, content));
    state.editingCommentId = "";
    await refreshAfterCommentChange();
}

deletePostButton.addEventListener("click", () => openConfirm(DELETE_TARGET.POST));
likeButton.addEventListener("click", toggleLike);

commentInput.addEventListener("input", () => {
    commentHelper.textContent = "";
    updateCommentSubmitState();
});

commentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitComment();
});

confirmOk.addEventListener("click", confirmDelete);

headerProfile.loadCurrentUser().then(loadDetail);
