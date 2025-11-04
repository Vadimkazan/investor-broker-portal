import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { useObjects, useUpdateObject } from '@/hooks/useObjects';

interface BrokerObjectsManagerProps {
  onAddClick: () => void;
}

const BrokerObjectsManager = ({ onAddClick }: BrokerObjectsManagerProps) => {
  const navigate = useNavigate();
  const { data: objects = [], isLoading, error } = useObjects();
  const updateObject = useUpdateObject();

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
          <p className="text-muted-foreground">Всего объектов: {objects.length}</p>
        </div>
        <Button onClick={onAddClick}>
          <Icon name="Plus" size={16} className="mr-2" />
          Добавить объект
        </Button>
      </div>

      {objects.length === 0 ? (
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
      ) : (
        <div className="grid gap-4">
          {objects.map((object) => (
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
