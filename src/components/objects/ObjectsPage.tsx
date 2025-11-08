import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';
import ObjectsFilters from './ObjectsFilters';
import ObjectCard from './ObjectCard';
import { InvestmentObject, ObjectFilters } from '@/types/investment-object';
import { useObjects } from '@/hooks/useObjects';
import { useAuth } from '@/contexts/AuthContext';

const ObjectsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState<ObjectFilters>({
    search: '',
    cities: [],
    types: [],
    priceRange: [0, 500000000],
    yieldRanges: [],
    paybackRanges: [],
    status: undefined,
    brokerCities: [],
    brokerClubs: [],
    brokerStreams: []
  });
  const [sortBy, setSortBy] = useState('default');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data: objects = [], isLoading, error } = useObjects();

  useEffect(() => {
    document.title = 'Каталог объектов для инвестиций - InvestPro';
    loadFiltersFromStorage();
  }, []);

  useEffect(() => {
    localStorage.setItem('object-filters', JSON.stringify(filters));
  }, [filters]);

  const loadFiltersFromStorage = () => {
    const savedFilters = localStorage.getItem('object-filters');
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }
  };

  const filteredObjects = useMemo(() => {
    let result = [...objects];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(obj => 
        obj.title.toLowerCase().includes(searchLower) ||
        obj.address.toLowerCase().includes(searchLower)
      );
    }

    if (filters.cities && filters.cities.length > 0) {
      result = result.filter(obj => filters.cities.includes(obj.city));
    }

    if (filters.types && filters.types.length > 0) {
      result = result.filter(obj => filters.types.includes(obj.type));
    }

    if (filters.priceRange) {
      result = result.filter(obj => 
        obj.price >= filters.priceRange![0] && 
        obj.price <= filters.priceRange![1]
      );
    }

    if (filters.yieldRanges && filters.yieldRanges.length > 0) {
      result = result.filter(obj => {
        return filters.yieldRanges!.some(range => {
          if (range === '0-5') return obj.yield >= 0 && obj.yield < 5;
          if (range === '5-10') return obj.yield >= 5 && obj.yield < 10;
          if (range === '10-15') return obj.yield >= 10 && obj.yield < 15;
          if (range === '15+') return obj.yield >= 15;
          return false;
        });
      });
    }

    if (filters.paybackRanges && filters.paybackRanges.length > 0) {
      result = result.filter(obj => {
        return filters.paybackRanges!.some(range => {
          if (range === '0-3') return obj.paybackPeriod >= 0 && obj.paybackPeriod < 3;
          if (range === '3-5') return obj.paybackPeriod >= 3 && obj.paybackPeriod < 5;
          if (range === '5-7') return obj.paybackPeriod >= 5 && obj.paybackPeriod < 7;
          if (range === '7+') return obj.paybackPeriod >= 7;
          return false;
        });
      });
    }

    if (filters.brokerCities && filters.brokerCities.length > 0 && objects.length > 0) {
      result = result.filter(obj => {
        const objWithBroker = objects.find(o => o.id === obj.id);
        return objWithBroker?.brokerId && filters.brokerCities!.some(city => 
          (objWithBroker as any).broker?.city === city
        );
      });
    }

    if (filters.brokerClubs && filters.brokerClubs.length > 0 && objects.length > 0) {
      result = result.filter(obj => {
        const objWithBroker = objects.find(o => o.id === obj.id);
        return objWithBroker?.brokerId && filters.brokerClubs!.some(club => 
          (objWithBroker as any).broker?.club === club
        );
      });
    }

    if (filters.brokerStreams && filters.brokerStreams.length > 0 && objects.length > 0) {
      result = result.filter(obj => {
        const objWithBroker = objects.find(o => o.id === obj.id);
        return objWithBroker?.brokerId && filters.brokerStreams!.some(stream => 
          (objWithBroker as any).broker?.training_stream === stream
        );
      });
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'yield-desc':
        result.sort((a, b) => b.yield - a.yield);
        break;
      case 'payback-asc':
        result.sort((a, b) => a.paybackPeriod - b.paybackPeriod);
        break;
    }

    return result;
  }, [objects, filters, sortBy]);

  const handleTabChange = (tab: string) => {
    if (tab === 'home') navigate('/');
    else if (tab === 'objects') navigate('/objects');
    else if (tab === 'calculator') navigate('/?tab=calculator');
    else if (tab === 'dashboard') navigate('/?tab=dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('investpro-user');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          activeTab="objects" 
          onTabChange={handleTabChange} 
          user={user} 
          onAuthClick={() => navigate('/')}
          onLogout={handleLogout}
          onRoleSwitch={() => {}}
        />
        <div className="text-center py-16">
          <Icon name="Loader2" size={48} className="mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Загрузка объектов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          activeTab="objects" 
          onTabChange={handleTabChange} 
          user={user} 
          onAuthClick={() => navigate('/')}
          onLogout={handleLogout}
          onRoleSwitch={() => {}}
        />
        <div className="text-center py-16">
          <Icon name="AlertCircle" size={48} className="mx-auto text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ошибка загрузки</h3>
          <p className="text-muted-foreground mb-4">{error.toString()}</p>
          <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeTab="objects" 
        onTabChange={handleTabChange} 
        user={user} 
        onAuthClick={() => navigate('/')}
        onLogout={handleLogout}
        onRoleSwitch={() => {}}
      />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-4">Инвестиционные объекты</h1>
            <p className="text-muted-foreground text-lg">
              Найдите лучшие предложения для инвестиций в недвижимость
            </p>
          </div>
          {user?.role === 'broker' && (
            <Button onClick={() => navigate('/objects/add')} size="lg">
              <Icon name="Plus" className="mr-2" size={20} />
              Добавить объект
            </Button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className={`
            lg:w-80 lg:block
            ${showMobileFilters ? 'block' : 'hidden'}
          `}>
            <div className="bg-card rounded-lg border p-6 sticky top-24">
              <ObjectsFilters 
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-muted-foreground">
                Найдено объектов: <span className="font-semibold text-foreground">{filteredObjects.length}</span>
              </p>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="lg:hidden flex-1"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <Icon name="SlidersHorizontal" className="mr-2" size={16} />
                  Фильтры
                </Button>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">По умолчанию</SelectItem>
                    <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
                    <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
                    <SelectItem value="yield-desc">Доходность: макс.</SelectItem>
                    <SelectItem value="payback-asc">Окупаемость: мин.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredObjects.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="Search" size={64} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Объекты не найдены</h3>
                <p className="text-muted-foreground mb-6">
                  Попробуйте изменить параметры фильтрации
                </p>
                <Button onClick={() => setFilters({
                  search: '',
                  cities: [],
                  types: [],
                  priceRange: [0, 500000000],
                  yieldRanges: [],
                  paybackRanges: [],
                  status: undefined
                })}>
                  Сбросить фильтры
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredObjects.map((object) => (
                  <ObjectCard 
                    key={object.id} 
                    object={object}
                    onClick={() => navigate(`/objects/${object.id}`)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ObjectsPage;