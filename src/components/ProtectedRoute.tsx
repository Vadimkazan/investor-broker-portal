import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasAnyRole } from '@/utils/roles';
import { UserRole } from '@/services/api';
import Icon from '@/components/ui/icon';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

const FullScreenLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3">
    <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
    <p className="text-sm text-muted-foreground">Загружаем ваш кабинет...</p>
  </div>
);

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  if (roles && roles.length > 0 && !hasAnyRole(user, roles)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Icon name="ShieldAlert" size={40} className="text-muted-foreground" />
        <div>
          <p className="text-lg font-semibold">Недостаточно прав</p>
          <p className="text-sm text-muted-foreground mt-1">
            У вашей учётной записи нет доступа к этому разделу
          </p>
        </div>
        <a href="/" className="text-sm text-primary hover:underline">
          Вернуться на главную
        </a>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
