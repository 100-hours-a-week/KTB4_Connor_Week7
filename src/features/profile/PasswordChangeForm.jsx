import { useEffect, useState } from "react";
import {
  PASSWORD_CONFIRM_REQUIRED,
  PASSWORD_CURRENT_REQUIRED,
  PASSWORD_MISMATCH,
  PASSWORD_POLICY,
  PASSWORD_REQUIRED,
  PASSWORD_UPDATE_FAILURE,
} from "../../shared/constants/messages.js";
import { Toast } from "../../shared/ui/Toast.jsx";
import { isValidPassword } from "../../shared/lib/validation.js";

function validatePasswordChange(values) {
  const errors = {};

  if (!values.currentPassword) {
    errors.currentPassword = PASSWORD_CURRENT_REQUIRED;
  }
  if (!values.newPassword) {
    errors.newPassword = PASSWORD_REQUIRED;
  } else if (!isValidPassword(values.newPassword)) {
    errors.newPassword = PASSWORD_POLICY;
  }
  if (!values.passwordConfirm) {
    errors.passwordConfirm = PASSWORD_CONFIRM_REQUIRED;
  } else if (values.passwordConfirm !== values.newPassword) {
    errors.passwordConfirm = PASSWORD_MISMATCH;
  }

  return errors;
}

function PasswordChangeForm({ changePassword, onUnauthorized }) {
  const [values, setValues] = useState({
    currentPassword: "",
    newPassword: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);
  const validationErrors = validatePasswordChange(values);
  const canSubmit = Object.keys(validationErrors).length === 0;

  useEffect(() => {
    if (!updated) return undefined;
    const timer = setTimeout(() => setUpdated(false), 1800);
    return () => clearTimeout(timer);
  }, [updated]);

  function changeField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "", form: "" }));
    setUpdated(false);
  }

  function validateField(name) {
    setErrors((current) => ({
      ...current,
      [name]: validatePasswordChange(values)[name] || "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setErrors(validationErrors);
    if (!canSubmit) return;

    setSubmitting(true);
    setUpdated(false);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setValues({
        currentPassword: "",
        newPassword: "",
        passwordConfirm: "",
      });
      setErrors({});
      setUpdated(true);
    } catch (error) {
      if (onUnauthorized(error)) return;
      setErrors({ form: error.message || PASSWORD_UPDATE_FAILURE });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form
        className="password-edit-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="field">
          <label htmlFor="current-password">현재 비밀번호</label>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="현재 비밀번호를 입력하세요"
            aria-describedby="current-password-helper password-form-helper"
            aria-invalid={Boolean(errors.currentPassword)}
            value={values.currentPassword}
            onChange={(event) =>
              changeField("currentPassword", event.target.value)
            }
            onBlur={() => validateField("currentPassword")}
          />
          <p
            id="current-password-helper"
            className="helper-text"
            aria-live="polite"
          >
            {errors.currentPassword || ""}
          </p>
        </div>

        <div className="field">
          <label htmlFor="new-password">새 비밀번호</label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="새 비밀번호를 입력하세요"
            aria-describedby="new-password-helper password-form-helper"
            aria-invalid={Boolean(errors.newPassword)}
            value={values.newPassword}
            onChange={(event) => changeField("newPassword", event.target.value)}
            onBlur={() => validateField("newPassword")}
          />
          <p
            id="new-password-helper"
            className="helper-text"
            aria-live="polite"
          >
            {errors.newPassword || ""}
          </p>
        </div>

        <div className="field">
          <label htmlFor="password-confirm">새 비밀번호 확인</label>
          <input
            id="password-confirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            placeholder="새 비밀번호를 한번 더 입력하세요"
            aria-describedby="password-confirm-helper password-form-helper"
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

        <p
          id="password-form-helper"
          className="helper-text form-helper"
          aria-live="polite"
        >
          {errors.form || ""}
        </p>
        <button
          className="password-submit"
          type="submit"
          disabled={submitting || !canSubmit}
          aria-busy={submitting}
        >
          {submitting ? "수정 중..." : "수정하기"}
        </button>
      </form>

      <Toast open={updated} message="수정완료" />
    </>
  );
}

export { PasswordChangeForm };
