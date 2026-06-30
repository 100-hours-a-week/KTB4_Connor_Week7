import {request} from "./client.js";
import {authHeaders} from "../utils/session.js";

async function fetchComments(postId) {
    const data = await request(`/api/posts/${postId}`, {})
    return Array.isArray(data.comments)
}

function createComment(postId, content) {
    return request(`/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ content })
    })
}

function updateComment(postId, commentId, content) {
    return request(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
        {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({ content })
        }
    )
}

function deleteComment(postId, commentId) {
    return request(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
        {
            method: "DELETE",
            headers: authHeaders()
        }
    )
}

export { fetchComments, createComment, updateComment, deleteComment };
