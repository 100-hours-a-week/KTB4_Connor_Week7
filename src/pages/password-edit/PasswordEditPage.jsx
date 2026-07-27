import { updatePassword } from "../../api/users.js";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import { PasswordChangeForm } from "../../features/manage-profile/PasswordChangeForm.jsx";
import { BookingPageHeader } from "../../widgets/booking-header/BookingPageHeader.jsx";

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
