import { Outlet } from "react-router";
import { LogoutButton } from "../../features/authenticate/LogoutButton.jsx";

function AppLayout() {
  return (
    <>
      <header className="site-header">
        <h1>회의실 예약</h1>
        <LogoutButton />
      </header>
      <Outlet />
    </>
  );
}

export { AppLayout };
