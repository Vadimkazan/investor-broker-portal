import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface NotificationSettingsProps {
  userId: number;
}

const NotificationSettings = ({ userId }: NotificationSettingsProps) => {
  const [notifyNewObjects, setNotifyNewObjects] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const user = await api.getUserById(userId);
      setNotifyNewObjects(user.notify_new_objects || false);
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setNotifyNewObjects(enabled);
    
    try {
      await api.updateUser(userId, { notify_new_objects: enabled });
      
      toast({
        title: enabled ? 'Подписка оформлена' : 'Подписка отменена',
        description: enabled 
          ? 'Вы будете получать уведомления о новых объектах' 
          : 'Вы больше не будете получать уведомления о новых объектах',
      });
    } catch (error) {
      setNotifyNewObjects(!enabled);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить настройки',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Icon name="Loader2" className="animate-spin mx-auto" size={24} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Bell" size={20} />
          Уведомления
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="notify-new-objects" className="text-base font-medium">
              Новые объекты
            </Label>
            <p className="text-sm text-muted-foreground">
              Получать уведомления когда появляются новые инвестиционные объекты
            </p>
          </div>
          <Switch
            id="notify-new-objects"
            checked={notifyNewObjects}
            onCheckedChange={handleToggle}
          />
        </div>

        {notifyNewObjects && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} className="text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary mb-1">Подписка активна</p>
                <p className="text-muted-foreground">
                  Вы будете получать уведомления о всех новых объектах, добавленных на платформу
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
