
import {
  createContext, useContext, useEffect, useState
} from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, portal = "employee") => {
    const { data } = await api.post("/auth/login", {
      email, password, portal
    });
    setUser(data.user);
  };

  // Creates the account only; the user then signs in from the login page
  const register = async (name, email, password) => {
    await api.post("/auth/register", { name, email, password });
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, loading, login, register, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
