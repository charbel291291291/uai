import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard for admin-only pages.
 * Uses useAdmin() which fetches role independently — avoids the AuthContext
 * profile timing gap where loading=false but profile is not yet fetched.
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
