import { Navigate, Route, Routes } from "react-router";
import { useAuth } from "../providers/AuthProvider.jsx";
import { ProtectedRoute } from "./ProtectedRoute.jsx";

function RoutePlaceholder({ title }) {
  return (
    <main>
      <h1 tabIndex={-1}>{title}</h1>
    </main>
  );
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/rooms" : "/login"} replace />;
}

function LoginRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <Navigate to="/rooms" replace />
  ) : (
    <RoutePlaceholder title="로그인" />
  );
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<RoutePlaceholder title="회원가입" />} />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/profile"
          element={<RoutePlaceholder title="회원정보 수정" />}
        />
        <Route
          path="/profile/password"
          element={<RoutePlaceholder title="비밀번호 수정" />}
        />
        <Route path="/rooms" element={<RoutePlaceholder title="회의실" />} />
        <Route
          path="/rooms/:roomId"
          element={<RoutePlaceholder title="회의실 상세" />}
        />
        <Route
          path="/booking/:roomId/date-time"
          element={<RoutePlaceholder title="날짜와 시간" />}
        />
        <Route
          path="/booking/information"
          element={<RoutePlaceholder title="예약 정보" />}
        />
        <Route
          path="/booking/review"
          element={<RoutePlaceholder title="예약 확인" />}
        />
        <Route
          path="/booking/confirmed/:reservationId"
          element={<RoutePlaceholder title="예약 완료" />}
        />
        <Route
          path="/reservations"
          element={<RoutePlaceholder title="내 예약" />}
        />
        <Route
          path="/reservations/:reservationId"
          element={<RoutePlaceholder title="예약 상세" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export { AppRouter };
