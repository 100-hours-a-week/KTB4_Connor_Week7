import { useEffect } from "react";
import { useLocation } from "react-router";

function RouteFocus() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.querySelector("main h1, main h2")?.focus();
  }, [pathname]);

  return null;
}

export { RouteFocus };
