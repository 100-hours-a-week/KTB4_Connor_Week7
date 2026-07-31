import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../features/auth/AuthProvider.jsx";

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}

export { ProtectedRoute };
