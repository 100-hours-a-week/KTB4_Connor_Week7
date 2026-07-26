import { useEffect, useState } from "react";
import {
  AUTH_LOGIN_FAILURE,
  LOGIN_EMAIL_FORMAT,
  LOGIN_EMAIL_REQUIRED,
  LOGIN_PASSWORD_REQUIRED,
} from "../../constants/messages.js";
import { isValidEmail } from "../../utils/validation.js";

function validateLogin(values) {
  const errors = {};
  const email = values.email.trim();

  if (!email) errors.email = LOGIN_EMAIL_REQUIRED;
  else if (!isValidEmail(email)) errors.email = LOGIN_EMAIL_FORMAT;
  if (!values.password) errors.password = LOGIN_PASSWORD_REQUIRED;

  return errors;
}

function LoginForm({ authenticate, onAuthenticated, initialFeedback = "" }) {
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ form: initialFeedback });
  const [submitting, setSubmitting] = useState(false);
  const canSubmit =
    isValidEmail(values.email.trim()) && Boolean(values.password);

  useEffect(() => {
    if (initialFeedback) {
      setErrors((current) => ({ ...current, form: initialFeedback }));
    }
  }, [initialFeedback]);

  function changeField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "", form: "" }));
  }

  function validateField(name) {
    const nextErrors = validateLogin(values);
    setErrors((current) => ({
      ...current,
      [name]: nextErrors[name] || "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const user = await authenticate({
        email: values.email.trim(),
        password: values.password,
      });
      onAuthenticated(user);
    } catch (error) {
      setErrors({ form: error.message || AUTH_LOGIN_FAILURE });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="login-form" noValidate onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">이메일</label>
        <input
          id="email"
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
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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

      <p
        id="form-helper"
        className="helper-text form-helper"
        aria-live="polite"
      >
        {errors.form || ""}
      </p>

      <button
        className="login-button"
        type="submit"
        disabled={submitting || !canSubmit}
        aria-busy={submitting}
      >
        {submitting ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}

export { LoginForm };
