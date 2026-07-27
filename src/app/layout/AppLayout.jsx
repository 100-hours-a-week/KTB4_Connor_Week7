import { Link, Outlet } from "react-router";
import { LogoutButton } from "../../features/authenticate/LogoutButton.jsx";
import { UserAvatar } from "../../entities/user/UserAvatar.jsx";
import { useAuth } from "../../features/authenticate/AuthContext.jsx";

function AppLayout() {
  const { user } = useAuth();

  return (
    <>
      <header className="site-header">
        <h1>회의실 예약</h1>
        <div className="header-profile">
          <Link
            className="header-avatar"
            to="/profile"
            aria-label="회원정보 수정"
          >
            <UserAvatar
              imageUrl={user.profileImage}
              nickname={user.nickname}
            />
          </Link>
        </div>
        <LogoutButton />
      </header>
      <Outlet />
    </>
  );
}

export { AppLayout };
