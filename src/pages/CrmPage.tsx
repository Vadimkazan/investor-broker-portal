import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ConversationList from '@/components/crm/ConversationList';
import ConversationView from '@/components/crm/ConversationView';
import crmApi, { Conversation, ConversationDetail, CrmMessage, Manager } from '@/services/crm';

const CrmPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [items, setItems] = useState<Conversation[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<CrmMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  const loadList = useCallback(async () => {
    try {
      const data = await crmApi.listConversations({
        status: statusFilter,
        channel: channelFilter,
        search: search || undefined,
      });
      setItems(data.items);
    } catch (e) {
      toast({ title: 'Не удалось загрузить диалоги', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter, search, toast]);

  const loadDetail = useCallback(async (id: number) => {
    try {
      const data = await crmApi.getMessages(id);
      setDetail(data.conversation);
      setMessages(data.messages);
    } catch {
      toast({ title: 'Не удалось открыть диалог', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    crmApi.getManagers().then(setManagers).catch(() => setManagers([]));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      loadList();
      if (activeId) loadDetail(activeId);
    }, 15000);
    return () => clearInterval(t);
  }, [loadList, loadDetail, activeId]);

  const select = (id: number) => {
    setActiveId(id);
    loadDetail(id);
    setItems(prev => prev.map(c => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const handleSend = async (text: string) => {
    if (!activeId) return;
    setSending(true);
    try {
      await crmApi.reply(activeId, text, user?.id);
      await loadDetail(activeId);
      loadList();
    } catch (e) {
      toast({
        title: 'Сообщение не отправлено',
        description: e instanceof Error ? e.message : 'Проверьте настройки бота',
        variant: 'destructive',
      });
      await loadDetail(activeId);
    } finally {
      setSending(false);
    }
  };

  const handlePatch = async (patch: Record<string, unknown>) => {
    if (!activeId) return;
    try {
      await crmApi.update(activeId, patch);
      await loadDetail(activeId);
      loadList();
    } catch {
      toast({ title: 'Не удалось сохранить изменения', variant: 'destructive' });
    }
  };

  const totalUnread = items.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="px-4 py-3 border-b flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <Icon name="ArrowLeft" size={16} className="mr-1" />Админка
          </Button>
          <div>
            <h1 className="font-semibold leading-tight">Центр общения</h1>
            <p className="text-xs text-muted-foreground">
              {items.length} диалогов{totalUnread > 0 ? ` · ${totalUnread} непрочитанных` : ''}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadList(); if (activeId) loadDetail(activeId); }}>
          <Icon name="RefreshCw" size={15} className="mr-1" />Обновить
        </Button>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="w-80 shrink-0 hidden md:block">
          <ConversationList
            items={items}
            activeId={activeId}
            loading={loading}
            search={search}
            statusFilter={statusFilter}
            channelFilter={channelFilter}
            onSearch={setSearch}
            onStatusFilter={setStatusFilter}
            onChannelFilter={setChannelFilter}
            onSelect={select}
          />
        </div>
        <ConversationView
          conversation={detail}
          messages={messages}
          managers={managers}
          loading={loading}
          sending={sending}
          onSend={handleSend}
          onPatch={handlePatch}
        />
      </div>
    </div>
  );
};

export default CrmPage;
