import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../api';

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
        const response = await api.get('/users/me/');
        setUserRole(response.data.role);
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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleRoute; 