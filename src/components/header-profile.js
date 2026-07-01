import { logout as logoutRequest } from "../api/auth.js";
import { fetchMe } from "../api/users.js";
import { AUTH_LOGOUT_FAILURE_LOG } from "../constants/messages.js";
import { getAccessToken, clearSession, updateStoredUser } from "../utils/session.js";
import { resolveImageUrl } from "../utils/image.js";
import { routes } from "../utils/routes.js";

function createHeaderProfile() {
    const headerProfile = document.querySelector(".header-profile");
    const avatarButton = document.querySelector(".header-avatar");
    const avatarImage = document.querySelector(".header-avatar-image");
    const avatarFallback = document.querySelector(".header-avatar-fallback");
    const profileMenu = document.querySelector(".profile-menu");
    const logoutButton = document.querySelector(".logout-button");
    const loginMenuLink = profileMenu?.querySelector(".login-menu-link") || document.createElement("a");
    const authenticatedMenuItems = profileMenu
        ? Array.from(profileMenu.children).filter((item) => item !== loginMenuLink)
        : [];

    if (profileMenu && !loginMenuLink.parentElement) {
        loginMenuLink.className = "login-menu-link";
        loginMenuLink.href = routes.login;
        loginMenuLink.textContent = "로그인";
        profileMenu.prepend(loginMenuLink);
    }

    function setAvatar(imageUrl) {
        if (!avatarImage || !avatarFallback) {
            return;
        }

        if (!imageUrl) {
            avatarImage.removeAttribute("src");
            avatarImage.hidden = true;
            avatarFallback.hidden = false;
            return;
        }

        avatarImage.src = resolveImageUrl(imageUrl);
        avatarImage.hidden = false;
        avatarFallback.hidden = true;
    }

    function closeMenu() {
        if (!profileMenu || !avatarButton) {
            return;
        }

        profileMenu.hidden = true;
        avatarButton.setAttribute("aria-expanded", "false");
    }

    function setVisible(isVisible) {
        if (!headerProfile) {
            return;
        }

        headerProfile.hidden = !isVisible;
        if (!isVisible) {
            setAvatar("");
            closeMenu();
        }
    }

    function setAuthenticated(isAuthenticated) {
        if (!avatarButton) {
            return;
        }

        loginMenuLink.hidden = isAuthenticated;
        authenticatedMenuItems.forEach((item) => {
            item.hidden = !isAuthenticated;
        });

        avatarButton.setAttribute("aria-label", isAuthenticated ? "프로필 메뉴 열기" : "로그인 메뉴 열기");
    }

    function isAuthenticated() {
        return Boolean(getAccessToken());
    }

    function toggleMenu(forceOpen) {
        if (!profileMenu || !avatarButton) {
            closeMenu();
            return;
        }

        const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : profileMenu.hidden;
        profileMenu.hidden = !shouldOpen;
        avatarButton.setAttribute("aria-expanded", String(shouldOpen));
    }

    async function logout() {
        try {
            await logoutRequest();
        } catch (error) {
            console.error(AUTH_LOGOUT_FAILURE_LOG, error);
        } finally {
            clearSession();
            setVisible(false);
            globalThis.location.href = routes.login;
        }
    }

    async function loadCurrentUser({ fallbackMessage, onError } = {}) {
        setVisible(true);
        setAuthenticated(Boolean(getAccessToken()));

        if (!getAccessToken()) {
            setAvatar("");
            return null;
        }

        setAvatar(sessionStorage.getItem("profileImage") || "");

        try {
            const user = await fetchMe(fallbackMessage);
            updateStoredUser(user);
            setAvatar(user.profileImage || "");
            return user;
        } catch (error) {
            if (error.status === 401) {
                clearSession();
                setAvatar("");
                setAuthenticated(false);
                setVisible(true);
            }

            onError?.(error);
            return null;
        }
    }

    avatarButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleMenu();
    });

    document.addEventListener("click", (event) => {
        if (profileMenu && !profileMenu.hidden && !event.target.closest(".header-profile")) {
            toggleMenu(false);
        }
    });

    logoutButton?.addEventListener("click", logout);

    return {
        loadCurrentUser,
        isAuthenticated,
        setAvatar,
        setVisible,
        toggleMenu,
    };
}

export { createHeaderProfile };
