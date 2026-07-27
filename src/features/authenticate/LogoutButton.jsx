import { useState } from "react";
import { useNavigate } from "react-router";
import { logout } from "../../api/auth.js";
import { useAuth } from "./AuthContext.jsx";
import { AUTH_LOGOUT_FAILURE_LOG } from "../../constants/messages.js";

function LogoutButton({ logoutRequest = logout }) {
  const navigate = useNavigate();
  const { clearAuthentication } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    if (submitting) return;
    setSubmitting(true);

    try {
      await logoutRequest();
    } catch (error) {
      console.error(AUTH_LOGOUT_FAILURE_LOG, error);
    } finally {
      clearAuthentication();
      navigate("/login", { replace: true });
    }
  }

  return (
    <button
      className="logout-button"
      type="button"
      disabled={submitting}
      aria-busy={submitting}
      onClick={handleLogout}
    >
      로그아웃
    </button>
  );
}

export { LogoutButton };
