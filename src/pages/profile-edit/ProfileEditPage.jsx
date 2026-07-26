import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider.jsx";
import { uploadImage } from "../../api/images.js";
import { fetchMe, updateMe } from "../../api/users.js";
import { ProfileEditForm } from "../../features/manage-profile/ProfileEditForm.jsx";
import { PROFILE_LOAD_FAILURE } from "../../constants/messages.js";

function ProfileEditPage({
  loadProfile = fetchMe,
  upload = uploadImage,
  updateProfile = updateMe,
}) {
  const { recoverUnauthorized, updateAuthenticatedUser } = useAuth();
  const [requestState, setRequestState] = useState({
    status: "loading",
    user: null,
    error: "",
  });
  const initialLoadStarted = useRef(false);

  async function load() {
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
  }

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    load();
  }, []);

  return (
    <main className="profile-edit-page">
      <section
        className="profile-edit-section"
        aria-labelledby="profile-edit-title"
      >
        <h2 id="profile-edit-title" tabIndex={-1}>
          회원정보수정
        </h2>

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
        ) : null}
      </section>
    </main>
  );
}

export { ProfileEditPage };
