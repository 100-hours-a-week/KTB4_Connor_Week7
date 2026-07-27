import { Link, useNavigate } from "react-router";
import { uploadImage } from "../../api/images.js";
import { signup } from "../../api/users.js";
import { SignupForm } from "../../features/register-user/SignupForm.jsx";
import { BookingPublicHeader } from "../../widgets/booking-header/BookingPageHeader.jsx";

function SignupPage({ upload = uploadImage, register = signup }) {
  const navigate = useNavigate();

  return (
    <div className="booking-body booking-app-shell is-navigation-free auth-app-shell">
      <BookingPublicHeader backTo="/login" />
      <main className="signup-page">
        <section className="signup-section" aria-labelledby="signup-title">
          <h1 id="signup-title" tabIndex={-1}>
            회원가입
          </h1>
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
    </div>
  );
}

export { SignupPage };
