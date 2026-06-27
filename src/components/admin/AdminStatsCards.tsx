import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface AdminStats {
  totalUsers: number;
  investors: number;
  brokers: number;
  totalObjects: number;
  available: number;
  reserved: number;
  sold: number;
  totalValue: number;
  avgYield: number;
}

interface AdminStatsCardsProps {
  stats: AdminStats;
}

const AdminStatsCards = ({ stats }: AdminStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Пользователи</p>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.investors} инв. · {stats.brokers} бр.</p>
            </div>
            <Icon name="Users" size={32} className="text-primary opacity-60" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Объекты</p>
              <p className="text-3xl font-bold">{stats.totalObjects}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats.available} свободно</p>
            </div>
            <Icon name="Building" size={32} className="text-primary opacity-60" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Общая стоимость</p>
              <p className="text-3xl font-bold">{(stats.totalValue / 1_000_000_000).toFixed(1)} млрд</p>
              <p className="text-xs text-muted-foreground mt-1">₽ портфель платформы</p>
            </div>
            <Icon name="Wallet" size={32} className="text-primary opacity-60" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ср. доходность</p>
              <p className="text-3xl font-bold">{stats.avgYield.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">по всем объектам</p>
            </div>
            <Icon name="TrendingUp" size={32} className="text-primary opacity-60" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatsCards;
