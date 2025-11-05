import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import TelegramPublisher from '@/components/TelegramPublisher';
import PropertyStats from '@/components/property/PropertyStats';
import PropertyCard from '@/components/property/PropertyCard';
import PropertyFormDialog from '@/components/property/PropertyFormDialog';
import { GoogleSheetsImport } from '@/components/GoogleSheetsImport';
import type { PropertyObject, PropertyType, FinancingMethod, InvestmentStrategy, RiskLevel, PropertyStatus } from '@/types/investment';

interface PropertyManagerProps {
  brokerId: string;
  brokerName: string;
}

const PropertyManager = ({ brokerId, brokerName }: PropertyManagerProps) => {
  const STORAGE_KEY = 'investpro-properties';

  const loadProperties = (): PropertyObject[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((p: any) => ({
          ...p,
          metadata: {
            ...p.metadata,
            createdAt: new Date(p.metadata.createdAt),
            updatedAt: new Date(p.metadata.updatedAt),
          },
        }));
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
    return [
      {
        id: '1',
        brokerId: 'broker-001',
        brokerName: 'Иван Петров',
        title: 'Квартира в центре Москвы',
        description: 'Современная двухкомнатная квартира с панорамным остеклением',
        propertyType: 'apartment',
        status: 'active',
        location: {
          city: 'Москва',
          district: 'Пресненский',
          address: 'ул. Красная Пресня, д. 15',
          metro: 'Баррикадная',
          metroDistance: 5,
        },
        pricing: {
          totalPrice: 25000000,
          pricePerMeter: 350000,
          minInvestment: 5000000,
          currency: 'RUB',
        },
        financing: {
          method: 'mortgage',
          mortgageRate: 8.5,
          downPayment: 20,
        },
        investment: {
          strategy: ['resale', 'rental'],
          expectedReturn: 18,
          term: 36,
          riskLevel: 'medium',
          currentInvestment: 15000000,
          targetInvestment: 25000000,
          investors: 3,
        },
        rental: {
          monthlyIncome: 120000,
          occupancyRate: 95,
          rentalYield: 5.76,
        },
        resale: {
          expectedPrice: 30000000,
          expectedProfit: 5000000,
          marketGrowth: 6.5,
        },
        details: {
          area: 72,
          rooms: 2,
          floor: 12,
          totalFloors: 25,
          buildYear: 2023,
          condition: 'Отличное',
          parking: true,
          furnishing: 'С мебелью',
        },
        media: {
          images: [],
          videos: [],
        },
        metadata: {
          createdAt: new Date('2024-10-15'),
          updatedAt: new Date('2024-10-30'),
          views: 234,
          favorites: 12,
        },
        sharing: {
          telegramPublished: true,
          telegramUrl: 'https://t.me/channel/123',
          vkPublished: false,
        },
      },
    ];
  };

  const [properties, setProperties] = useState<PropertyObject[]>(loadProperties);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    } catch (error) {
      console.error('Error saving properties:', error);
    }
  }, [properties]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyObject | null>(null);
  const [formData, setFormData] = useState<Partial<PropertyObject>>({});
  const [selectedBroker, setSelectedBroker] = useState<string>('all');

  const getEmptyProperty = (): Partial<PropertyObject> => ({
    title: '',
    description: '',
    propertyType: 'apartment',
    status: 'draft',
    location: {
      city: '',
      district: '',
      address: '',
      metro: '',
      metroDistance: 0,
    },
    pricing: {
      totalPrice: 0,
      pricePerMeter: 0,
      minInvestment: 0,
      currency: 'RUB',
    },
    financing: {
      method: 'cash',
      mortgageRate: 0,
      installmentMonths: 0,
      downPayment: 0,
    },
    investment: {
      strategy: [],
      expectedReturn: 0,
      term: 0,
      riskLevel: 'medium',
      currentInvestment: 0,
      targetInvestment: 0,
      investors: 0,
    },
    rental: {
      monthlyIncome: 0,
      occupancyRate: 0,
      rentalYield: 0,
    },
    resale: {
      expectedPrice: 0,
      expectedProfit: 0,
      marketGrowth: 0,
    },
    details: {
      area: 0,
      rooms: 0,
      floor: 0,
      totalFloors: 0,
      buildYear: new Date().getFullYear(),
      condition: '',
      parking: false,
      furnishing: '',
    },
  });

  const handleAddProperty = () => {
    setFormData(getEmptyProperty());
    setIsAddModalOpen(true);
  };

  const handleEditProperty = (property: PropertyObject) => {
    setFormData(property);
    setSelectedProperty(property);
    setIsEditModalOpen(true);
  };

  const handleDeleteProperty = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот объект?')) {
      setProperties(properties.filter(p => p.id !== id));
    }
  };

  const handleShareToTelegram = (property: PropertyObject) => {
    setSelectedProperty(property);
    setIsTelegramModalOpen(true);
  };

  const handleSaveProperty = () => {
    if (selectedProperty) {
      setProperties(properties.map(p => 
        p.id === selectedProperty.id 
          ? { ...formData as PropertyObject, id: selectedProperty.id }
          : p
      ));
      setIsEditModalOpen(false);
    } else {
      const newProperty: PropertyObject = {
        ...formData as PropertyObject,
        id: `prop-${Date.now()}`,
        brokerId: 'broker-001',
        brokerName: 'Иван Петров',
        media: { images: [] },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          views: 0,
          favorites: 0,
        },
        sharing: {
          telegramPublished: false,
          vkPublished: false,
        },
      };
      setProperties([...properties, newProperty]);
      setIsAddModalOpen(false);
    }
    setFormData({});
    setSelectedProperty(null);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      }
      
      const result = { ...prev };
      let current: any = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        } else {
          current[keys[i]] = { ...current[keys[i]] };
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return result;
    });
  };

  const toggleStrategy = (strategy: InvestmentStrategy) => {
    const currentStrategies = formData.investment?.strategy || [];
    const newStrategies = currentStrategies.includes(strategy)
      ? currentStrategies.filter(s => s !== strategy)
      : [...currentStrategies, strategy];
    updateFormData('investment.strategy', newStrategies);
  };

  const getStatusBadge = (status: PropertyStatus) => {
    const statusConfig = {
      draft: { label: 'Черновик', variant: 'secondary' as const },
      moderation: { label: 'На модерации', variant: 'default' as const },
      active: { label: 'Активен', variant: 'default' as const },
      reserved: { label: 'Зарезервирован', variant: 'secondary' as const },
      sold: { label: 'Продан', variant: 'secondary' as const },
      archived: { label: 'В архиве', variant: 'outline' as const },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUniqueBrokers = () => {
    const brokers = new Set<string>();
    properties.forEach(p => {
      brokers.add(p.brokerName);
    });
    return Array.from(brokers).sort();
  };

  const filteredProperties = selectedBroker === 'all' 
    ? properties 
    : properties.filter(p => p.brokerName === selectedBroker);

  const calculateStats = () => {
    const totalProperties = filteredProperties.length;
    const activeProperties = filteredProperties.filter(p => p.status === 'active').length;
    const totalInvestmentRaised = filteredProperties.reduce((sum, p) => sum + p.investment.currentInvestment, 0);
    const avgReturn = filteredProperties.length > 0
      ? filteredProperties.reduce((sum, p) => sum + p.investment.expectedReturn, 0) / filteredProperties.length
      : 0;

    return { totalProperties, activeProperties, totalInvestmentRaised, avgReturn };
  };

  const stats = calculateStats();
  const uniqueBrokers = getUniqueBrokers();

  const handleTelegramPublish = (published: boolean, url?: string) => {
    if (selectedProperty) {
      setProperties(properties.map(p =>
        p.id === selectedProperty.id
          ? {
              ...p,
              sharing: {
                ...p.sharing,
                telegramPublished: published,
                telegramUrl: url,
              },
            }
          : p
      ));
    }
    setIsTelegramModalOpen(false);
    setSelectedProperty(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Управление объектами</h2>
          <p className="text-muted-foreground">Брокер: {brokerName}</p>
        </div>
        <div className="flex gap-2">
          <GoogleSheetsImport />
          <Button onClick={handleAddProperty} size="lg" className="gap-2">
            <Icon name="Plus" size={20} />
            Добавить объект
          </Button>
        </div>
      </div>

      <PropertyStats
        totalProperties={stats.totalProperties}
        activeProperties={stats.activeProperties}
        totalInvestmentRaised={stats.totalInvestmentRaised}
        avgReturn={stats.avgReturn}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Мои объекты недвижимости</CardTitle>
              <CardDescription>
                Управляйте своими инвестиционными объектами
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Filter" size={18} className="text-muted-foreground" />
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Все брокеры" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все брокеры</SelectItem>
                  {uniqueBrokers.map(broker => (
                    <SelectItem key={broker} value={broker}>
                      {broker}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEditProperty}
                onDelete={handleDeleteProperty}
                onShare={handleShareToTelegram}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>

          {properties.length === 0 && (
            <div className="text-center py-12">
              <Icon name="Building2" size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">У вас пока нет добавленных объектов</p>
              <Button onClick={handleAddProperty} className="gap-2">
                <Icon name="Plus" size={20} />
                Добавить первый объект
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PropertyFormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        formData={formData}
        onFormDataChange={updateFormData}
        onToggleStrategy={toggleStrategy}
        onSubmit={handleSaveProperty}
        isEdit={false}
      />

      <PropertyFormDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        formData={formData}
        onFormDataChange={updateFormData}
        onToggleStrategy={toggleStrategy}
        onSubmit={handleSaveProperty}
        isEdit={true}
      />

      <Dialog open={isTelegramModalOpen} onOpenChange={setIsTelegramModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Публикация в Telegram</DialogTitle>
            <DialogDescription>
              Поделитесь объектом в своем Telegram-канале
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <TelegramPublisher
              property={selectedProperty}
              onPublish={handleTelegramPublish}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyManager;