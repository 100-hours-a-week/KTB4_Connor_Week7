import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router";
import {
  clearSession,
  getAccessToken,
  getCurrentProfileImage,
  saveSession,
  updateStoredUser,
} from "../../utils/session.js";

const AuthContext = createContext(null);

function readUserSnapshot() {
  return {
    userId: sessionStorage.getItem("userId") || "",
    nickname: sessionStorage.getItem("nickname") || "",
    profileImage: getCurrentProfileImage(),
  };
}

function getErrorStatus(error) {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }
  return typeof error.status === "number" ? error.status : undefined;
}

function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const [user, setUser] = useState(readUserSnapshot);

  function clearAuthentication({ feedback = "" } = {}) {
    clearSession();
    if (feedback) sessionStorage.setItem("loginFeedback", feedback);
    setAccessToken("");
    setUser(readUserSnapshot());
  }

  function recoverUnauthorized(error) {
    if (getErrorStatus(error) !== 401) return false;
    clearAuthentication({
      feedback: "로그인이 만료되었어요. 다시 로그인해 주세요.",
    });
    navigate("/login", { replace: true });
    return true;
  }

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken),
    saveAuthenticatedUser(nextUser) {
      saveSession(nextUser);
      setAccessToken(getAccessToken());
      setUser(readUserSnapshot());
    },
    updateAuthenticatedUser(nextUser) {
      updateStoredUser(nextUser);
      setUser(readUserSnapshot());
    },
    clearAuthentication,
    recoverUnauthorized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export { AuthProvider, useAuth };
