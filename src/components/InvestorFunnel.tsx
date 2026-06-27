import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { api, BrokerInvestor } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface InvestorFunnelProps {
  brokerId: string;
}

type InvestorStage = 'lead' | 'consultation' | 'analysis' | 'offer_sent' | 'negotiation' | 'deal_preparation' | 'active' | 'inactive';

const stageLabels: Record<InvestorStage, string> = {
  lead: 'Лид',
  consultation: 'Консультация',
  analysis: 'Анализ',
  offer_sent: 'Отправлено предложение',
  negotiation: 'Переговоры',
  deal_preparation: 'Подготовка сделки',
  active: 'Активный',
  inactive: 'Неактивный'
};

const stageColors: Record<InvestorStage, string> = {
  lead: 'bg-gray-500',
  consultation: 'bg-blue-500',
  analysis: 'bg-purple-500',
  offer_sent: 'bg-yellow-500',
  negotiation: 'bg-orange-500',
  deal_preparation: 'bg-green-400',
  active: 'bg-green-600',
  inactive: 'bg-gray-400'
};

const InvestorFunnel = ({ brokerId }: InvestorFunnelProps) => {
  const { toast } = useToast();
  const [investors, setInvestors] = useState<BrokerInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<BrokerInvestor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [newInvestor, setNewInvestor] = useState({
    firstName: '', lastName: '', email: '', phone: '', budget: '', source: ''
  });

  const loadInvestors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getInvestors(Number(brokerId));
      setInvestors(data);
    } catch {
      toast({ title: 'Не удалось загрузить инвесторов', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [brokerId, toast]);

  useEffect(() => { loadInvestors(); }, [loadInvestors]);

  const groupedByStage = investors.reduce((acc, inv) => {
    const stage = inv.stage as InvestorStage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(inv);
    return acc;
  }, {} as Record<InvestorStage, BrokerInvestor[]>);

  const handleAddInvestor = async () => {
    if (!newInvestor.firstName.trim()) {
      toast({ title: 'Укажите имя инвестора', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const created = await api.createInvestor({
        broker_id: Number(brokerId),
        first_name: newInvestor.firstName,
        last_name: newInvestor.lastName,
        email: newInvestor.email,
        phone: newInvestor.phone,
        budget: parseInt(newInvestor.budget) || 0,
        source: newInvestor.source,
        stage: 'lead',
        timeline: [{
          date: new Date().toISOString(),
          action: 'Регистрация',
          details: `Добавлен вручную, источник: ${newInvestor.source || 'не указан'}`
        }]
      });
      setInvestors(prev => [created, ...prev]);
      setShowAddModal(false);
      setNewInvestor({ firstName: '', lastName: '', email: '', phone: '', budget: '', source: '' });
      toast({ title: 'Инвестор добавлен' });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка сохранения', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const moveToStage = async (investor: BrokerInvestor, newStage: InvestorStage) => {
    const newTimeline = [
      ...investor.timeline,
      { date: new Date().toISOString(), action: 'Смена этапа', details: `Переведён на этап: ${stageLabels[newStage]}` }
    ];
    try {
      const updated = await api.updateInvestor(Number(investor.id), { stage: newStage, timeline: newTimeline });
      setInvestors(prev => prev.map(i => i.id === investor.id ? updated : i));
      setSelectedInvestor(updated);
      toast({ title: 'Этап изменён' });
    } catch {
      toast({ title: 'Ошибка изменения этапа', variant: 'destructive' });
    }
  };

  const saveNote = async (investor: BrokerInvestor) => {
    const newTimeline = [
      ...investor.timeline,
      { date: new Date().toISOString(), action: 'Добавлена заметка', details: noteDraft }
    ];
    try {
      const updated = await api.updateInvestor(Number(investor.id), { notes: noteDraft, timeline: newTimeline });
      setInvestors(prev => prev.map(i => i.id === investor.id ? updated : i));
      setSelectedInvestor(updated);
      toast({ title: 'Заметка сохранена' });
    } catch {
      toast({ title: 'Ошибка сохранения заметки', variant: 'destructive' });
    }
  };

  const openInvestor = (investor: BrokerInvestor) => {
    setSelectedInvestor(investor);
    setNoteDraft(investor.interaction.notes || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Воронка инвесторов</h2>
          <p className="text-muted-foreground">Управление клиентами по этапам сделки</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Icon name="UserPlus" size={18} />
              Добавить инвестора
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый инвестор</DialogTitle>
              <DialogDescription>Добавьте информацию о потенциальном клиенте</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Имя *</Label>
                  <Input value={newInvestor.firstName} onChange={(e) => setNewInvestor({ ...newInvestor, firstName: e.target.value })} placeholder="Иван" />
                </div>
                <div className="space-y-2">
                  <Label>Фамилия</Label>
                  <Input value={newInvestor.lastName} onChange={(e) => setNewInvestor({ ...newInvestor, lastName: e.target.value })} placeholder="Петров" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newInvestor.email} onChange={(e) => setNewInvestor({ ...newInvestor, email: e.target.value })} placeholder="ivan@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input value={newInvestor.phone} onChange={(e) => setNewInvestor({ ...newInvestor, phone: e.target.value })} placeholder="+7 (999) 123-45-67" />
              </div>
              <div className="space-y-2">
                <Label>Бюджет (₽)</Label>
                <Input type="number" value={newInvestor.budget} onChange={(e) => setNewInvestor({ ...newInvestor, budget: e.target.value })} placeholder="2000000" />
              </div>
              <div className="space-y-2">
                <Label>Источник</Label>
                <Input value={newInvestor.source} onChange={(e) => setNewInvestor({ ...newInvestor, source: e.target.value })} placeholder="Telegram, Instagram, Сайт..." />
              </div>
              <Button onClick={handleAddInvestor} className="w-full" disabled={saving}>
                {saving && <Icon name="Loader2" size={16} className="animate-spin mr-2" />}
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Icon name="Loader2" size={32} className="mx-auto text-primary animate-spin mb-2" />
          <p className="text-muted-foreground">Загрузка инвесторов...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {(['lead', 'consultation', 'analysis', 'offer_sent', 'negotiation', 'deal_preparation', 'active', 'inactive'] as InvestorStage[]).map(stage => (
            <Card key={stage}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className={stageColors[stage]}>{stageLabels[stage]}</Badge>
                  <span className="text-sm font-semibold">{groupedByStage[stage]?.length || 0}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {groupedByStage[stage]?.map(investor => (
                  <div
                    key={investor.id}
                    className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openInvestor(investor)}
                  >
                    <p className="font-semibold text-sm">
                      {investor.personalInfo.firstName} {investor.personalInfo.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ₽{(investor.investmentProfile.budget / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-muted-foreground">{investor.interaction.source}</p>
                  </div>
                ))}
                {(!groupedByStage[stage] || groupedByStage[stage].length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-2">Пусто</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={selectedInvestor !== null} onOpenChange={() => setSelectedInvestor(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedInvestor?.personalInfo.firstName} {selectedInvestor?.personalInfo.lastName}
            </DialogTitle>
            <DialogDescription>Полная информация об инвесторе</DialogDescription>
          </DialogHeader>
          {selectedInvestor && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm">{selectedInvestor.personalInfo.email || '—'}</p>
                </div>
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <p className="text-sm">{selectedInvestor.personalInfo.phone || '—'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Текущий этап</Label>
                <Select
                  value={selectedInvestor.stage}
                  onValueChange={(value) => moveToStage(selectedInvestor, value as InvestorStage)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(stageLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Инвестиционный профиль</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Бюджет</p>
                    <p className="font-semibold">₽{selectedInvestor.investmentProfile.budget.toLocaleString('ru-RU')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Источник</p>
                    <p className="font-semibold">{selectedInvestor.interaction.source || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Активных инвестиций</p>
                    <p className="font-semibold">{selectedInvestor.portfolio.activeInvestments}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Всего инвестировано</p>
                    <p className="font-semibold">₽{selectedInvestor.portfolio.totalInvested.toLocaleString('ru-RU')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Заметки</Label>
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Добавьте заметки о клиенте..."
                  rows={4}
                />
                <Button size="sm" onClick={() => saveNote(selectedInvestor)} disabled={noteDraft === selectedInvestor.interaction.notes}>
                  <Icon name="Save" size={14} className="mr-2" />
                  Сохранить заметку
                </Button>
              </div>

              <div>
                <h3 className="font-semibold mb-3">История взаимодействий</h3>
                <div className="space-y-2">
                  {selectedInvestor.timeline.slice().reverse().map((event, idx) => (
                    <div key={idx} className="border-l-2 border-primary pl-3 py-2">
                      <p className="text-sm font-semibold">{event.action}</p>
                      <p className="text-xs text-muted-foreground">{event.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.date ? new Date(event.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvestorFunnel;
