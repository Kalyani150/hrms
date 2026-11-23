
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

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email, password
    });
    setUser(data.user);
  };

  const register = async (name, email, password) => {
    // The account must be approved by an admin first, so the user is not signed in here
    const { data } = await api.post("/auth/register", {
      name, email, password
    });
    return data.message;
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
