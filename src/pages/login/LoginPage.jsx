import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { login } from "../../api/auth.js";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import { LoginForm } from "../../features/authenticate/LoginForm.jsx";
import { BookingPublicHeader } from "../../widgets/booking-header/BookingPageHeader.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, saveAuthenticatedUser } = useAuth();
  const [initialFeedback, setInitialFeedback] = useState("");

  useEffect(() => {
    const feedback = sessionStorage.getItem("loginFeedback");
    if (!feedback) return;

    setInitialFeedback(feedback);
    sessionStorage.removeItem("loginFeedback");
  }, []);

  if (isAuthenticated) return <Navigate to="/rooms" replace />;

  return (
    <div className="booking-body booking-app-shell is-navigation-free auth-app-shell">
      <BookingPublicHeader />
      <main className="login-page">
        <section className="login-section" aria-labelledby="login-title">
          <h1 id="login-title" tabIndex={-1}>
            로그인
          </h1>
          <LoginForm
            authenticate={login}
            initialFeedback={initialFeedback}
            onAuthenticated={(user) => {
              saveAuthenticatedUser(user);
              navigate("/rooms", { replace: true });
            }}
          />
          <Link className="signup-link" to="/signup">
            회원가입
          </Link>
        </section>
      </main>
    </div>
  );
}

export { LoginPage };
