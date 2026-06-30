import {request} from "./client.js";
import {authHeaders} from "../utils/session.js";

function fetchPosts({cursor = null, size = 10} = {}) {
    const params = new URLSearchParams({size: String(size)});

    if (cursor) params.set("cursor", cursor);

    return request(`/api/posts?${params.toString()}`, {
        headers: authHeaders()
    })
}

function fetchPost(postId) {
    return request(`/api/posts/${encodeURIComponent(postId)}`, {
        headers: authHeaders()
    })
}

function createPost({ title, content, imageUrl}) {
    return request(`/api/posts`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ title, content, imageUrl })
    })
}

function updatePost({ id, title, content, imageUrl }) {
    return request(`/api/posts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ title, content, imageUrl })
    })
}

function deletePost(postId) {
    return request(`/api/posts/${encodeURIComponent(postId)}`, {
        method: "DELETE",
        headers: authHeaders()
    })
}

function likePost(postId) {
    return request(`/api/posts/${encodeURIComponent(postId)}/like`, {
        method: "POST",
        headers: authHeaders()
    })
}

function unlikePost(postId) {
    return request(`/api/posts/${encodeURIComponent(postId)}/like`, {
        method: "DELETE",
        headers: authHeaders()
    })
}

export {
    fetchPosts,
    fetchPost,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost
}