import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

const EditObjectPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingObject, setLoadingObject] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    type: 'flats' as 'apartments' | 'flats' | 'commercial' | 'country',
    city: '',
    address: '',
    price: '',
    yield: '',
    paybackPeriod: '',
    area: '',
    description: '',
    images: [''],
    status: 'available' as 'available' | 'reserved' | 'sold'
  });

  useEffect(() => {
    loadObject();
  }, [id]);

  const loadObject = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/fc00dc4e-18bf-4893-bb9d-331e8abda973?resource=objects&id=${id}`);
      
      if (!response.ok) {
        throw new Error('Объект не найден');
      }

      const data = await response.json();
      
      if (!user || data.brokerId !== user.id) {
        alert('У вас нет прав для редактирования этого объекта');
        navigate('/objects');
        return;
      }

      setFormData({
        title: data.title,
        type: data.type,
        city: data.city,
        address: data.address,
        price: data.price.toString(),
        yield: data.yield.toString(),
        paybackPeriod: data.paybackPeriod.toString(),
        area: data.area.toString(),
        description: data.description,
        images: data.images.length > 0 ? data.images : [''],
        status: data.status
      });
    } catch (error) {
      console.error('Error loading object:', error);
      alert('Ошибка при загрузке объекта');
      navigate('/objects');
    } finally {
      setLoadingObject(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Необходимо войти в систему');
      return;
    }

    setLoading(true);

    try {
      const objectData = {
        id: parseInt(id!),
        price: parseFloat(formData.price),
        yield_percent: parseFloat(formData.yield),
        description: formData.description,
        images: formData.images.filter(img => img.trim() !== ''),
        status: formData.status
      };

      const response = await fetch('https://functions.poehali.dev/fc00dc4e-18bf-4893-bb9d-331e8abda973?resource=objects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString()
        },
        body: JSON.stringify(objectData)
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении объекта');
      }

      navigate('/objects');
    } catch (error) {
      console.error('Error updating object:', error);
      alert('Ошибка при обновлении объекта');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот объект?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://functions.poehali.dev/fc00dc4e-18bf-4893-bb9d-331e8abda973?resource=objects&id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': user!.id.toString()
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении объекта');
      }

      navigate('/objects');
    } catch (error) {
      console.error('Error deleting object:', error);
      alert('Ошибка при удалении объекта');
      setLoading(false);
    }
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateImageField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  if (loadingObject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={48} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/objects')}>
            <Icon name="ArrowLeft" className="mr-2" size={20} />
            Назад к объектам
          </Button>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h1 className="text-3xl font-bold mb-6">Редактировать объект</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Название объекта</Label>
                <Input
                  id="title"
                  value={formData.title}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Название нельзя изменить</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Тип недвижимости</Label>
                <Input
                  id="type"
                  value={formData.type === 'flats' ? 'Квартиры' : formData.type === 'apartments' ? 'Апартаменты' : formData.type === 'commercial' ? 'Коммерческая' : 'Загородная'}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Город</Label>
                <Input
                  id="city"
                  value={formData.city}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Адрес</Label>
                <Input
                  id="address"
                  value={formData.address}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Цена (₽) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Площадь (м²)</Label>
                <Input
                  id="area"
                  value={formData.area}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yield">Доходность (%) *</Label>
                <Input
                  id="yield"
                  type="number"
                  step="0.1"
                  value={formData.yield}
                  onChange={(e) => setFormData(prev => ({ ...prev, yield: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paybackPeriod">Срок окупаемости (лет)</Label>
                <Input
                  id="paybackPeriod"
                  value={formData.paybackPeriod}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="status">Статус *</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Доступен</SelectItem>
                    <SelectItem value="reserved">Забронирован</SelectItem>
                    <SelectItem value="sold">Продан</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Изображения (URL) *</Label>
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={image}
                    onChange={(e) => updateImageField(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.images.length > 1 && (
                    <Button type="button" variant="outline" onClick={() => removeImageField(index)}>
                      <Icon name="Trash2" size={20} />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addImageField} className="w-full">
                <Icon name="Plus" className="mr-2" size={20} />
                Добавить изображение
              </Button>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/objects')}>
                Отмена
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                <Icon name="Trash2" className="mr-2" size={20} />
                Удалить
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditObjectPage;
