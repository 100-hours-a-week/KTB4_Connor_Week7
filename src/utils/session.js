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

export {
  saveSession,
  updateStoredUser,
};
