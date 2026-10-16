import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CalculatorPageProps {
  investmentAmount: number;
  investmentPeriod: number;
  expectedReturn: number;
  onAmountChange: (value: number) => void;
  onPeriodChange: (value: number) => void;
  onReturnChange: (value: number) => void;
}

const CalculatorPage = ({
  investmentAmount,
  investmentPeriod,
  expectedReturn,
  onAmountChange,
  onPeriodChange,
  onReturnChange
}: CalculatorPageProps) => {
  const calculateROI = () => {
    const monthlyRate = expectedReturn / 100 / 12;
    const totalAmount = investmentAmount * Math.pow(1 + monthlyRate, investmentPeriod);
    const profit = totalAmount - investmentAmount;
    return {
      totalAmount: Math.round(totalAmount),
      profit: Math.round(profit),
      roi: ((profit / investmentAmount) * 100).toFixed(2)
    };
  };

  const roi = calculateROI();

  const projectionData = Array.from({ length: investmentPeriod }, (_, i) => {
    const month = i + 1;
    const monthlyRate = expectedReturn / 100 / 12;
    const amount = investmentAmount * Math.pow(1 + monthlyRate, month);
    return {
      month: `М${month}`,
      value: Math.round(amount)
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">Калькулятор доходности</h2>
        <p className="text-muted-foreground">Рассчитайте потенциальную прибыль</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Параметры инвестиции</CardTitle>
            <CardDescription>Укажите условия для расчета</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Сумма инвестиции</label>
                <span className="text-sm font-semibold">₽{investmentAmount.toLocaleString()}</span>
              </div>
              <Slider
                value={[investmentAmount]}
                onValueChange={(value) => onAmountChange(value[0])}
                min={100000}
                max={10000000}
                step={100000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₽100K</span>
                <span>₽10M</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Период (лет)</label>
                <span className="text-sm font-semibold">{investmentPeriod / 12}</span>
              </div>
              <Slider
                value={[investmentPeriod]}
                onValueChange={(value) => onPeriodChange(value[0])}
                min={6}
                max={600}
                step={6}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5 лет</span>
                <span>50 лет</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Ожидаемая доходность (%)</label>
                <span className="text-sm font-semibold">{expectedReturn}%</span>
              </div>
              <Slider
                value={[expectedReturn]}
                onValueChange={(value) => onReturnChange(value[0])}
                min={5}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5%</span>
                <span>50%</span>
              </div>
            </div>

            <div className="pt-4 space-y-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Итоговая сумма</span>
                <span className="text-2xl font-bold text-primary">₽{roi.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Чистая прибыль</span>
                <span className="text-xl font-bold text-green-600">+₽{roi.profit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ROI</span>
                <span className="text-lg font-semibold">{roi.roi}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Прогноз роста капитала</CardTitle>
            <CardDescription>Динамика стоимости инвестиции</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip formatter={(value: number) => `₽${value.toLocaleString()}`} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0EA5E9"
                  strokeWidth={3}
                  dot={{ fill: '#0EA5E9', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Icon name="Info" size={18} className="text-primary" />
                Ключевые метрики
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Срок окупаемости</p>
                  <p className="font-semibold">
                    {(() => {
                      const months = Math.round((investmentAmount / (investmentAmount * expectedReturn / 100)) * 12);
                      const years = Math.floor(months / 12);
                      const rest = months % 12;
                      if (years === 0) return `${months} мес.`;
                      return rest === 0 ? `${years} лет` : `${years} лет ${rest} мес.`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Месячная прибыль</p>
                  <p className="font-semibold">₽{Math.round(roi.profit / investmentPeriod).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Годовая доходность</p>
                  <p className="font-semibold text-green-600">{expectedReturn}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Риск</p>
                  <p className="font-semibold">Средний</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalculatorPage;