import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import ImageUploader from '@/components/ui/image-uploader';
import PropertyTypeSelect from '@/components/ui/property-type-select';

const AddObjectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'apartments' as import('@/types/investment-object').PropertyType,
    city: '',
    address: '',
    price: '',
    yield: '',
    paybackPeriod: '',
    area: '',
    description: '',
    images: ['']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setErrorMsg('Необходимо войти в систему');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const objectData = {
        broker_id: user.id,
        title: formData.title,
        property_type: formData.type,
        city: formData.city,
        address: formData.address,
        price: parseFloat(formData.price),
        yield_percent: parseFloat(formData.yield),
        payback_years: parseFloat(formData.paybackPeriod),
        area: parseFloat(formData.area),
        description: formData.description,
        images: formData.images.filter(img => img.trim() !== ''),
        status: 'available'
      };

      const response = await fetch('https://functions.poehali.dev/fc00dc4e-18bf-4893-bb9d-331e8abda973?resource=objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(objectData)
      });

        if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Ошибка сервера: ${response.status}`);
      }

      navigate('/objects');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold mb-6">Добавить новый объект</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название объекта *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="Апартаменты в ЖК..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Тип недвижимости *</Label>
                <PropertyTypeSelect
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as typeof formData.type }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Город *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                  placeholder="Москва"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Адрес *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                  placeholder="ул. Примерная, 1"
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
                  placeholder="5000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Площадь (м²) *</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  required
                  placeholder="45"
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
                  placeholder="12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paybackPeriod">Срок окупаемости (лет) *</Label>
                <Input
                  id="paybackPeriod"
                  type="number"
                  step="0.1"
                  value={formData.paybackPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paybackPeriod: e.target.value }))}
                  required
                  placeholder="7"
                />
              </div>


            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                placeholder="Подробное описание объекта..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Фотографии объекта</Label>
              <ImageUploader
                images={formData.images.filter(img => img.trim() !== '')}
                onChange={(imgs) => setFormData(prev => ({ ...prev, images: imgs }))}
              />
            </div>

            {errorMsg && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Создание...' : 'Создать объект'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/objects')}>
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddObjectPage;