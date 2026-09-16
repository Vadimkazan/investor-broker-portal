import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MyProperty, formatMoney } from '@/types/my-property';

interface PortfolioGrowthChartProps {
  items: MyProperty[];
}

interface Point {
  label: string;
  invested: number;
  value: number;
}

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const monthLabel = (index: number) => {
  const year = Math.floor(index / 12);
  const month = index % 12;
  return `${MONTHS_SHORT[month]} ${String(year).slice(2)}`;
};

const buildSeries = (items: MyProperty[]): Point[] => {
  const dated = items.filter((i) => i.purchaseDate && i.purchasePrice > 0);
  if (dated.length === 0) return [];

  const starts = dated.map((i) => monthKey(new Date(i.purchaseDate as string)));
  const first = Math.min(...starts);
  const now = monthKey(new Date());
  const last = Math.max(now, first);

  const totalMonths = last - first;
  const step = totalMonths > 36 ? Math.ceil(totalMonths / 24) : 1;

  const points: Point[] = [];

  for (let m = first; m <= last; m += step) {
    let invested = 0;
    let value = 0;

    dated.forEach((item) => {
      const start = monthKey(new Date(item.purchaseDate as string));
      if (start > m) return;

      invested += item.purchasePrice;

      const target = item.currentValue > 0 ? item.currentValue : item.purchasePrice;
      const span = Math.max(now - start, 1);
      const passed = Math.min(m - start, span);
      value += item.purchasePrice + (target - item.purchasePrice) * (passed / span);
    });

    points.push({
      label: monthLabel(m),
      invested: Math.round(invested),
      value: Math.round(value),
    });
  }

  if (points.length > 0 && points[points.length - 1].label !== monthLabel(last)) {
    const m = last;
    let invested = 0;
    let value = 0;
    dated.forEach((item) => {
      const start = monthKey(new Date(item.purchaseDate as string));
      if (start > m) return;
      invested += item.purchasePrice;
      value += item.currentValue > 0 ? item.currentValue : item.purchasePrice;
    });
    points.push({ label: monthLabel(m), invested: Math.round(invested), value: Math.round(value) });
  }

  return points;
};

const PortfolioGrowthChart = ({ items }: PortfolioGrowthChartProps) => {
  const data = useMemo(() => buildSeries(items), [items]);

  const withoutDate = items.filter((i) => !i.purchaseDate).length;

  if (data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon name="TrendingUp" size={18} />
            Динамика капитализации
          </CardTitle>
          <CardDescription>
            Укажите дату покупки и текущую оценку хотя бы у одного объекта — и здесь появится график роста
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const last = data[data.length - 1];
  const growth = last.value - last.invested;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon name="TrendingUp" size={18} />
          Динамика капитализации
        </CardTitle>
        <CardDescription>
          Как росла стоимость вашей недвижимости по месяцам
          {withoutDate > 0 && ` · ${withoutDate} объект(ов) без даты покупки не учтены`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
                axisLine={false}
                width={70}
                tickFormatter={(v: number) =>
                  v >= 1000000 ? `${(v / 1000000).toFixed(1)} млн` : `${Math.round(v / 1000)} тыс`
                }
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatMoney(value), name]}
                labelStyle={{ fontWeight: 600 }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--background))',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="value"
                name="Стоимость сейчас"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#valueFill)"
              />
              <Area
                type="monotone"
                dataKey="invested"
                name="Вложено"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t text-sm">
          <span>
            <span className="text-muted-foreground">Вложено: </span>
            <strong>{formatMoney(last.invested)}</strong>
          </span>
          <span>
            <span className="text-muted-foreground">Сейчас: </span>
            <strong>{formatMoney(last.value)}</strong>
          </span>
          <span className={growth >= 0 ? 'text-emerald-600' : 'text-red-600'}>
            <span className="text-muted-foreground">Прирост: </span>
            <strong>
              {growth >= 0 ? '+' : ''}
              {formatMoney(growth)}
            </strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioGrowthChart;
