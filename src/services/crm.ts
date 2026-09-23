const CRM_URL = 'https://functions.poehali.dev/6355e82d-9e2f-46ae-aff7-9e71c49f4b28';

export type ConversationStatus = 'new' | 'in_progress' | 'waiting' | 'closed';

export interface Conversation {
  id: number;
  channel: string;
  channelLabel: string;
  username: string | null;
  status: ConversationStatus;
  assigneeId: number | null;
  assigneeName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
  contactId: number;
  contactName: string;
  phone: string | null;
  email: string | null;
  objectId: number | null;
}

export interface CrmMessage {
  id: number;
  direction: 'in' | 'out';
  body: string;
  createdAt: string;
  deliveryStatus: string;
  error: string | null;
  senderName: string | null;
  attachment: string | null;
}

export interface ConversationDetail extends Conversation {
  externalId: string;
  note: string | null;
  objectTitle: string | null;
}

export interface Manager {
  id: number;
  name: string;
}

export const STATUS_LABELS: Record<ConversationStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  waiting: 'Ждём клиента',
  closed: 'Закрыт',
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CRM_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.detail || 'Ошибка запроса');
  return data as T;
}

export const crmApi = {
  listConversations(filters: { status?: string; channel?: string; assignee_id?: string; search?: string } = {}) {
    const q = new URLSearchParams({ action: 'list' });
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== 'all') q.set(k, v);
    });
    return call<{ items: Conversation[]; counters: Record<string, { total: number; unread: number }> }>(`?${q}`);
  },

  getMessages(conversationId: number) {
    return call<{ conversation: ConversationDetail; messages: CrmMessage[] }>(
      `?action=messages&conversation_id=${conversationId}`,
    );
  },

  reply(conversationId: number, text: string, senderUserId?: number) {
    return call<{ messageId: number; status: string }>('?action=reply', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, text, sender_user_id: senderUserId }),
    });
  },

  update(conversationId: number, patch: Record<string, unknown>) {
    return call<{ message: string }>('?action=update', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, ...patch }),
    });
  },

  createConversation(data: {
    display_name: string;
    phone?: string;
    email?: string;
    note?: string;
    channel?: string;
    telegram_id?: string;
    assignee_id?: number | null;
  }) {
    return call<{ conversationId: number; existing: boolean }>('?action=create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getManagers() {
    return call<Manager[]>('?action=managers');
  },
};

export default crmApi;