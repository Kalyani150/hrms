import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Login / register / password-reset pages: signed-in users go straight to the dashboard
export default function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
