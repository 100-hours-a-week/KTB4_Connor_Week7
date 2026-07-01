function saveSession(user) {
  if (user.accessToken) {
    sessionStorage.setItem("accessToken", user.accessToken);
  }

  updateStoredUser(user);
}

function updateStoredUser(user) {
  if (user.userId) {
    sessionStorage.setItem("userId", user.userId);
  }

  if (user.nickname) {
    sessionStorage.setItem("nickname", user.nickname);
  }

  if (Object.hasOwn(user, "profileImage")) {
    if (user.profileImage) {
      sessionStorage.setItem("profileImage", user.profileImage);
    } else {
      sessionStorage.removeItem("profileImage");
    }
  }
}

function getAccessToken() {
  return sessionStorage.getItem("accessToken") || "";
}

function createAuthHeaders(extraHeaders = {}) {
  const token = getAccessToken();
  return token ? { ...extraHeaders, Authorization: `Bearer ${token}` } : extraHeaders;
}

function getCurrentUserId() {
  return sessionStorage.getItem("userId") || "";
}

function getCurrentProfileImage() {
  return sessionStorage.getItem("profileImage") || "";
}

function isCurrentUser(userId) {
  return userId != null && String(userId) === getCurrentUserId();
}

function clearSession() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("nickname");
  sessionStorage.removeItem("profileImage");
}
export {
  saveSession,
  updateStoredUser,
  getAccessToken,
  createAuthHeaders,
  getCurrentUserId,
  getCurrentProfileImage,
  isCurrentUser,
  clearSession,
};
