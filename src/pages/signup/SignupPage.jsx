import { Link, useNavigate } from "react-router";
import { uploadImage } from "../../api/images.js";
import { signup } from "../../api/users.js";
import { SignupForm } from "../../features/register-user/SignupForm.jsx";

function SignupPage({ upload = uploadImage, register = signup }) {
  const navigate = useNavigate();

  return (
    <>
      <header className="site-header">
        <Link
          className="back-link"
          to="/login"
          aria-label="이전 페이지로 이동"
        >
          ‹
        </Link>
        <h1>회의실 예약</h1>
      </header>
      <main className="signup-page">
        <section className="signup-section" aria-labelledby="signup-title">
          <h2 id="signup-title" tabIndex={-1}>
            회원가입
          </h2>
          <SignupForm
            upload={upload}
            register={register}
            onCompleted={() => navigate("/login", { replace: true })}
          />
          <Link className="login-link" to="/login">
            로그인하러 가기
          </Link>
        </section>
      </main>
    </>
  );
}

export { SignupPage };
