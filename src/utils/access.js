import { routes } from "./routes.js";
import { getAccessToken, clearSession } from "./session.js";

function redirectToLogin() {
    globalThis.location.href = routes.login;
}

function requireAccessToken() {
    if (getAccessToken()) {
        return true;
    }

    redirectToLogin();
    return false;
}

function handleUnauthorized(error) {
    if (error?.status !== 401) {
        return false;
    }

    clearSession();
    sessionStorage.setItem("loginFeedback", "로그인이 만료되었어요. 다시 로그인해 주세요.");
    redirectToLogin();
    return true;
}

export { handleUnauthorized, redirectToLogin, requireAccessToken };
