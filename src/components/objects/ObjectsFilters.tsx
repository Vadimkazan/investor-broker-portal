import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ObjectFilters, PropertyType, ObjectStatus } from '@/types/investment-object';

interface ObjectsFiltersProps {
  filters: ObjectFilters;
  onFiltersChange: (filters: ObjectFilters) => void;
}

const ObjectsFilters = ({ filters, onFiltersChange }: ObjectsFiltersProps) => {
  const cities = ['Москва', 'Санкт-Петербург', 'Сочи', 'Казань', 'Екатеринбург', 'Краснодар', 'Московская область'];
  
  const propertyTypes: { value: PropertyType; label: string }[] = [
    { value: 'flats', label: 'Квартиры' },
    { value: 'apartments', label: 'Апартаменты' },
    { value: 'commercial', label: 'Коммерческая' },
    { value: 'country', label: 'Загородная' }
  ];

  const yieldRanges = [
    { value: '0-30', label: 'до 30%' },
    { value: '31-50', label: '31-50%' },
    { value: '51-100', label: '51-100%' },
    { value: '100+', label: 'свыше 100%' }
  ];

  const paybackRanges = [
    { value: '0-5', label: 'до 5 лет' },
    { value: '5-8', label: '5-8 лет' },
    { value: '8-12', label: '8-12 лет' },
    { value: '12+', label: 'свыше 12 лет' }
  ];

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleCityToggle = (city: string) => {
    const newCities = filters.cities.includes(city)
      ? filters.cities.filter(c => c !== city)
      : [...filters.cities, city];
    onFiltersChange({ ...filters, cities: newCities });
  };

  const handleTypeToggle = (type: PropertyType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  const handlePriceRangeChange = (value: number[]) => {
    onFiltersChange({ ...filters, priceRange: [value[0], value[1]] });
  };

  const handleYieldRangeToggle = (range: string) => {
    const newRanges = filters.yieldRanges.includes(range)
      ? filters.yieldRanges.filter(r => r !== range)
      : [...filters.yieldRanges, range];
    onFiltersChange({ ...filters, yieldRanges: newRanges });
  };

  const handlePaybackRangeToggle = (range: string) => {
    const newRanges = filters.paybackRanges.includes(range)
      ? filters.paybackRanges.filter(r => r !== range)
      : [...filters.paybackRanges, range];
    onFiltersChange({ ...filters, paybackRanges: newRanges });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status as ObjectStatus });
  };

  const handleBrokerCityToggle = (city: string) => {
    const newCities = (filters.brokerCities || []).includes(city)
      ? (filters.brokerCities || []).filter(c => c !== city)
      : [...(filters.brokerCities || []), city];
    onFiltersChange({ ...filters, brokerCities: newCities });
  };

  const handleBrokerClubToggle = (club: string) => {
    const newClubs = (filters.brokerClubs || []).includes(club)
      ? (filters.brokerClubs || []).filter(c => c !== club)
      : [...(filters.brokerClubs || []), club];
    onFiltersChange({ ...filters, brokerClubs: newClubs });
  };

  const handleBrokerStreamToggle = (stream: string) => {
    const newStreams = (filters.brokerStreams || []).includes(stream)
      ? (filters.brokerStreams || []).filter(s => s !== stream)
      : [...(filters.brokerStreams || []), stream];
    onFiltersChange({ ...filters, brokerStreams: newStreams });
  };

  const handleReset = () => {
    onFiltersChange({
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
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Фильтры</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <Icon name="RotateCcw" size={16} className="mr-1" />
            Сбросить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Поиск по названию/адресу</Label>
          <Input
            placeholder="Введите название или адрес..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Город</Label>
          <div className="space-y-2">
            {cities.map((city) => (
              <div key={city} className="flex items-center space-x-2">
                <Checkbox
                  id={`city-${city}`}
                  checked={filters.cities.includes(city)}
                  onCheckedChange={() => handleCityToggle(city)}
                />
                <label htmlFor={`city-${city}`} className="text-sm cursor-pointer">
                  {city}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Тип недвижимости</Label>
          <div className="space-y-2">
            {propertyTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={filters.types.includes(type.value)}
                  onCheckedChange={() => handleTypeToggle(type.value)}
                />
                <label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer">
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Бюджет, руб.</Label>
          <div className="px-2">
            <Slider
              min={0}
              max={500000000}
              step={1000000}
              value={[filters.priceRange[0], filters.priceRange[1]]}
              onValueChange={handlePriceRangeChange}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{(filters.priceRange[0] / 1000000).toFixed(0)} млн</span>
            <span>{(filters.priceRange[1] / 1000000).toFixed(0)} млн</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Доходность, % годовых</Label>
          <div className="space-y-2">
            {yieldRanges.map((range) => (
              <div key={range.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`yield-${range.value}`}
                  checked={filters.yieldRanges.includes(range.value)}
                  onCheckedChange={() => handleYieldRangeToggle(range.value)}
                />
                <label htmlFor={`yield-${range.value}`} className="text-sm cursor-pointer">
                  {range.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Срок окупаемости, лет</Label>
          <div className="space-y-2">
            {paybackRanges.map((range) => (
              <div key={range.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`payback-${range.value}`}
                  checked={filters.paybackRanges.includes(range.value)}
                  onCheckedChange={() => handlePaybackRangeToggle(range.value)}
                />
                <label htmlFor={`payback-${range.value}`} className="text-sm cursor-pointer">
                  {range.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Статус объекта</Label>
          <RadioGroup value={filters.status || ''} onValueChange={handleStatusChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="" id="status-all" />
              <label htmlFor="status-all" className="text-sm cursor-pointer">
                Все объекты
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="available" id="status-available" />
              <label htmlFor="status-available" className="text-sm cursor-pointer">
                Свободен
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="reserved" id="status-reserved" />
              <label htmlFor="status-reserved" className="text-sm cursor-pointer">
                Бронь
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sold" id="status-sold" />
              <label htmlFor="status-sold" className="text-sm cursor-pointer">
                Продано
              </label>
            </div>
          </RadioGroup>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Icon name="UserCircle" size={16} />
            Фильтры по брокерам
          </h3>

          <div className="space-y-2">
            <Label>Город брокера</Label>
            <div className="space-y-2">
              {cities.map((city) => (
                <div key={`broker-city-${city}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`broker-city-${city}`}
                    checked={(filters.brokerCities || []).includes(city)}
                    onCheckedChange={() => handleBrokerCityToggle(city)}
                  />
                  <label htmlFor={`broker-city-${city}`} className="text-sm cursor-pointer">
                    {city}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Клуб брокера</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="broker-club-rib"
                  checked={(filters.brokerClubs || []).includes('Real Invest Broker')}
                  onCheckedChange={() => handleBrokerClubToggle('Real Invest Broker')}
                />
                <label htmlFor="broker-club-rib" className="text-sm cursor-pointer">
                  Real Invest Broker
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Поток обучения</Label>
            <div className="space-y-2">
              {['Real invest broker 6.0', 'Real invest broker 7.0', 'Real invest broker 8.0'].map((stream) => (
                <div key={`stream-${stream}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`stream-${stream}`}
                    checked={(filters.brokerStreams || []).includes(stream)}
                    onCheckedChange={() => handleBrokerStreamToggle(stream)}
                  />
                  <label htmlFor={`stream-${stream}`} className="text-sm cursor-pointer">
                    {stream}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ObjectsFilters;