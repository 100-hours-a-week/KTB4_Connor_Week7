import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import { uploadImage } from "../../api/images.js";
import { fetchMe, updateMe, withdrawMe } from "../../api/users.js";
import { ProfileEditForm } from "../../features/manage-profile/ProfileEditForm.jsx";
import { WithdrawAccountButton } from "../../features/manage-profile/WithdrawAccountButton.jsx";
import { PROFILE_LOAD_FAILURE } from "../../constants/messages.js";
import { BookingPageHeader } from "../../widgets/booking-header/BookingPageHeader.jsx";

function ProfileEditPage({
  loadProfile = fetchMe,
  upload = uploadImage,
  updateProfile = updateMe,
  withdraw = withdrawMe,
}) {
  const navigate = useNavigate();
  const {
    clearAuthentication,
    recoverUnauthorized,
    updateAuthenticatedUser,
  } = useAuth();
  const [requestState, setRequestState] = useState({
    status: "loading",
    user: null,
    error: "",
  });
  const initialLoadStarted = useRef(false);

  const load = useCallback(async () => {
    setRequestState({ status: "loading", user: null, error: "" });

    try {
      const user = await loadProfile(PROFILE_LOAD_FAILURE);
      setRequestState({ status: "success", user, error: "" });
      updateAuthenticatedUser(user);
    } catch (error) {
      if (recoverUnauthorized(error)) return;
      setRequestState({
        status: "error",
        user: null,
        error: error.message || PROFILE_LOAD_FAILURE,
      });
    }
  }, [loadProfile, recoverUnauthorized, updateAuthenticatedUser]);

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    load();
  }, [load]);

  return (
    <div className="booking-body booking-app-shell is-navigation-free member-app-shell">
      <BookingPageHeader />
      <main className="profile-edit-page">
        <h1 className="member-page-title" tabIndex={-1}>마이페이지</h1>
        <section
          className="profile-edit-section"
          aria-labelledby="profile-edit-title"
        >
          <h2 id="profile-edit-title">회원정보수정</h2>

          {requestState.status === "loading" ? (
            <p aria-live="polite">회원정보를 불러오는 중입니다.</p>
          ) : null}

          {requestState.status === "error" ? (
            <div aria-live="polite">
              <p>{requestState.error}</p>
              <button type="button" onClick={load}>
                다시 시도
              </button>
            </div>
          ) : null}

          {requestState.status === "success" ? (
            <>
              <ProfileEditForm
                user={requestState.user}
                upload={upload}
                updateProfile={updateProfile}
                onUnauthorized={recoverUnauthorized}
                onUpdated={(user) => {
                  setRequestState({ status: "success", user, error: "" });
                  updateAuthenticatedUser(user);
                }}
              />
              <Link className="profile-password-link" to="/profile/password">
                비밀번호 수정
              </Link>
              <WithdrawAccountButton
                withdraw={withdraw}
                onUnauthorized={recoverUnauthorized}
                onWithdrawn={() => {
                  clearAuthentication();
                  navigate("/login", { replace: true });
                }}
              />
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export { ProfileEditPage };
