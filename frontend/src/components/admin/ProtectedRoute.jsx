import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen grid place-items-center" data-testid="admin-auth-loading">
        <div className="h-8 w-8 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    );
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
};
