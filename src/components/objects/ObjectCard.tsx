import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { InvestmentObject } from '@/types/investment-object';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ObjectCardProps {
  object: InvestmentObject;
}

const ObjectCard = ({ object }: ObjectCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.includes(object.id);
  });

  const isOwner = user && object.brokerId === user.id;

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

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (isFavorite) {
      const newFavorites = favorites.filter((id: number) => id !== object.id);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      localStorage.setItem('favorites', JSON.stringify([...favorites, object.id]));
      setIsFavorite(true);
    }
  };

  const handleCardClick = () => {
    navigate(`/objects/${object.id}`);
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="relative h-48 bg-muted overflow-hidden">
        <img
          src={object.images[0] || 'https://via.placeholder.com/400x300?text=Объект'}
          alt={object.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/90 hover:bg-white"
            onClick={toggleFavorite}
          >
            <Icon 
              name="Heart" 
              size={18} 
              className={isFavorite ? 'fill-red-500 text-red-500' : ''} 
            />
          </Button>
        </div>
        <div className="absolute top-3 left-3">
          <Badge variant={statusLabels[object.status].variant}>
            {statusLabels[object.status].label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {object.title}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center">
            <Icon name="MapPin" size={14} className="mr-1" />
            {object.address}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Icon name="Building2" size={14} className="mr-1" />
            <span>{propertyTypeLabels[object.type]}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Icon name="Maximize2" size={14} className="mr-1" />
            <span>{object.area} м²</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Доходность:</span>
            <span className="font-semibold text-primary">~{object.yield}% годовых</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Сумма входа:</span>
            <span className="font-semibold">{(object.price / 1000000).toFixed(1)} млн ₽</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Окупаемость:</span>
            <span className="font-medium">~{object.paybackPeriod} лет</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={handleCardClick}>
            Подробнее
          </Button>
          {isOwner && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/objects/${object.id}/edit`);
              }}
            >
              <Icon name="Pencil" size={18} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ObjectCard;