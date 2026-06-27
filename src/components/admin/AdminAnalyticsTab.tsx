import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS } from './adminConstants';

interface ChartEntry {
  name: string;
  value: number;
}

interface AdminStats {
  totalObjects: number;
  sold: number;
  totalValue: number;
  brokers: number;
  reserved: number;
}

interface AdminAnalyticsTabProps {
  cityData: ChartEntry[];
  typeData: ChartEntry[];
  statusData: ChartEntry[];
  stats: AdminStats;
}

const AdminAnalyticsTab = ({ cityData, typeData, statusData, stats }: AdminAnalyticsTabProps) => {
  const metrics = [
    {
      label: 'Конверсия в продажи',
      value: stats.totalObjects > 0 ? `${((stats.sold / stats.totalObjects) * 100).toFixed(1)}%` : '0%',
    },
    {
      label: 'Средняя цена объекта',
      value: stats.totalObjects > 0 ? `${(stats.totalValue / stats.totalObjects / 1_000_000).toFixed(1)} млн ₽` : '—',
    },
    {
      label: 'Объектов на брокера',
      value: stats.brokers > 0 ? (stats.totalObjects / stats.brokers).toFixed(1) : '—',
    },
    {
      label: 'Забронировано',
      value: `${stats.reserved} из ${stats.totalObjects}`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Объекты по городам</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" name="Объектов" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Типы недвижимости</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Статус объектов</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ключевые метрики</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-2">
          {metrics.map(m => (
            <div key={m.label} className="flex justify-between items-center border-b pb-3 last:border-0">
              <p className="text-sm text-muted-foreground">{m.label}</p>
              <p className="font-semibold">{m.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsTab;
