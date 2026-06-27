import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUploader from '@/components/ui/image-uploader';
import PropertyTypeSelect from '@/components/ui/property-type-select';
import { useCreateObject } from '@/hooks/useObjects';
import { PropertyType, ObjectStatus } from '@/types/investment-object';

interface AddNewObjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  brokerId: number;
}

const EMPTY_FORM = {
  title: '',
  type: 'apartments' as PropertyType,
  city: '',
  address: '',
  price: '',
  yield: '',
  paybackPeriod: '',
  area: '',
  status: 'available' as ObjectStatus,
  description: '',
  images: [] as string[]
};

const AddNewObjectDialog = ({ open, onOpenChange, onSuccess, brokerId }: AddNewObjectDialogProps) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const createObject = useCreateObject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createObject.mutateAsync({
      broker_id: brokerId,
      title: formData.title,
      property_type: formData.type,
      city: formData.city,
      address: formData.address,
      price: parseFloat(formData.price),
      yield_percent: parseFloat(formData.yield),
      payback_years: parseFloat(formData.paybackPeriod),
      area: parseFloat(formData.area),
      status: formData.status,
      images: formData.images,
      description: formData.description,
    });

    setFormData(EMPTY_FORM);
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить новый объект</DialogTitle>
          <DialogDescription>
            Заполните информацию об инвестиционном объекте
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название объекта *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Апартаменты в ЖК «Престиж»"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Тип недвижимости *</Label>
              <PropertyTypeSelect
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as PropertyType })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Город *</Label>
              <Select
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Москва">Москва</SelectItem>
                  <SelectItem value="Санкт-Петербург">Санкт-Петербург</SelectItem>
                  <SelectItem value="Сочи">Сочи</SelectItem>
                  <SelectItem value="Казань">Казань</SelectItem>
                  <SelectItem value="Екатеринбург">Екатеринбург</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адрес *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="ЦАО, ул. Тверская, 15"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="area">Площадь, м² *</Label>
              <Input
                id="area"
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="45"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Цена, ₽ *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="3200000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yield">Доходность, % годовых *</Label>
              <Input
                id="yield"
                type="number"
                step="0.1"
                value={formData.yield}
                onChange={(e) => setFormData({ ...formData, yield: e.target.value })}
                placeholder="12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paybackPeriod">Окупаемость, лет *</Label>
              <Input
                id="paybackPeriod"
                type="number"
                step="0.1"
                value={formData.paybackPeriod}
                onChange={(e) => setFormData({ ...formData, paybackPeriod: e.target.value })}
                placeholder="7"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select
              value={formData.status}
              onValueChange={(value: ObjectStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Свободен</SelectItem>
                <SelectItem value="reserved">Бронь</SelectItem>
                <SelectItem value="sold">Продано</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Подробное описание объекта..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Фотографии объекта</Label>
            <ImageUploader
              images={formData.images}
              onChange={(imgs) => setFormData({ ...formData, images: imgs })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createObject.isPending} className="flex-1">
              {createObject.isPending ? 'Сохранение...' : 'Добавить объект'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
          </div>

          {createObject.isError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {(createObject.error as Error)?.message || 'Ошибка при сохранении. Попробуйте снова.'}
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewObjectDialog;