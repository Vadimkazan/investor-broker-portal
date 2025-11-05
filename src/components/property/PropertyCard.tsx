import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import type { PropertyObject, PropertyStatus } from '@/types/investment';

interface PropertyCardProps {
  property: PropertyObject;
  onEdit: (property: PropertyObject) => void;
  onDelete: (id: string) => void;
  onShare: (property: PropertyObject) => void;
  getStatusBadge: (status: PropertyStatus) => React.ReactNode;
}

const PropertyCard = ({ property, onEdit, onDelete, onShare, getStatusBadge }: PropertyCardProps) => {
  const progress = (property.investment.currentInvestment / property.investment.targetInvestment) * 100;

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: 'Квартира',
      house: 'Дом',
      commercial: 'Коммерческая',
      land: 'Земля',
    };
    return labels[type] || type;
  };

  const getRiskBadge = (risk: string) => {
    const riskConfig: Record<string, { label: string; className: string }> = {
      low: { label: 'Низкий', className: 'bg-green-500' },
      medium: { label: 'Средний', className: 'bg-yellow-500' },
      high: { label: 'Высокий', className: 'bg-red-500' },
    };
    const config = riskConfig[risk] || riskConfig.medium;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{property.title}</CardTitle>
              {getStatusBadge(property.status)}
            </div>
            <CardDescription className="flex items-center gap-1">
              <Icon name="MapPin" size={14} />
              {property.location.city}, {property.location.district}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Тип</p>
            <p className="font-medium">{getPropertyTypeLabel(property.propertyType)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Площадь</p>
            <p className="font-medium">{property.details.area} м²</p>
          </div>
          <div>
            <p className="text-muted-foreground">Цена</p>
            <p className="font-medium">₽{(property.pricing.totalPrice / 1000000).toFixed(1)}M</p>
          </div>
          <div>
            <p className="text-muted-foreground">Доходность</p>
            <p className="font-medium text-green-600">{property.investment.expectedReturn}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            {getRiskBadge(property.investment.riskLevel)}
            <Badge variant="outline">
              <Icon name="Users" size={12} className="mr-1" />
              {property.investment.investors}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon name="Eye" size={14} />
            {property.metadata?.views || 0}
          </div>
        </div>

        {property.sharing?.telegramPublished && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
            <Icon name="Send" size={14} />
            <span>Опубликовано в Telegram</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(property)} className="gap-1">
            <Icon name="Pencil" size={14} />
            Редактировать
          </Button>
          <Button variant="outline" size="sm" onClick={() => onShare(property)} className="gap-1">
            <Icon name="Share2" size={14} />
            Поделиться
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(property.id)} className="gap-1 text-red-600 hover:text-red-700">
            <Icon name="Trash2" size={14} />
            Удалить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;