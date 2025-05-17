import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { userAPI } from '@/services/api'; // ✅ Import corrigé

interface RoleRouteProps {
  children: React.ReactNode;
  role: 'client' | 'employer';
}

const RoleRoute: React.FC<RoleRouteProps> = ({ children, role }) => {
  const location = useLocation();
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkRole = async () => {
      try {
        const response = await userAPI.getProfile(); // ✅ utiliser userAPI
        setUserRole(response.role);
      } catch (err) {
        setUserRole(null);
      }
    };

    checkRole();
  }, []);

  if (userRole === null) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  if (userRole !== role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
