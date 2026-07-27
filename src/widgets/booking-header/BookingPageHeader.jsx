import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { UserAvatar } from "../../entities/user/UserAvatar.jsx";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";
import { LogoutButton } from "../../features/authenticate/LogoutButton.jsx";

function BrandLink({ to, label }) {
  return (
    <Link className="booking-brand-link" to={to} aria-label={label}>
      <img
        className="booking-brand-logo"
        src="/assets/icons/room-logo.png"
        alt=""
      />
    </Link>
  );
}

function BookingPublicHeader({ backTo = "" }) {
  return (
    <header className="booking-page-header booking-public-header">
      {backTo ? (
        <Link
          className="booking-header-back"
          to={backTo}
          aria-label="이전 페이지로 이동"
        >
          ‹
        </Link>
      ) : null}
      <BrandLink to="/" label="홈으로" />
    </header>
  );
}

function BookingPageHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function closeFromOutside(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }

    function closeFromEscape(event) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [open]);

  return (
    <header className="booking-page-header">
      <BrandLink to="/rooms" label="회의실 목록으로" />
      <div className="booking-profile-menu-container" ref={containerRef}>
        <button
          ref={buttonRef}
          className="booking-profile-button"
          type="button"
          aria-expanded={open}
          aria-controls="booking-profile-menu"
          aria-label={`사용자 메뉴 ${open ? "닫기" : "열기"}`}
          onClick={() => setOpen((current) => !current)}
        >
          <UserAvatar
            imageUrl={user.profileImage}
            nickname={user.nickname}
            imageClassName="booking-profile-image"
            fallbackClassName="booking-profile-fallback"
          />
        </button>
        {open ? (
          <nav
            id="booking-profile-menu"
            className="booking-profile-menu"
            aria-label="사용자 메뉴"
          >
            <Link to="/reservations" onClick={() => setOpen(false)}>
              내 예약
            </Link>
            <Link to="/profile" onClick={() => setOpen(false)}>
              마이페이지
            </Link>
            <LogoutButton />
          </nav>
        ) : null}
      </div>
    </header>
  );
}

export { BookingPageHeader, BookingPublicHeader };
