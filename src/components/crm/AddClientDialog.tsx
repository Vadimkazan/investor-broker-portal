import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Manager } from '@/services/crm';

interface Props {
  open: boolean;
  managers: Manager[];
  saving: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: {
    display_name: string;
    phone?: string;
    email?: string;
    note?: string;
    channel?: string;
    telegram_id?: string;
    assignee_id?: number | null;
  }) => void;
}

const empty = {
  display_name: '',
  phone: '',
  email: '',
  note: '',
  channel: 'manual',
  telegram_id: '',
  assignee_id: 'none',
};

const AddClientDialog = ({ open, managers, saving, onOpenChange, onCreate }: Props) => {
  const [form, setForm] = useState(empty);

  const set = (k: keyof typeof empty, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.display_name.trim() || saving) return;
    onCreate({
      display_name: form.display_name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      note: form.note.trim() || undefined,
      channel: form.channel,
      telegram_id: form.telegram_id.trim() || undefined,
      assignee_id: form.assignee_id === 'none' ? null : Number(form.assignee_id),
    });
    setForm(empty);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Новый клиент</DialogTitle>
          <DialogDescription>
            Добавьте клиента, который позвонил или написал вам напрямую.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Имя клиента *</Label>
            <Input value={form.display_name} onChange={e => set('display_name', e.target.value)} placeholder="Иван Петров" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Телефон</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 900 000-00-00" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="mail@example.ru" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Канал связи</Label>
            <Select value={form.channel} onValueChange={v => set('channel', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Только телефон / email</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="max">MAX</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.channel !== 'manual' && (
            <div>
              <Label className="text-xs">ID чата в мессенджере</Label>
              <Input value={form.telegram_id} onChange={e => set('telegram_id', e.target.value)} placeholder="123456789" />
              <p className="text-[11px] text-muted-foreground mt-1">
                Нужен, чтобы писать клиенту из системы. Если не знаете — оставьте пустым.
              </p>
            </div>
          )}
          <div>
            <Label className="text-xs">Ответственный</Label>
            <Select value={form.assignee_id} onValueChange={v => set('assignee_id', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без ответственного</SelectItem>
                {managers.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Заметка</Label>
            <Textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3}
              placeholder="О чём говорили, что интересует" className="resize-none" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={submit} disabled={saving || !form.display_name.trim()}>
            {saving && <Icon name="Loader2" size={15} className="mr-1 animate-spin" />}
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
