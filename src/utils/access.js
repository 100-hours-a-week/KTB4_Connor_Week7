import { routes } from "./routes.js";
import { accessToken, clearSession } from "./session.js";

function redirectToLogin() {
    globalThis.location.href = routes.login;
}

function requireAccessToken() {
    if (accessToken()) {
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
    redirectToLogin();
    return true;
}

export { handleUnauthorized, redirectToLogin, requireAccessToken };
