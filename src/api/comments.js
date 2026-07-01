import { request } from "./client.js";
import { createAuthHeaders } from "../utils/session.js";

async function fetchComments(postId) {
    const data = await request(`/api/posts/${encodeURIComponent(postId)}/comments`);
    return Array.isArray(data.comments) ? data.comments : [];
}

function createComment(postId, content) {
    return request(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: createAuthHeaders({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify({ content }),
    });
}

function updateComment(postId, commentId, content) {
    return request(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
        {
            method: "PATCH",
            headers: createAuthHeaders({
                "Content-Type": "application/json",
            }),
            body: JSON.stringify({ content }),
        }
    );
}

function deleteComment(postId, commentId) {
    return request(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
        {
            method: "DELETE",
            headers: createAuthHeaders(),
        }
    );
}

export { fetchComments, createComment, updateComment, deleteComment };
