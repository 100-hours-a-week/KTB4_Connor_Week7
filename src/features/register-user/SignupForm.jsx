import { useEffect, useState } from "react";
import {
  PASSWORD_POLICY,
  SIGNUP_EMAIL_FORMAT,
  SIGNUP_EMAIL_REQUIRED,
  SIGNUP_EMAIL_SPACE,
  SIGNUP_FAILURE,
  SIGNUP_NICKNAME_LENGTH,
  SIGNUP_PASSWORD_CONFIRM_REQUIRED,
  SIGNUP_PASSWORD_MISMATCH,
  SIGNUP_PASSWORD_REQUIRED,
  SIGNUP_PROFILE_REQUIRED,
  USER_EMAIL_DUPLICATE,
  USER_NICKNAME_DUPLICATE,
  USER_NICKNAME_REQUIRED,
  USER_NICKNAME_SPACE,
} from "../../constants/messages.js";
import { isValidEmail, isValidPassword } from "../../utils/validation.js";

const initialValues = {
  email: "",
  password: "",
  passwordConfirm: "",
  nickname: "",
};

function validateSignup(values, profileFile) {
  const errors = {};

  if (!profileFile) errors.profile = SIGNUP_PROFILE_REQUIRED;
  if (!values.email.trim()) errors.email = SIGNUP_EMAIL_REQUIRED;
  else if (/\s/.test(values.email)) errors.email = SIGNUP_EMAIL_SPACE;
  else if (!isValidEmail(values.email)) errors.email = SIGNUP_EMAIL_FORMAT;
  if (!values.password) errors.password = SIGNUP_PASSWORD_REQUIRED;
  else if (!isValidPassword(values.password)) errors.password = PASSWORD_POLICY;
  if (!values.passwordConfirm) {
    errors.passwordConfirm = SIGNUP_PASSWORD_CONFIRM_REQUIRED;
  } else if (values.passwordConfirm !== values.password) {
    errors.passwordConfirm = SIGNUP_PASSWORD_MISMATCH;
  }
  if (!values.nickname.trim()) errors.nickname = USER_NICKNAME_REQUIRED;
  else if (/\s/.test(values.nickname)) errors.nickname = USER_NICKNAME_SPACE;
  else if (values.nickname.length > 10) {
    errors.nickname = SIGNUP_NICKNAME_LENGTH;
  }

  return errors;
}

function getSignupFailureErrors(message) {
  if (message.includes("이메일")) return { email: USER_EMAIL_DUPLICATE };
  if (message.includes("닉네임")) return { nickname: USER_NICKNAME_DUPLICATE };
  return { form: message };
}

function SignupForm({ upload, register, onCompleted }) {
  const [profileFile, setProfileFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const canSubmit =
    Object.keys(validateSignup(values, profileFile)).length === 0;

  useEffect(() => {
    if (!profileFile) {
      setPreviewUrl("");
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(profileFile);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [profileFile]);

  function changeField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "", form: "" }));
  }

  function validateField(name) {
    const nextErrors = validateSignup(values, profileFile);
    setErrors((current) => ({
      ...current,
      [name]: nextErrors[name] || "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validateSignup(values, profileFile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const profileImage = await upload(profileFile, SIGNUP_FAILURE);
      await register({
        email: values.email.trim(),
        password: values.password,
        nickname: values.nickname.trim(),
        profileImage,
      });
      onCompleted();
    } catch (error) {
      const message = error.message || SIGNUP_FAILURE;
      setErrors(getSignupFailureErrors(message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="signup-form" noValidate onSubmit={handleSubmit}>
      <div className="profile-field">
        <span id="profile-label" className="field-label">
          프로필 사진
        </span>
        <p id="profile-helper" className="helper-text" aria-live="polite">
          {errors.profile || ""}
        </p>
        <label
          className={`profile-upload${previewUrl ? " has-image" : ""}`}
          htmlFor="profile-image"
        >
          <span className="profile-plus" aria-hidden="true">
            +
          </span>
          {previewUrl ? (
            <img
              className="profile-preview"
              src={previewUrl}
              alt="선택한 프로필 사진 미리보기"
            />
          ) : null}
          <input
            id="profile-image"
            className="visually-hidden"
            name="profileImage"
            type="file"
            accept="image/*"
            aria-labelledby="profile-label"
            aria-describedby="profile-helper form-helper"
            aria-invalid={Boolean(errors.profile)}
            onChange={(event) => {
              setProfileFile(event.target.files[0] || null);
              setErrors((current) => ({
                ...current,
                profile: "",
                form: "",
              }));
            }}
            onBlur={() => validateField("profile")}
          />
        </label>
      </div>

      <div className="field">
        <label htmlFor="signup-email">이메일*</label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="이메일을 입력하세요"
          aria-describedby="email-helper form-helper"
          aria-invalid={Boolean(errors.email)}
          value={values.email}
          onChange={(event) => changeField("email", event.target.value)}
          onBlur={() => validateField("email")}
        />
        <p id="email-helper" className="helper-text" aria-live="polite">
          {errors.email || ""}
        </p>
      </div>

      <div className="field">
        <label htmlFor="signup-password">비밀번호*</label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 입력하세요"
          aria-describedby="password-helper form-helper"
          aria-invalid={Boolean(errors.password)}
          value={values.password}
          onChange={(event) => changeField("password", event.target.value)}
          onBlur={() => validateField("password")}
        />
        <p id="password-helper" className="helper-text" aria-live="polite">
          {errors.password || ""}
        </p>
      </div>

      <div className="field">
        <label htmlFor="password-confirm">비밀번호 확인*</label>
        <input
          id="password-confirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 한번 더 입력하세요"
          aria-describedby="password-confirm-helper form-helper"
          aria-invalid={Boolean(errors.passwordConfirm)}
          value={values.passwordConfirm}
          onChange={(event) =>
            changeField("passwordConfirm", event.target.value)
          }
          onBlur={() => validateField("passwordConfirm")}
        />
        <p
          id="password-confirm-helper"
          className="helper-text"
          aria-live="polite"
        >
          {errors.passwordConfirm || ""}
        </p>
      </div>

      <div className="field">
        <label htmlFor="nickname">닉네임*</label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          autoComplete="nickname"
          placeholder="닉네임을 입력하세요"
          aria-describedby="nickname-helper form-helper"
          aria-invalid={Boolean(errors.nickname)}
          value={values.nickname}
          onChange={(event) => changeField("nickname", event.target.value)}
          onBlur={() => validateField("nickname")}
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
        className="signup-button"
        type="submit"
        disabled={submitting || !canSubmit}
        aria-busy={submitting}
      >
        {submitting ? "회원가입 중..." : "회원가입"}
      </button>
    </form>
  );
}

export { SignupForm };
