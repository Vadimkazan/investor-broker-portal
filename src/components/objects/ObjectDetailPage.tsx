import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import { Broker } from '@/types/investment-object';
import { useObject } from '@/hooks/useObjects';
import { useFavorites, useAddToFavorites, useRemoveFromFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

const ObjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const objectId = id ? parseInt(id) : 0;
  
  const { data: object, isLoading, error } = useObject(objectId);
  const { data: favorites = [] } = useFavorites();
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();
  
  const [broker, setBroker] = useState<Broker | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  const isFavorite = favorites.includes(objectId);

  useEffect(() => {
    if (object) {
      document.title = `${object.title} - InvestPro`;
      if (object.brokerId) {
        loadBroker(object.brokerId);
      }
    }
  }, [object]);

  const loadBroker = (brokerId: number) => {
    const mockBroker: Broker = {
      id: brokerId,
      name: 'Иван Петров',
      company: 'Премиум Недвижимость',
      photo: 'https://via.placeholder.com/150',
      rating: 4.8,
      phone: '+7 (495) 123-45-67',
      email: 'broker@example.com',
      dealsCompleted: 156
    };
    setBroker(mockBroker);
  };

  const propertyTypeLabels: Record<string, string> = {
    flats: 'Квартиры',
    apartments: 'Апартаменты',
    commercial: 'Коммерческая',
    country: 'Загородная'
  };

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    available: { label: 'Свободен', variant: 'default' },
    reserved: { label: 'Бронь', variant: 'secondary' },
    sold: { label: 'Продано', variant: 'destructive' }
  };

  const handleToggleFavorite = async () => {
    if (isFavorite) {
      await removeFromFavorites.mutateAsync(objectId);
    } else {
      await addToFavorites.mutateAsync(objectId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Заявка отправлена:', formData);
    alert('Спасибо за заявку! Мы свяжемся с вами в ближайшее время.');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onLogout={handleLogout} />
        <div className="text-center py-16">
          <Icon name="Loader2" size={48} className="mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !object) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onLogout={handleLogout} />
        <div className="text-center py-16">
          <Icon name="AlertCircle" size={48} className="mx-auto text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Объект не найден</h3>
          <p className="text-muted-foreground mb-4">
            {error ? error.toString() : 'Запрошенный объект не существует'}
          </p>
          <Button onClick={() => navigate('/objects')}>Вернуться к списку</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/objects')}
        >
          <Icon name="ArrowLeft" size={16} className="mr-2" />
          Назад к объектам
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted">
                  {object.images && object.images.length > 0 ? (
                    <>
                      <img 
                        src={object.images[currentImageIndex]} 
                        alt={object.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                      {object.images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between p-4">
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => setCurrentImageIndex((currentImageIndex - 1 + object.images.length) % object.images.length)}
                          >
                            <Icon name="ChevronLeft" size={20} />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            onClick={() => setCurrentImageIndex((currentImageIndex + 1) % object.images.length)}
                          >
                            <Icon name="ChevronRight" size={20} />
                          </Button>
                        </div>
                      )}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {object.images.length}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Icon name="ImageOff" size={48} className="text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold mb-2">{object.title}</h1>
                      <p className="text-muted-foreground flex items-center">
                        <Icon name="MapPin" size={16} className="mr-1" />
                        {object.address}, {object.city}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant={isFavorite ? 'default' : 'outline'}
                      onClick={handleToggleFavorite}
                      disabled={addToFavorites.isPending || removeFromFavorites.isPending}
                    >
                      <Icon 
                        name={isFavorite ? 'Heart' : 'HeartOff'} 
                        size={20}
                        className={isFavorite ? 'fill-current' : ''}
                      />
                    </Button>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <Badge variant={statusLabels[object.status]?.variant || 'default'}>
                      {statusLabels[object.status]?.label || object.status}
                    </Badge>
                    <Badge variant="outline">
                      {propertyTypeLabels[object.type] || object.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Цена</p>
                        <p className="text-xl font-bold">
                          {(object.price / 1000000).toFixed(1)} млн ₽
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Доходность</p>
                        <p className="text-xl font-bold text-primary">
                          {object.yield}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Окупаемость</p>
                        <p className="text-xl font-bold">
                          {object.paybackPeriod} лет
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-3">Описание</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Отличная инвестиционная возможность в {object.city}. 
                      Объект расположен в развивающемся районе с хорошей инфраструктурой.
                      Высокая доходность {object.yield}% годовых делает это предложение особенно привлекательным.
                      Окупаемость составляет {object.paybackPeriod} года при текущих рыночных условиях.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {broker && (
              <Card>
                <CardHeader>
                  <CardTitle>Брокер</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {broker.photo ? (
                        <img src={broker.photo} alt={broker.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="User" size={32} className="text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{broker.name}</p>
                      <p className="text-sm text-muted-foreground">{broker.company}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Icon name="Star" size={16} className="text-yellow-500 fill-current" />
                      <span className="text-sm">Рейтинг: {broker.rating}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="CheckCircle" size={16} className="text-green-500" />
                      <span className="text-sm">Сделок: {broker.dealsCompleted}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Icon name="Phone" size={16} className="mr-2" />
                      {broker.phone}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Icon name="Mail" size={16} className="mr-2" />
                      {broker.email}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Оставить заявку</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Ваше имя</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Сообщение</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Отправить заявку
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectDetailPage;
