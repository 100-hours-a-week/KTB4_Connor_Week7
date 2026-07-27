import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { login } from "../../api/auth.js";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import { LoginForm } from "../../features/authenticate/LoginForm.jsx";

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
    <>
      <header className="site-header">
        <h1>회의실 예약</h1>
      </header>
      <main className="login-page">
        <section className="login-section" aria-labelledby="login-title">
          <h2 id="login-title" tabIndex={-1}>
            로그인
          </h2>
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
    </>
  );
}

export { LoginPage };
