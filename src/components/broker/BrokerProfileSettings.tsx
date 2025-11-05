import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface BrokerProfileSettingsProps {
  userId: number;
}

interface ProfileData {
  surname: string;
  first_name: string;
  country: string;
  city: string;
  club: string;
  training_stream: string;
  phone: string;
  telegram_username: string;
  photo_url: string;
  bio: string;
  telegram_channel: string;
  youtube_channel: string;
  vk_group: string;
}

const BrokerProfileSettings = ({ userId }: BrokerProfileSettingsProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    surname: '',
    first_name: '',
    country: 'Россия',
    city: '',
    club: 'Real Invest Broker',
    training_stream: '',
    phone: '',
    telegram_username: '',
    photo_url: '',
    bio: '',
    telegram_channel: '',
    youtube_channel: '',
    vk_group: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const user = await api.getUserById(userId);
      setProfileData({
        surname: user.surname || '',
        first_name: user.first_name || user.name || '',
        country: user.country || 'Россия',
        city: user.city || '',
        club: user.club || 'Real Invest Broker',
        training_stream: user.training_stream || '',
        phone: user.phone || '',
        telegram_username: user.telegram_username || '',
        photo_url: user.photo_url || '',
        bio: user.bio || '',
        telegram_channel: user.telegram_channel || '',
        youtube_channel: user.youtube_channel || '',
        vk_group: user.vk_group || '',
      });
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateUser(userId, profileData);
      
      toast({
        title: 'Профиль обновлен',
        description: 'Ваши данные успешно сохранены',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить профиль',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
          <Icon name="User" size={20} />
          Настройки профиля
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Основная информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surname">Фамилия *</Label>
              <Input
                id="surname"
                value={profileData.surname}
                onChange={(e) => handleChange('surname', e.target.value)}
                placeholder="Логинов"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">Имя *</Label>
              <Input
                id="first_name"
                value={profileData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Вадим"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Страна</Label>
              <Input
                id="country"
                value={profileData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Россия"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Город</Label>
              <Input
                id="city"
                value={profileData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Казань"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="club">Клуб</Label>
              <Input
                id="club"
                value={profileData.club}
                onChange={(e) => handleChange('club', e.target.value)}
                placeholder="Real Invest Broker"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="training_stream">Поток обучения</Label>
              <Input
                id="training_stream"
                value={profileData.training_stream}
                onChange={(e) => handleChange('training_stream', e.target.value)}
                placeholder="Real invest broker 6.0"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Контактная информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+7 (962) 550-00-80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram_username">Telegram *</Label>
              <Input
                id="telegram_username"
                value={profileData.telegram_username}
                onChange={(e) => handleChange('telegram_username', e.target.value)}
                placeholder="@username"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Фото</h3>
          <div className="space-y-2">
            <Label htmlFor="photo_url">URL фотографии</Label>
            <Input
              id="photo_url"
              value={profileData.photo_url}
              onChange={(e) => handleChange('photo_url', e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
            {profileData.photo_url && (
              <div className="mt-4">
                <img 
                  src={profileData.photo_url} 
                  alt="Фото профиля" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                />
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">О себе</h3>
          <div className="space-y-2">
            <Label htmlFor="bio">Расскажите о себе</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Сам инвестирую&nbsp; - поэтому для меня главное - это получение пассивного дохода..."
              rows={4}
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Социальные сети</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram_channel">Telegram-канал</Label>
              <Input
                id="telegram_channel"
                value={profileData.telegram_channel}
                onChange={(e) => handleChange('telegram_channel', e.target.value)}
                placeholder="https://t.me/smartinvestr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube_channel">Youtube-канал</Label>
              <Input
                id="youtube_channel"
                value={profileData.youtube_channel}
                onChange={(e) => handleChange('youtube_channel', e.target.value)}
                placeholder="https://youtube.com/@channel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vk_group">VK-группа</Label>
              <Input
                id="vk_group"
                value={profileData.vk_group}
                onChange={(e) => handleChange('vk_group', e.target.value)}
                placeholder="https://vk.com/group"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
          <Icon name="Info" size={16} />
          <p>Поля, отмеченные *, обязательны для заполнения</p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving || !profileData.surname || !profileData.first_name || !profileData.phone || !profileData.telegram_username}
          className="w-full"
        >
          {saving ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить профиль
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BrokerProfileSettings;
