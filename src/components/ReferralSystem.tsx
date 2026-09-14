import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { generateReferralCode, buildUtmUrl } from '@/utils/investmentStrategies';

interface ReferralSystemProps {
  brokerId: string;
  brokerName: string;
}

const ReferralSystem = ({ brokerId, brokerName }: ReferralSystemProps) => {
  const [referralCode] = useState(generateReferralCode(brokerId));
  const [copied, setCopied] = useState(false);

  const baseUrl = window.location.origin;

  const campaigns = [
    {
      name: 'Telegram канал',
      source: 'telegram',
      medium: 'social',
      campaign: 'channel_promo',
      description: 'Для публикации в вашем Telegram канале'
    },
    {
      name: 'Instagram',
      source: 'instagram',
      medium: 'social',
      campaign: 'instagram_stories',
      description: 'Для Stories и постов в Instagram'
    },
    {
      name: 'ВКонтакте',
      source: 'vk',
      medium: 'social',
      campaign: 'vk_group',
      description: 'Для группы ВКонтакте'
    },
    {
      name: 'Email рассылка',
      source: 'email',
      medium: 'email',
      campaign: 'newsletter',
      description: 'Для рассылки по базе подписчиков'
    },
    {
      name: 'WhatsApp',
      source: 'whatsapp',
      medium: 'messenger',
      campaign: 'direct_message',
      description: 'Для личных сообщений в WhatsApp'
    }
  ];

  const [stats] = useState({
    totalClicks: 127,
    conversions: 8,
    activeInvestors: 5,
    revenue: 2400000
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateInviteUrl = (source: string, medium: string, campaign: string) => {
    return buildUtmUrl(baseUrl, source, medium, campaign, referralCode);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Реферальная система</h2>
        <p className="text-muted-foreground">Приглашайте инвесторов и отслеживайте эффективность каналов</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Всего переходов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Конверсий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversions}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.conversions / stats.totalClicks) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Активных инвесторов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInvestors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Доход от рефералов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₽{(stats.revenue / 1000000).toFixed(1)}M</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ваш реферальный код</CardTitle>
          <CardDescription>Используйте этот код для отслеживания приглашённых инвесторов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => copyToClipboard(referralCode)}
            >
              <Icon name={copied ? "Check" : "Copy"} size={18} />
              {copied ? 'Скопировано' : 'Копировать'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UTM-ссылки для каналов</CardTitle>
          <CardDescription>Готовые ссылки с метками для отслеживания эффективности каждого канала</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const url = generateInviteUrl(campaign.source, campaign.medium, campaign.campaign);
              return (
                <div key={campaign.name} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    </div>
                    <Badge variant="secondary">{campaign.source}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={url}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(url)}
                    >
                      <Icon name="Copy" size={16} />
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground font-mono">
                    utm_source={campaign.source} | utm_medium={campaign.medium} | utm_campaign={campaign.campaign}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Создать пользовательскую UTM-ссылку</CardTitle>
          <CardDescription>Настройте параметры для конкретной кампании</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Input placeholder="facebook" />
              </div>
              <div className="space-y-2">
                <Label>Medium</Label>
                <Input placeholder="paid_ads" />
              </div>
              <div className="space-y-2">
                <Label>Campaign</Label>
                <Input placeholder="spring_sale" />
              </div>
            </div>
            <Button className="gap-2">
              <Icon name="Link" size={18} />
              Сгенерировать ссылку
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem;