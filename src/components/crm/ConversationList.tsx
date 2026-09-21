import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Conversation, STATUS_LABELS } from '@/services/crm';

const CHANNEL_ICON: Record<string, string> = {
  telegram: 'Send',
  max: 'MessageCircle',
};

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  waiting: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-600',
};

const formatTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

interface Props {
  items: Conversation[];
  activeId: number | null;
  loading: boolean;
  search: string;
  statusFilter: string;
  channelFilter: string;
  onSearch: (v: string) => void;
  onStatusFilter: (v: string) => void;
  onChannelFilter: (v: string) => void;
  onSelect: (id: number) => void;
}

const ConversationList = ({
  items, activeId, loading, search, statusFilter, channelFilter,
  onSearch, onStatusFilter, onChannelFilter, onSelect,
}: Props) => (
  <div className="flex flex-col h-full border-r bg-background">
    <div className="p-3 space-y-2 border-b">
      <div className="relative">
        <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Поиск по имени или тексту" value={search} onChange={e => onSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={onStatusFilter}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="waiting">Ждём клиента</SelectItem>
            <SelectItem value="closed">Закрытые</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={onChannelFilter}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все каналы</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="max">MAX</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto">
      {loading && items.length === 0 && (
        <div className="p-6 text-center text-sm text-muted-foreground">Загружаем диалоги…</div>
      )}
      {!loading && items.length === 0 && (
        <div className="p-6 text-center text-sm text-muted-foreground">
          Диалогов пока нет. Они появятся, как только клиент напишет боту.
        </div>
      )}
      {items.map(c => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`w-full text-left px-3 py-3 border-b hover:bg-muted/50 transition-colors ${
            activeId === c.id ? 'bg-muted' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <Icon name={CHANNEL_ICON[c.channel] || 'MessageSquare'} size={14} className="text-muted-foreground shrink-0" />
              <span className="font-medium text-sm truncate">{c.contactName}</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{formatTime(c.lastMessageAt)}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate mb-2">{c.lastMessage || 'Нет сообщений'}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${STATUS_STYLE[c.status] || ''}`}>
              {STATUS_LABELS[c.status] || c.status}
            </Badge>
            {c.assigneeName && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[110px]">{c.assigneeName}</span>
            )}
            {c.unread > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 min-w-5 text-center">
                {c.unread}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default ConversationList;
