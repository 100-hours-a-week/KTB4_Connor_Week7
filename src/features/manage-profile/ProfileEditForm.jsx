import { useEffect, useState } from "react";
import { UserAvatar } from "../../entities/user/UserAvatar.jsx";
import {
  PROFILE_NICKNAME_LENGTH,
  PROFILE_UPDATE_FAILURE,
  USER_NICKNAME_DUPLICATE,
  USER_NICKNAME_REQUIRED,
  USER_NICKNAME_SPACE,
} from "../../constants/messages.js";

function validateNickname(nickname) {
  if (!nickname.trim()) return USER_NICKNAME_REQUIRED;
  if (/\s/.test(nickname)) return USER_NICKNAME_SPACE;
  if (nickname.length > 10) return PROFILE_NICKNAME_LENGTH;
  return "";
}

function ProfileEditForm({
  user,
  upload,
  updateProfile,
  onUpdated,
  onUnauthorized,
}) {
  const [nickname, setNickname] = useState(user.nickname || "");
  const [profileFile, setProfileFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);
  const nicknameError = validateNickname(nickname);

  useEffect(() => {
    if (!profileFile) {
      setPreviewUrl("");
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(profileFile);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [profileFile]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setUpdated(false);
    setErrors({ nickname: nicknameError });
    if (nicknameError) return;

    setSubmitting(true);
    try {
      const profileImage = profileFile
        ? await upload(profileFile, PROFILE_UPDATE_FAILURE)
        : user.profileImage || null;
      const response = await updateProfile({
        nickname: nickname.trim(),
        profileImage,
      });
      const nextUser = {
        ...user,
        ...response,
        profileImage: response.profileImage || profileImage,
      };

      setProfileFile(null);
      setUpdated(true);
      onUpdated(nextUser);
    } catch (error) {
      if (onUnauthorized(error)) return;
      const message = error.message || PROFILE_UPDATE_FAILURE;
      setErrors(
        message.includes("닉네임")
          ? { nickname: USER_NICKNAME_DUPLICATE }
          : { form: message },
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="profile-edit-form" noValidate onSubmit={handleSubmit}>
        <div className="profile-edit-photo-field">
          <span id="edit-profile-label" className="field-label">
            프로필 사진*
          </span>
          <label
            className="edit-profile-upload"
            htmlFor="edit-profile-image"
          >
            <UserAvatar
              imageUrl={previewUrl || user.profileImage}
              nickname={nickname}
              imageClassName="edit-profile-preview"
              fallbackClassName="edit-profile-fallback"
            />
            <span className="edit-profile-overlay">변경</span>
            <input
              id="edit-profile-image"
              className="visually-hidden"
              name="profileImage"
              type="file"
              accept="image/*"
              aria-labelledby="edit-profile-label"
              onChange={(event) => {
                setProfileFile(event.target.files[0] || null);
                setErrors((current) => ({ ...current, form: "" }));
                setUpdated(false);
              }}
            />
          </label>
        </div>

        <div className="field profile-email-field">
          <span className="field-label">이메일</span>
          <p className="profile-email">{user.email || ""}</p>
        </div>

        <div className="field">
          <label htmlFor="edit-nickname">닉네임</label>
          <input
            id="edit-nickname"
            name="nickname"
            type="text"
            autoComplete="nickname"
            aria-describedby="nickname-helper form-helper"
            aria-invalid={Boolean(errors.nickname)}
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value);
              setErrors({});
              setUpdated(false);
            }}
            onBlur={() => setErrors({ nickname: nicknameError })}
          />
          <p id="nickname-helper" className="helper-text" aria-live="polite">
            {errors.nickname || ""}
          </p>
        </div>

        <p
          id="form-helper"
          className="helper-text form-helper"
          aria-live="polite"
        >
          {errors.form || ""}
        </p>
        <button
          className="profile-submit"
          type="submit"
          disabled={submitting || Boolean(nicknameError)}
          aria-busy={submitting}
        >
          {submitting ? "수정 중..." : "수정하기"}
        </button>
      </form>

      <p className="toast" role="status" hidden={!updated}>
        수정완료
      </p>
    </>
  );
}

export { ProfileEditForm };
