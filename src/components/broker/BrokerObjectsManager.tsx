import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { useObjects, useUpdateObject } from '@/hooks/useObjects';
import { PropertyType } from '@/types/investment-object';

interface BrokerObjectsManagerProps {
  onAddClick: () => void;
}

const BrokerObjectsManager = ({ onAddClick }: BrokerObjectsManagerProps) => {
  const navigate = useNavigate();
  const { data: objects = [], isLoading, error } = useObjects();
  const updateObject = useUpdateObject();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<PropertyType | 'all'>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [sortBy, setSortBy] = useState<'price' | 'yield' | 'date'>('date');
  
  const cities = useMemo(() => {
    const unique = Array.from(new Set(objects.map(obj => obj.city)));
    return unique.sort();
  }, [objects]);
  
  const filteredObjects = useMemo(() => {
    const filtered = objects.filter(obj => {
      const matchesSearch = obj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           obj.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || obj.type === filterType;
      const matchesCity = filterCity === 'all' || obj.city === filterCity;
      const matchesStatus = filterStatus === 'all' || obj.status === filterStatus;
      
      return matchesSearch && matchesType && matchesCity && matchesStatus;
    });
    
    return filtered.sort((a, b) => {
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'yield') return b.yield - a.yield;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [objects, searchQuery, filterType, filterCity, filterStatus, sortBy]);

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    available: { label: 'Свободен', variant: 'default' },
    reserved: { label: 'Бронь', variant: 'secondary' },
    sold: { label: 'Продано', variant: 'destructive' }
  };

  const handleStatusChange = async (id: number, status: 'available' | 'reserved' | 'sold') => {
    await updateObject.mutateAsync({ id, updates: { status } });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Icon name="Loader2" size={32} className="mx-auto text-primary animate-spin mb-2" />
        <p className="text-muted-foreground">Загрузка объектов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Icon name="AlertCircle" size={32} className="mx-auto text-destructive mb-2" />
        <p className="text-muted-foreground mb-4">{error.toString()}</p>
        <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Мои объекты</h2>
          <p className="text-muted-foreground">Всего объектов: {objects.length} | Показано: {filteredObjects.length}</p>
        </div>
        <Button onClick={onAddClick}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить объект
        </Button>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или адресу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={(v) => setFilterType(v as PropertyType | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Тип объекта" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="apartments">Апартаменты</SelectItem>
                <SelectItem value="flats">Квартиры</SelectItem>
                <SelectItem value="commercial">Коммерция</SelectItem>
                <SelectItem value="country">Загородная</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger>
                <SelectValue placeholder="Город" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все города</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="available">Свободен</SelectItem>
                <SelectItem value="reserved">Бронь</SelectItem>
                <SelectItem value="sold">Продано</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Сортировка:</span>
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('date')}
            >
              <Icon name="Calendar" size={14} className="mr-1" />
              По дате
            </Button>
            <Button
              variant={sortBy === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price')}
            >
              <Icon name="DollarSign" size={14} className="mr-1" />
              По цене
            </Button>
            <Button
              variant={sortBy === 'yield' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('yield')}
            >
              <Icon name="TrendingUp" size={14} className="mr-1" />
              По доходности
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredObjects.length === 0 && objects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Building" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Нет объектов</h3>
            <p className="text-muted-foreground mb-4">
              Добавьте свой первый инвестиционный объект
            </p>
            <Button onClick={onAddClick}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить объект
            </Button>
          </CardContent>
        </Card>
      ) : filteredObjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground mb-4">
              Попробуйте изменить параметры фильтра
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setFilterCity('all');
              setFilterStatus('all');
            }}>
              Сбросить фильтры
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredObjects.map((object) => (
            <Card key={object.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-32 h-32 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {object.images && object.images.length > 0 ? (
                      <img 
                        src={object.images[0]} 
                        alt={object.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="ImageOff" size={24} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{object.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Icon name="MapPin" size={14} className="mr-1" />
                          {object.address}, {object.city}
                        </p>
                      </div>
                      <Badge variant={statusLabels[object.status]?.variant || 'default'}>
                        {statusLabels[object.status]?.label || object.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 my-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Цена</p>
                        <p className="font-semibold">
                          {(object.price / 1000000).toFixed(1)} млн ₽
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Доходность</p>
                        <p className="font-semibold text-primary">{object.yield}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Окупаемость</p>
                        <p className="font-semibold">{object.paybackPeriod} лет</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/objects/${object.id}`)}
                      >
                        <Icon name="Eye" size={14} className="mr-1" />
                        Просмотр
                      </Button>
                      
                      {object.status === 'available' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusChange(object.id, 'reserved')}
                          disabled={updateObject.isPending}
                        >
                          <Icon name="Clock" size={14} className="mr-1" />
                          Забронировать
                        </Button>
                      )}
                      
                      {object.status === 'reserved' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(object.id, 'available')}
                            disabled={updateObject.isPending}
                          >
                            <Icon name="RotateCcw" size={14} className="mr-1" />
                            Снять бронь
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(object.id, 'sold')}
                            disabled={updateObject.isPending}
                          >
                            <Icon name="CheckCircle" size={14} className="mr-1" />
                            Продано
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrokerObjectsManager;