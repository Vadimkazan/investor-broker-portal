import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import PropertyTypeSelect from '@/components/ui/property-type-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import type { PropertyObject, InvestmentStrategy } from '@/types/investment';

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<PropertyObject>;
  onFormDataChange: (field: string, value: unknown) => void;
  onToggleStrategy: (strategy: InvestmentStrategy) => void;
  onSubmit: () => void;
  isEdit?: boolean;
}

const PropertyFormDialog = ({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onToggleStrategy,
  onSubmit,
  isEdit = false,
}: PropertyFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать объект' : 'Добавить объект недвижимости'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Обновите информацию об объекте' : 'Заполните данные для создания нового объекта'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon name="Building2" className="text-primary" />
                <h3 className="text-lg font-semibold">Основная информация</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Название объекта *</Label>
                  <Input
                    id="title"
                    placeholder="Например: Квартира в центре"
                    value={formData.title || ''}
                    onChange={(e) => onFormDataChange('title', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType">Тип недвижимости *</Label>
                  <PropertyTypeSelect
                    value={formData.propertyType || 'apartments'}
                    onValueChange={(value) => onFormDataChange('propertyType', value)}
                    placeholder="Выберите тип"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Подробное описание объекта..."
                  value={formData.description || ''}
                  onChange={(e) => onFormDataChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon name="MapPin" className="text-primary" />
                <h3 className="text-lg font-semibold">Местоположение</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Город *</Label>
                  <Input
                    id="city"
                    placeholder="Москва"
                    value={formData.location?.city || ''}
                    onChange={(e) => onFormDataChange('location.city', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">Район</Label>
                  <Input
                    id="district"
                    placeholder="Центральный"
                    value={formData.location?.district || ''}
                    onChange={(e) => onFormDataChange('location.district', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Адрес</Label>
                  <Input
                    id="address"
                    placeholder="ул. Примерная, д. 1"
                    value={formData.location?.address || ''}
                    onChange={(e) => onFormDataChange('location.address', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metro">Метро</Label>
                  <Input
                    id="metro"
                    placeholder="Площадь Революции"
                    value={formData.location?.metro || ''}
                    onChange={(e) => onFormDataChange('location.metro', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon name="DollarSign" className="text-primary" />
                <h3 className="text-lg font-semibold">Цены и финансирование</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Общая стоимость *</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    placeholder="5000000"
                    value={formData.pricing?.totalPrice || ''}
                    onChange={(e) => onFormDataChange('pricing.totalPrice', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerMeter">Цена за м²</Label>
                  <Input
                    id="pricePerMeter"
                    type="number"
                    placeholder="150000"
                    value={formData.pricing?.pricePerMeter || ''}
                    onChange={(e) => onFormDataChange('pricing.pricePerMeter', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minInvestment">Мин. инвестиция *</Label>
                  <Input
                    id="minInvestment"
                    type="number"
                    placeholder="500000"
                    value={formData.pricing?.minInvestment || ''}
                    onChange={(e) => onFormDataChange('pricing.minInvestment', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financingMethod">Способ оплаты</Label>
                  <Select
                    value={formData.financing?.method || 'cash'}
                    onValueChange={(value) => onFormDataChange('financing.method', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите способ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Наличные</SelectItem>
                      <SelectItem value="mortgage">Ипотека</SelectItem>
                      <SelectItem value="installment">Рассрочка</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon name="TrendingUp" className="text-primary" />
                <h3 className="text-lg font-semibold">Инвестиционные параметры</h3>
              </div>

              <div className="space-y-3">
                <Label>Инвестиционная стратегия</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 'rental' as const, label: 'Сдача в аренду' },
                    { value: 'resale' as const, label: 'Перепродажа' },
                    { value: 'development' as const, label: 'Развитие' },
                  ].map((strategy) => (
                    <div key={strategy.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={strategy.value}
                        checked={formData.investment?.strategy?.includes(strategy.value) || false}
                        onCheckedChange={() => onToggleStrategy(strategy.value)}
                      />
                      <label
                        htmlFor={strategy.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {strategy.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedReturn">Ожидаемая доходность (%)</Label>
                  <Input
                    id="expectedReturn"
                    type="number"
                    placeholder="15"
                    value={formData.investment?.expectedReturn || ''}
                    onChange={(e) => onFormDataChange('investment.expectedReturn', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term">Срок (месяцы)</Label>
                  <Input
                    id="term"
                    type="number"
                    placeholder="36"
                    value={formData.investment?.term || ''}
                    onChange={(e) => onFormDataChange('investment.term', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskLevel">Уровень риска</Label>
                  <Select
                    value={formData.investment?.riskLevel || 'medium'}
                    onValueChange={(value) => onFormDataChange('investment.riskLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите риск" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetInvestment">Целевая сумма инвестиций</Label>
                  <Input
                    id="targetInvestment"
                    type="number"
                    placeholder="5000000"
                    value={formData.investment?.targetInvestment || ''}
                    onChange={(e) => onFormDataChange('investment.targetInvestment', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentInvestment">Текущие инвестиции</Label>
                  <Input
                    id="currentInvestment"
                    type="number"
                    placeholder="0"
                    value={formData.investment?.currentInvestment || ''}
                    onChange={(e) => onFormDataChange('investment.currentInvestment', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon name="Home" className="text-primary" />
                <h3 className="text-lg font-semibold">Характеристики объекта</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Площадь (м²) *</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="75"
                    value={formData.details?.area || ''}
                    onChange={(e) => onFormDataChange('details.area', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rooms">Комнат</Label>
                  <Input
                    id="rooms"
                    type="number"
                    placeholder="2"
                    value={formData.details?.rooms || ''}
                    onChange={(e) => onFormDataChange('details.rooms', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor">Этаж</Label>
                  <Input
                    id="floor"
                    type="number"
                    placeholder="5"
                    value={formData.details?.floor || ''}
                    onChange={(e) => onFormDataChange('details.floor', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalFloors">Всего этажей</Label>
                  <Input
                    id="totalFloors"
                    type="number"
                    placeholder="15"
                    value={formData.details?.totalFloors || ''}
                    onChange={(e) => onFormDataChange('details.totalFloors', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buildYear">Год постройки</Label>
                  <Input
                    id="buildYear"
                    type="number"
                    placeholder="2023"
                    value={formData.details?.buildYear || ''}
                    onChange={(e) => onFormDataChange('details.buildYear', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Состояние</Label>
                  <Input
                    id="condition"
                    placeholder="Отличное"
                    value={formData.details?.condition || ''}
                    onChange={(e) => onFormDataChange('details.condition', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parking"
                  checked={formData.details?.parking || false}
                  onCheckedChange={(checked) => onFormDataChange('details.parking', checked)}
                />
                <label htmlFor="parking" className="text-sm font-medium">
                  Парковка
                </label>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon name="Calculator" className="text-primary" />
                <h3 className="text-lg font-semibold">Арендные параметры</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome">Месячный доход (₽)</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    placeholder="80000"
                    value={formData.rental?.monthlyIncome || ''}
                    onChange={(e) => onFormDataChange('rental.monthlyIncome', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupancyRate">Заполняемость (%)</Label>
                  <Input
                    id="occupancyRate"
                    type="number"
                    placeholder="95"
                    value={formData.rental?.occupancyRate || ''}
                    onChange={(e) => onFormDataChange('rental.occupancyRate', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rentalYield">Доходность (%)</Label>
                  <Input
                    id="rentalYield"
                    type="number"
                    placeholder="6.5"
                    value={formData.rental?.rentalYield || ''}
                    onChange={(e) => onFormDataChange('rental.rentalYield', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon name="LineChart" className="text-primary" />
                <h3 className="text-lg font-semibold">Параметры перепродажи</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedPrice">Ожидаемая цена (₽)</Label>
                  <Input
                    id="expectedPrice"
                    type="number"
                    placeholder="6000000"
                    value={formData.resale?.expectedPrice || ''}
                    onChange={(e) => onFormDataChange('resale.expectedPrice', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedProfit">Ожидаемая прибыль (₽)</Label>
                  <Input
                    id="expectedProfit"
                    type="number"
                    placeholder="1000000"
                    value={formData.resale?.expectedProfit || ''}
                    onChange={(e) => onFormDataChange('resale.expectedProfit', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketGrowth">Рост рынка (%)</Label>
                  <Input
                    id="marketGrowth"
                    type="number"
                    placeholder="5.5"
                    value={formData.resale?.marketGrowth || ''}
                    onChange={(e) => onFormDataChange('resale.marketGrowth', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSubmit}>
            {isEdit ? 'Сохранить изменения' : 'Добавить объект'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyFormDialog;