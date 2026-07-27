import { createContext, useContext } from "react";

const AuthContext = createContext(null);

function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export { AuthContext, useAuth };
