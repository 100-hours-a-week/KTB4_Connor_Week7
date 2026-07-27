import { Navigate, Outlet, Route, Routes } from "react-router";
import { AppLayout } from "../layout/AppLayout.jsx";
import { useAuth } from "../providers/AuthProvider.jsx";
import { BookingDraftProvider } from "../../features/book-room/model/BookingDraftProvider.jsx";
import { LoginPage } from "../../pages/login/LoginPage.jsx";
import { SignupPage } from "../../pages/signup/SignupPage.jsx";
import { ProfileEditPage } from "../../pages/profile-edit/ProfileEditPage.jsx";
import { PasswordEditPage } from "../../pages/password-edit/PasswordEditPage.jsx";
import { BookingDateTimePage } from "../../pages/booking-date-time/BookingDateTimePage.jsx";
import { BookingConfirmedPage } from "../../pages/booking-confirmed/BookingConfirmedPage.jsx";
import { BookingInformationPage } from "../../pages/booking-information/BookingInformationPage.jsx";
import { BookingReviewPage } from "../../pages/booking-review/BookingReviewPage.jsx";
import { RoomDetailPage } from "../../pages/room-detail/RoomDetailPage.jsx";
import { RoomsPage } from "../../pages/rooms/RoomsPage.jsx";
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

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/profile" element={<ProfileEditPage />} />
          <Route
            path="/profile/password"
            element={<PasswordEditPage />}
          />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route
            path="/rooms/:roomId"
            element={<RoomDetailPage />}
          />
          <Route
            element={
              <BookingDraftProvider>
                <Outlet />
              </BookingDraftProvider>
            }
          >
            <Route
              path="/booking/:roomId/date-time"
              element={<BookingDateTimePage />}
            />
            <Route
              path="/booking/information"
              element={<BookingInformationPage />}
            />
            <Route
              path="/booking/review"
              element={<BookingReviewPage />}
            />
            <Route
              path="/booking/confirmed/:reservationId"
              element={<BookingConfirmedPage />}
            />
          </Route>
          <Route
            path="/reservations"
            element={<RoutePlaceholder title="내 예약" />}
          />
          <Route
            path="/reservations/:reservationId"
            element={<RoutePlaceholder title="예약 상세" />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export { AppRouter };
