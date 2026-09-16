import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import MyPropertyDialog from '@/components/investor/MyPropertyDialog';
import {
  MyProperty,
  MyPropertyInput,
  MyPropertySummary,
  MY_PROPERTIES_URL,
  PROPERTY_KIND_LABELS,
  formatMoney,
} from '@/types/my-property';

interface MyPropertiesTabProps {
  userId: number;
}

const MyPropertiesTab = ({ userId }: MyPropertiesTabProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<MyProperty[]>([]);
  const [summary, setSummary] = useState<MyPropertySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MyProperty | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${MY_PROPERTIES_URL}?user_id=${userId}`);
      const data = await res.json();
      setItems(data.items || []);
      setSummary(data.summary || null);
    } catch {
      toast({ title: 'Не удалось загрузить список', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (userId) load();
  }, [userId, load]);

  const handleSave = async (form: MyPropertyInput) => {
    const payload = {
      ...form,
      purchasePrice: Number(form.purchasePrice) || 0,
      currentValue: Number(form.currentValue) || 0,
      monthlyIncome: Number(form.monthlyIncome) || 0,
      purchaseDate: form.purchaseDate || null,
    };
    const url = editing
      ? `${MY_PROPERTIES_URL}?user_id=${userId}&id=${editing.id}`
      : `${MY_PROPERTIES_URL}?user_id=${userId}`;

    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
      throw new Error('save failed');
    }

    toast({ title: editing ? 'Объект обновлён' : 'Объект добавлен' });
    setEditing(null);
    load();
  };

  const handleDelete = async (item: MyProperty) => {
    if (!confirm(`Удалить «${item.title}» из вашего учёта?`)) return;
    const res = await fetch(`${MY_PROPERTIES_URL}?user_id=${userId}&id=${item.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast({ title: 'Объект удалён' });
      load();
    } else {
      toast({ title: 'Не удалось удалить', variant: 'destructive' });
    }
  };

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (item: MyProperty) => {
    setEditing(item);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h3 className="text-xl font-bold">Моя недвижимость</h3>
          <p className="text-muted-foreground text-sm">
            Личный учёт капитализации — данные видите только вы
          </p>
        </div>
        <Button onClick={openAdd}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить объект
        </Button>
      </div>

      {summary && summary.count > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Вложено</p>
              <p className="text-xl font-bold">{formatMoney(summary.totalInvested)}</p>
              <p className="text-xs text-muted-foreground mt-1">{summary.count} объект(ов)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Сейчас стоит</p>
              <p className="text-xl font-bold">{formatMoney(summary.totalValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">текущая оценка</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Рост капитала</p>
              <p
                className={`text-xl font-bold ${
                  summary.growth >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {summary.growth >= 0 ? '+' : ''}
                {formatMoney(summary.growth)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.growthPercent >= 0 ? '+' : ''}
                {summary.growthPercent}% к покупке
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Доход в месяц</p>
              <p className="text-xl font-bold">{formatMoney(summary.monthlyIncome)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                доходность {summary.yieldPercent}% годовых
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Building" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Пока нет объектов</h3>
            <p className="text-muted-foreground mb-4">
              Добавьте свою недвижимость, чтобы следить за ростом её стоимости и доходом
            </p>
            <Button onClick={openAdd}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить объект
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => {
            const growth = item.currentValue && item.purchasePrice
              ? item.currentValue - item.purchasePrice
              : 0;
            const growthPct = item.purchasePrice && item.currentValue
              ? (growth / item.purchasePrice) * 100
              : 0;
            return (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="ImageOff" size={20} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold">{item.title}</h4>
                        <Badge variant="secondary">
                          {PROPERTY_KIND_LABELS[item.propertyType] || item.propertyType}
                        </Badge>
                      </div>

                      {(item.address || item.city) && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {[item.address, item.city].filter(Boolean).join(', ')}
                        </p>
                      )}

                      <div className="flex gap-4 text-sm flex-wrap">
                        <span>
                          <span className="text-muted-foreground">Куплено: </span>
                          {formatMoney(item.purchasePrice)}
                        </span>
                        {item.currentValue > 0 && (
                          <span>
                            <span className="text-muted-foreground">Сейчас: </span>
                            {formatMoney(item.currentValue)}
                          </span>
                        )}
                        {growth !== 0 && (
                          <span className={growth > 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                            {growth > 0 ? '+' : ''}
                            {growthPct.toFixed(1)}%
                          </span>
                        )}
                        {item.monthlyIncome > 0 && (
                          <span>
                            <span className="text-muted-foreground">В месяц: </span>
                            {formatMoney(item.monthlyIncome)}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">{item.notes}</p>
                      )}

                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                          <Icon name="Pencil" size={14} className="mr-1" />
                          Изменить
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(item)}>
                          <Icon name="Trash2" size={14} className="mr-1" />
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MyPropertyDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        property={editing}
      />
    </div>
  );
};

export default MyPropertiesTab;
