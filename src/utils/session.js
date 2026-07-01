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
function accessToken() {
  return sessionStorage.getItem("accessToken") || "";
}

function authHeaders(extraHeaders = {}) {
  const token = accessToken();
  return token ? { ...extraHeaders, Authorization: `Bearer ${token}` } : extraHeaders;
}

function currentUserId() {
  return sessionStorage.getItem("userId") || "";
}

function isCurrentUser(userId) {
  return Boolean(userId) && userId === currentUserId();
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
  accessToken,
  authHeaders,
  currentUserId,
  isCurrentUser,
  clearSession,
};
