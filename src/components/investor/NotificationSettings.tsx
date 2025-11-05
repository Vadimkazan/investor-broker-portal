import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface NotificationSettingsProps {
  userId: number;
}

const NotificationSettings = ({ userId }: NotificationSettingsProps) => {
  const [notifyNewObjects, setNotifyNewObjects] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramInput, setTelegramInput] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const user = await api.getUserById(userId);
      setNotifyNewObjects(user.notify_new_objects || false);
      setTelegramChatId(user.telegram_chat_id || '');
      setTelegramInput(user.telegram_chat_id || '');
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

  const handleSaveTelegram = async () => {
    try {
      await api.updateUser(userId, { telegram_chat_id: telegramInput });
      setTelegramChatId(telegramInput);
      
      toast({
        title: 'Telegram подключен',
        description: 'Теперь вы будете получать уведомления в Telegram',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить Telegram ID',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnectTelegram = async () => {
    try {
      await api.updateUser(userId, { telegram_chat_id: null });
      setTelegramChatId('');
      setTelegramInput('');
      
      toast({
        title: 'Telegram отключен',
        description: 'Уведомления в Telegram больше не будут приходить',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отключить Telegram',
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

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Send" size={20} className="text-blue-500" />
            <h3 className="text-base font-medium">Telegram-уведомления</h3>
          </div>

          {!telegramChatId ? (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Получайте мгновенные уведомления в Telegram:
                </p>
                <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Откройте бот <a href="https://t.me/rielvestor_bot" target="_blank" rel="noopener noreferrer" className="text-primary underline">@rielvestor_bot</a></li>
                  <li>Отправьте команду /start</li>
                  <li>Скопируйте ваш Chat ID</li>
                  <li>Вставьте его в поле ниже</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ваш Telegram Chat ID"
                  value={telegramInput}
                  onChange={(e) => setTelegramInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSaveTelegram}
                  disabled={!telegramInput.trim()}
                >
                  <Icon name="Check" size={16} className="mr-2" />
                  Подключить
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="CheckCircle2" size={20} className="text-green-500 mt-0.5" />
                  <div className="text-sm flex-1">
                    <p className="font-medium text-green-700 dark:text-green-400 mb-1">
                      Telegram подключен
                    </p>
                    <p className="text-muted-foreground">
                      Chat ID: <span className="font-mono">{telegramChatId}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDisconnectTelegram}
                className="w-full"
              >
                <Icon name="Unlink" size={16} className="mr-2" />
                Отключить Telegram
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;