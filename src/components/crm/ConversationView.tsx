import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { ConversationDetail, CrmMessage, Manager, STATUS_LABELS } from '@/services/crm';

interface Props {
  conversation: ConversationDetail | null;
  messages: CrmMessage[];
  managers: Manager[];
  loading: boolean;
  sending: boolean;
  onSend: (text: string) => void;
  onPatch: (patch: Record<string, unknown>) => void;
}

const formatStamp = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const ConversationView = ({ conversation, messages, managers, loading, sending, onSend, onPatch }: Props) => {
  const [text, setText] = useState('');
  const [contact, setContact] = useState({ display_name: '', phone: '', email: '', note: '' });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      setContact({
        display_name: conversation.contactName || '',
        phone: conversation.phone || '',
        email: conversation.email || '',
        note: conversation.note || '',
      });
    }
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        {loading ? 'Загружаем…' : 'Выберите диалог слева'}
      </div>
    );
  }

  const submit = () => {
    const t = text.trim();
    if (!t || sending) return;
    onSend(t);
    setText('');
  };

  return (
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="font-semibold truncate">{conversation.contactName}</h2>
            <p className="text-xs text-muted-foreground">
              {conversation.channelLabel}
              {conversation.username ? ` · @${conversation.username}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={conversation.status} onValueChange={v => onPatch({ status: v })}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={conversation.assigneeId ? String(conversation.assigneeId) : 'none'}
              onValueChange={v => onPatch({ assignee_id: v === 'none' ? null : Number(v) })}
            >
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Ответственный" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без ответственного</SelectItem>
                {managers.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  m.direction === 'out'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <div className={`text-[10px] mt-1 flex items-center gap-1 ${
                  m.direction === 'out' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {m.senderName && <span>{m.senderName} ·</span>}
                  <span>{formatStamp(m.createdAt)}</span>
                  {m.direction === 'out' && m.deliveryStatus === 'failed' && (
                    <span className="text-red-200 font-medium">· не доставлено</span>
                  )}
                </div>
                {m.error && <p className="text-[10px] mt-1 text-red-200">{m.error}</p>}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t flex gap-2 items-end">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Напишите ответ клиенту…"
            rows={2}
            className="resize-none"
          />
          <Button onClick={submit} disabled={sending || !text.trim()} className="h-10">
            <Icon name={sending ? 'Loader2' : 'Send'} size={16} className={sending ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <aside className="w-64 border-l p-4 space-y-3 hidden lg:block overflow-y-auto">
        <h3 className="font-medium text-sm">Карточка клиента</h3>
        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-muted-foreground">Имя</label>
            <Input
              value={contact.display_name}
              onChange={e => setContact(p => ({ ...p, display_name: e.target.value }))}
              onBlur={() => onPatch({ display_name: contact.display_name })}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Телефон</label>
            <Input
              value={contact.phone}
              onChange={e => setContact(p => ({ ...p, phone: e.target.value }))}
              onBlur={() => onPatch({ phone: contact.phone })}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Email</label>
            <Input
              value={contact.email}
              onChange={e => setContact(p => ({ ...p, email: e.target.value }))}
              onBlur={() => onPatch({ email: contact.email })}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Заметка</label>
            <Textarea
              value={contact.note}
              onChange={e => setContact(p => ({ ...p, note: e.target.value }))}
              onBlur={() => onPatch({ note: contact.note })}
              rows={4}
              className="text-sm resize-none"
            />
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ConversationView;
