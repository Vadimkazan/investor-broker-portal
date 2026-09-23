import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { MyProperty, MyPropertyInput, PROPERTY_KIND_LABELS } from '@/types/my-property';
import { formatPriceSigned } from '@/utils/formatPrice';

interface MyPropertyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: MyPropertyInput) => Promise<void>;
  property?: MyProperty | null;
}

const EMPTY: MyPropertyInput = {
  title: '',
  propertyType: 'flats',
  city: '',
  address: '',
  purchasePrice: '',
  purchaseDate: '',
  currentValue: '',
  monthlyIncome: '',
  imageUrl: '',
  notes: '',
};

const MyPropertyDialog = ({ open, onClose, onSave, property }: MyPropertyDialogProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState<MyPropertyInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      property
        ? {
            title: property.title,
            propertyType: property.propertyType,
            city: property.city,
            address: property.address,
            purchasePrice: property.purchasePrice ? String(property.purchasePrice) : '',
            purchaseDate: property.purchaseDate || '',
            currentValue: property.currentValue ? String(property.currentValue) : '',
            monthlyIncome: property.monthlyIncome ? String(property.monthlyIncome) : '',
            imageUrl: property.imageUrl || '',
            notes: property.notes || '',
          }
        : EMPTY
    );
  }, [open, property]);

  const set = <K extends keyof MyPropertyInput>(key: K, value: MyPropertyInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Нужен файл изображения', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Файл больше 5 МБ', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const { url } = await api.uploadFile(file);
      set('imageUrl', url);
    } catch {
      toast({ title: 'Не удалось загрузить фото', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Укажите название объекта', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const purchase = Number(form.purchasePrice) || 0;
  const current = Number(form.currentValue) || 0;
  const growth = current && purchase ? current - purchase : 0;
  const growthPct = purchase && current ? ((current - purchase) / purchase) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? 'Изменить объект' : 'Добавить свою недвижимость'}</DialogTitle>
          <DialogDescription>
            Эти данные видите только вы — они нужны для учёта капитализации и не публикуются в каталоге
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название *</Label>
            <Input
              placeholder="Например, квартира на Ленина"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Тип недвижимости</Label>
              <Select value={form.propertyType} onValueChange={(v) => set('propertyType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROPERTY_KIND_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Город</Label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Казань" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Адрес</Label>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="ул. Ленина, 10" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Цена покупки, ₽</Label>
              <Input
                type="number"
                value={form.purchasePrice}
                onChange={(e) => set('purchasePrice', e.target.value)}
                placeholder="5000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Дата покупки</Label>
              <Input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => set('purchaseDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Текущая оценка, ₽</Label>
              <Input
                type="number"
                value={form.currentValue}
                onChange={(e) => set('currentValue', e.target.value)}
                placeholder="6200000"
              />
            </div>
            <div className="space-y-2">
              <Label>Доход в месяц, ₽</Label>
              <Input
                type="number"
                value={form.monthlyIncome}
                onChange={(e) => set('monthlyIncome', e.target.value)}
                placeholder="38000"
              />
            </div>
          </div>

          {growth !== 0 && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                growth > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <span className={growth > 0 ? 'text-emerald-700' : 'text-red-700'}>
                {growth > 0 ? 'Рост' : 'Снижение'} стоимости:{' '}
                <strong>
                  {formatPriceSigned(growth)} ({growthPct > 0 ? '+' : ''}
                  {growthPct.toFixed(1)}%)
                </strong>
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Фото объекта</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) handleFile(file);
              }}
            />
            {form.imageUrl ? (
              <div className="rounded-lg border overflow-hidden">
                <img src={form.imageUrl} alt="" className="w-full max-h-48 object-cover" />
                <div className="flex gap-2 p-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => fileRef.current?.click()}>
                    Заменить
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => set('imageUrl', '')}>
                    Удалить
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer text-center transition-colors ${
                  dragOver ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50'
                } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
              >
                <Icon
                  name={uploading ? 'Loader2' : 'ImagePlus'}
                  size={24}
                  className={`text-muted-foreground ${uploading ? 'animate-spin' : ''}`}
                />
                <p className="text-sm">{uploading ? 'Загружаем...' : 'Перетащите фото или нажмите'}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Заметки</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Например: сдана в аренду до августа"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={saving || uploading}>
              {saving ? 'Сохраняем...' : property ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyPropertyDialog;
