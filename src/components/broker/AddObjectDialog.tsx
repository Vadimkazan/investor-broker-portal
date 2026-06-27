import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import PropertyTypeSelect from '@/components/ui/property-type-select';

interface NewObjectForm {
  title: string;
  location: string;
  type: string;
  price: string;
  expectedReturn: string;
  term: string;
  risk: string;
  description: string;
  financing: {
    cash: boolean;
    mortgage: { available: boolean; rate: string; downPayment: string };
    installment: { available: boolean; months: string; downPayment: string };
  };
}

interface AddObjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newObject: NewObjectForm;
  onNewObjectChange: (object: NewObjectForm) => void;
  onSubmit: () => void;
}

const AddObjectDialog = ({ open, onOpenChange, newObject, onNewObjectChange, onSubmit }: AddObjectDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Icon name="Plus" size={18} />
          Добавить объект
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый объект недвижимости</DialogTitle>
          <DialogDescription>
            Заполните информацию об инвестиционном объекте
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название объекта</Label>
            <Input
              id="title"
              placeholder="ЖК «Пример»"
              value={newObject.title}
              onChange={(e) => onNewObjectChange({ ...newObject, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Локация</Label>
            <Input
              id="location"
              placeholder="Москва, ЦАО"
              value={newObject.location}
              onChange={(e) => onNewObjectChange({ ...newObject, location: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Тип недвижимости</Label>
              <PropertyTypeSelect
                value={newObject.type}
                onValueChange={(v) => onNewObjectChange({ ...newObject, type: v })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk">Уровень риска</Label>
              <Select value={newObject.risk} onValueChange={(v) => onNewObjectChange({ ...newObject, risk: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Стоимость (₽)</Label>
              <Input
                id="price"
                type="number"
                placeholder="5000000"
                value={newObject.price}
                onChange={(e) => onNewObjectChange({ ...newObject, price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedReturn">Доходность (%)</Label>
              <Input
                id="expectedReturn"
                type="number"
                placeholder="15"
                value={newObject.expectedReturn}
                onChange={(e) => onNewObjectChange({ ...newObject, expectedReturn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Окупаемость (мес)</Label>
              <Input
                id="term"
                type="number"
                placeholder="24"
                value={newObject.term}
                onChange={(e) => onNewObjectChange({ ...newObject, term: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-3">
            <Label>Способы приобретения</Label>
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="cash" 
                  checked={newObject.financing.cash}
                  onCheckedChange={(checked) => 
                    onNewObjectChange({ ...newObject, financing: { ...newObject.financing, cash: !!checked } })
                  }
                />
                <Label htmlFor="cash" className="font-normal cursor-pointer">Полная оплата</Label>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="mortgage" 
                    checked={newObject.financing.mortgage.available}
                    onCheckedChange={(checked) => 
                      onNewObjectChange({ 
                        ...newObject, 
                        financing: { 
                          ...newObject.financing, 
                          mortgage: { ...newObject.financing.mortgage, available: !!checked } 
                        } 
                      })
                    }
                  />
                  <Label htmlFor="mortgage" className="font-normal cursor-pointer">Ипотека</Label>
                </div>
                {newObject.financing.mortgage.available && (
                  <div className="grid grid-cols-2 gap-2 ml-6">
                    <Input 
                      placeholder="Ставка %" 
                      type="number"
                      value={newObject.financing.mortgage.rate}
                      onChange={(e) => onNewObjectChange({
                        ...newObject,
                        financing: {
                          ...newObject.financing,
                          mortgage: { ...newObject.financing.mortgage, rate: e.target.value }
                        }
                      })}
                    />
                    <Input 
                      placeholder="Первый взнос %" 
                      type="number"
                      value={newObject.financing.mortgage.downPayment}
                      onChange={(e) => onNewObjectChange({
                        ...newObject,
                        financing: {
                          ...newObject.financing,
                          mortgage: { ...newObject.financing.mortgage, downPayment: e.target.value }
                        }
                      })}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="installment" 
                    checked={newObject.financing.installment.available}
                    onCheckedChange={(checked) => 
                      onNewObjectChange({ 
                        ...newObject, 
                        financing: { 
                          ...newObject.financing, 
                          installment: { ...newObject.financing.installment, available: !!checked } 
                        } 
                      })
                    }
                  />
                  <Label htmlFor="installment" className="font-normal cursor-pointer">Рассрочка</Label>
                </div>
                {newObject.financing.installment.available && (
                  <div className="grid grid-cols-2 gap-2 ml-6">
                    <Input 
                      placeholder="Срок (мес)" 
                      type="number"
                      value={newObject.financing.installment.months}
                      onChange={(e) => onNewObjectChange({
                        ...newObject,
                        financing: {
                          ...newObject.financing,
                          installment: { ...newObject.financing.installment, months: e.target.value }
                        }
                      })}
                    />
                    <Input 
                      placeholder="Первый взнос %" 
                      type="number"
                      value={newObject.financing.installment.downPayment}
                      onChange={(e) => onNewObjectChange({
                        ...newObject,
                        financing: {
                          ...newObject.financing,
                          installment: { ...newObject.financing.installment, downPayment: e.target.value }
                        }
                      })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Опишите преимущества объекта..."
              value={newObject.description}
              onChange={(e) => onNewObjectChange({ ...newObject, description: e.target.value })}
              rows={4}
            />
          </div>
          <Button onClick={onSubmit} className="w-full">
            Добавить объект
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddObjectDialog;