import { BrowserRouter } from "react-router";
import { AuthProvider } from "../features/auth/AuthProvider.jsx";
import { AppRouter } from "./router/AppRouter.jsx";
import { RouteErrorBoundary } from "./router/RouteErrorBoundary.jsx";
import { RouteFocus } from "./router/RouteFocus.jsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteErrorBoundary>
          <RouteFocus />
          <AppRouter />
        </RouteErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export { App };
