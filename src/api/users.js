import {request} from "./client.js";
import {authHeaders} from "../utils/session.js";

function signup({email, password, nickname, profileImage}) {
    return request(
        "api/users/signup", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ email, password, nickname, profileImage })
        }
    )
}

function fetchMe() {
    return request(
        "/api/users/me",{
            method: "GET",
            headers: authHeaders()
        }
    )
}

function updateMe({nickname, profileImage}) {
    return request(
        "/api/users/me", {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({nickname, profileImage})
        }
    )
}

function deleteMe() {
    return request("api/users/me", {
        method: "DELETE",
        headers: authHeaders()
    })
}

function updatePassword({currentPassword, newPassword}) {
    return request(
        "/api/users/me/password", {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({currentPassword, newPassword})
        }
    )
}

export {signup, fetchMe, updateMe, deleteMe, updatePassword};
