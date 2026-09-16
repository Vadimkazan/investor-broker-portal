import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

const TELEGRAM_BOT_URL = 'https://functions.poehali.dev/0db3f807-568e-4315-90c1-bc467c92575b';

interface NotificationSettingsProps {
  userId: number;
}

const NotificationSettings = ({ userId }: NotificationSettingsProps) => {
  const [notifyNewObjects, setNotifyNewObjects] = useState(false);
  const [notifyChannelPosts, setNotifyChannelPosts] = useState(true);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [userId]);

  useEffect(() => {
    if (!connecting) return;
    const interval = setInterval(async () => {
      try {
        const user = await api.getUserById(userId);
        if (user.telegram_chat_id) {
          setTelegramChatId(user.telegram_chat_id);
          setConnecting(false);
          toast({
            title: 'Telegram подключен',
            description: 'Уведомления будут приходить вам в Telegram',
          });
        }
      } catch (error) {
        console.error('Ошибка проверки подключения:', error);
      }
    }, 3000);

    const timeout = setTimeout(() => setConnecting(false), 180000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [connecting, userId]);

  const loadSettings = async () => {
    try {
      const user = await api.getUserById(userId);
      setNotifyNewObjects(user.notify_new_objects || false);
      setNotifyChannelPosts(user.notify_channel_posts !== false);
      setTelegramChatId(user.telegram_chat_id || '');
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

  const handleToggleChannelPosts = async (enabled: boolean) => {
    setNotifyChannelPosts(enabled);

    try {
      await api.updateUser(userId, { notify_channel_posts: enabled });

      toast({
        title: enabled ? 'Подписка на клуб включена' : 'Подписка на клуб отключена',
        description: enabled
          ? 'Новые посты клуба будут приходить вам в Telegram'
          : 'Посты клуба больше не будут приходить',
      });
    } catch (error) {
      setNotifyChannelPosts(!enabled);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить настройки',
        variant: 'destructive',
      });
    }
  };

  const handleConnectTelegram = async () => {
    try {
      const res = await fetch(`${TELEGRAM_BOT_URL}?action=link-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Не удалось создать ссылку');
      }

      window.open(data.url, '_blank');
      setConnecting(true);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось начать подключение Telegram',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnectTelegram = async () => {
    try {
      await api.updateUser(userId, { telegram_chat_id: null });
      setTelegramChatId('');
      setConnecting(false);
      
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

        <div className="flex items-center justify-between space-x-2 pt-4 border-t">
          <div className="flex-1 space-y-1">
            <Label htmlFor="notify-channel-posts" className="text-base font-medium">
              Получать посты из клуба
            </Label>
            <p className="text-sm text-muted-foreground">
              Новые публикации из{' '}
              <a
                href="https://t.me/Arealvest_klub"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                клуба Arealvest
              </a>{' '}
              будут приходить вам в Telegram
            </p>
          </div>
          <Switch
            id="notify-channel-posts"
            checked={notifyChannelPosts}
            onCheckedChange={handleToggleChannelPosts}
          />
        </div>

        {notifyChannelPosts && !telegramChatId && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="TriangleAlert" size={20} className="text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">
                  Telegram не подключен
                </p>
                <p className="text-muted-foreground">
                  Нажмите «Подключить Telegram» ниже — иначе рассылка не придёт
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
              <p className="text-sm text-muted-foreground">
                Нажмите кнопку — откроется чат с ботом, где нужно нажать «Старт».
                Уведомления подключатся автоматически.
              </p>

              {connecting ? (
                <div className="space-y-3">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Icon name="Loader2" size={20} className="text-primary mt-0.5 animate-spin" />
                      <div className="text-sm">
                        <p className="font-medium text-primary mb-1">Ожидание подтверждения</p>
                        <p className="text-muted-foreground">
                          Нажмите «Старт» в открывшемся чате с ботом — статус обновится автоматически
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleConnectTelegram} className="w-full">
                    <Icon name="RefreshCw" size={16} className="mr-2" />
                    Открыть чат с ботом снова
                  </Button>
                </div>
              ) : (
                <Button onClick={handleConnectTelegram} className="w-full">
                  <Icon name="Send" size={16} className="mr-2" />
                  Подключить Telegram
                </Button>
              )}
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
                      Уведомления приходят вам в чат с ботом @arealvests_bot
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