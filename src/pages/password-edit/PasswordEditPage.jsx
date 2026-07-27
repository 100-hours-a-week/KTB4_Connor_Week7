import { updatePassword } from "../../api/users.js";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import { PasswordChangeForm } from "../../features/manage-profile/PasswordChangeForm.jsx";

function PasswordEditPage({ changePassword = updatePassword }) {
  const { recoverUnauthorized } = useAuth();

  return (
    <main className="password-edit-page">
      <section
        className="password-edit-section"
        aria-labelledby="password-edit-title"
      >
        <h2 id="password-edit-title" tabIndex={-1}>
          비밀번호 수정
        </h2>
        <PasswordChangeForm
          changePassword={changePassword}
          onUnauthorized={recoverUnauthorized}
        />
      </section>
    </main>
  );
}

export { PasswordEditPage };
