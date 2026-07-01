import { request } from "./client.js";
import { createAuthHeaders } from "../utils/session.js";

function signup({ email, password, nickname, profileImage }) {
    return request(
        "/api/users/signup", {
            method: "POST",
            headers: createAuthHeaders({
                "Content-Type": "application/json",
            }),
            body: JSON.stringify({ email, password, nickname, profileImage }),
        }
    );
}

function fetchMe(fallbackMessage) {
    return request(
        "/api/users/me",
        {
            method: "GET",
            headers: createAuthHeaders(),
        },
        fallbackMessage
    );
}

function updateMe({ nickname, profileImage }) {
    return request(
        "/api/users/me",
        {
            method: "PATCH",
            headers: createAuthHeaders({
                "Content-Type": "application/json",
            }),
            body: JSON.stringify({ nickname, profileImage }),
        }
    );
}

function withdrawMe() {
    return request("/api/users/me", {
        method: "DELETE",
        headers: createAuthHeaders(),
    });
}

function updatePassword({ newPassword }) {
    return request(
        "/api/users/me/password",
        {
            method: "PATCH",
            headers: createAuthHeaders({
                "Content-Type": "application/json",
            }),
            body: JSON.stringify({ newPassword }),
        }
    );
}

export { signup, fetchMe, updateMe, withdrawMe, updatePassword };
