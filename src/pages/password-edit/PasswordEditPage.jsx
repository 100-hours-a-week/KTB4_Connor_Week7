import { updatePassword } from "../../api/users.js";
import { useAuth } from "../../features/auth/AuthProvider.jsx";
import { PasswordChangeForm } from "../../features/profile/PasswordChangeForm.jsx";
import { BookingPageHeader } from "../../features/auth/BookingPageHeader.jsx";

function PasswordEditPage({ changePassword = updatePassword }) {
  const { recoverUnauthorized } = useAuth();

  return (
    <div className="booking-body booking-app-shell is-navigation-free member-app-shell">
      <BookingPageHeader />
      <main className="password-edit-page">
        <h1 className="member-page-title" tabIndex={-1}>마이페이지</h1>
        <section
          className="password-edit-section"
          aria-labelledby="password-edit-title"
        >
          <h2 id="password-edit-title">비밀번호 수정</h2>
          <PasswordChangeForm
            changePassword={changePassword}
            onUnauthorized={recoverUnauthorized}
          />
        </section>
      </main>
    </div>
  );
}

export { PasswordEditPage };
