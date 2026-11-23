import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import EmployeeDashboard from "../components/dashboard/EmployeeDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    api.get("/dashboard")
      .then((res) => setData(res.data))
      .catch(() => toast.error("Unable to load dashboard"));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 min-[890px]:grid-cols-3 sm:gap-5 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return user.role === "Admin"
    ? <AdminDashboard user={user} data={data} reload={load} />
    : <EmployeeDashboard user={user} data={data} reload={load} />;
}
