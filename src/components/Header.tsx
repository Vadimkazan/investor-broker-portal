import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: { name: string; email: string; role: 'investor' | 'broker' | 'admin' | 'manager' } | null;
  onAuthClick: () => void;
  onLogout: () => void;
  onRoleSwitch: () => void;
}

const Header = ({ activeTab, onTabChange, user, onAuthClick, onLogout, onRoleSwitch }: HeaderProps) => {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { syncing } = useAuth();

  useEffect(() => {
    const updateFavorites = () => {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavoritesCount(favorites.length);
    };

    updateFavorites();
    const interval = setInterval(updateFavorites, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('home')}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Icon name="TrendingUp" className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">InvestPro</h1>
              <p className="text-xs text-muted-foreground">Платформа инвестиций в недвижимость
</p>
            </div>
          </div>
          <nav className="flex gap-1 items-center overflow-x-auto scrollbar-hide">
            <Button
              variant={activeTab === 'home' ? 'default' : 'ghost'}
              onClick={() => onTabChange('home')}
              className="gap-2 flex-shrink-0"
            >
              <Icon name="Home" size={18} />
              <span className="hidden sm:inline">Главная</span>
            </Button>
            <Button
              variant={activeTab === 'objects' ? 'default' : 'ghost'}
              onClick={() => onTabChange('objects')}
              className="gap-2 flex-shrink-0"
            >
              <Icon name="Building2" size={18} />
              <span className="hidden sm:inline">Объекты</span>
            </Button>
            <Button
              variant={activeTab === 'calculator' ? 'default' : 'ghost'}
              onClick={() => onTabChange('calculator')}
              className="gap-2 flex-shrink-0"
            >
              <Icon name="Calculator" size={18} />
              <span className="hidden sm:inline">Калькулятор</span>
            </Button>
            {user && (
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => onTabChange('dashboard')}
                className="gap-2 flex-shrink-0"
              >
                <Icon name="LayoutDashboard" size={18} />
                <span className="hidden sm:inline">Кабинет</span>
              </Button>
            )}
            {favoritesCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="relative flex-shrink-0"
                onClick={() => onTabChange('objects')}
              >
                <Icon name="Heart" size={20} />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {favoritesCount}
                </Badge>
              </Button>
            )}
          </nav>
          {user ? (
            <div className="flex items-center gap-3">
              {syncing && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="RefreshCw" size={14} className="animate-spin" />
                  <span className="hidden sm:inline">Синхронизация...</span>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <div className="text-left">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.role === 'admin' ? 'Администратор' : user.role === 'manager' ? 'Менеджер' : user.role === 'broker' ? 'Брокер' : 'Инвестор'}
                      </p>
                    </div>
                    <Icon name="ChevronDown" size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(user.role === 'admin' || user.role === 'manager') && (
                    <>
                      <DropdownMenuItem onClick={() => window.location.href = '/admin/dashboard'} className="gap-2">
                        <Icon name="Shield" size={16} />
                        <div>
                          <p className="font-medium">Админ-панель</p>
                          <p className="text-xs text-muted-foreground">Управление платформой</p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {(user.role === 'investor' || user.role === 'broker') && (
                    <>
                      <DropdownMenuItem onClick={onRoleSwitch} className="gap-2">
                        <Icon name="RefreshCw" size={16} />
                        <div>
                          <p className="font-medium">
                            {user.role === 'broker' ? 'Режим инвестора' : 'Режим брокера'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.role === 'broker' ? 'Инвестировать в объекты' : 'Управлять объектами'}
                          </p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={onLogout} className="gap-2 text-destructive">
                    <Icon name="LogOut" size={16} />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button onClick={onAuthClick} className="gap-2">
              <Icon name="User" size={18} />
              Войти
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;