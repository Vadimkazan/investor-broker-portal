import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useChatGPT } from '@/components/extensions/chatgpt-polza/useChatGPT';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRoles, ROLE_LABELS } from '@/utils/roles';
import ManagerContacts from './ManagerContacts';

const API_URL = 'https://functions.poehali.dev/9900f4e9-9b8a-4671-9500-d2d0019e24b4';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  showManager?: boolean;
}

const MANAGER_TAG = '[MANAGER]';

const MANAGER_INTENT = /(менеджер|человек|живой|оператор|специалист|консультац|перезвон|позвон|связать|свяж|телефон|контакт|whatsapp|ватсап|telegram|телеграм|подробнее об объекте|оставить заявку|заявк)/i;

const SYSTEM_PROMPT = `Ты — ИИ-консультант платформы AREALVEST, помогаешь всем посетителям сайта: инвесторам, брокерам и гостям.

О платформе AREALVEST:
- Это платформа для инвестиций в недвижимость: инвесторы вкладывают деньги в объекты недвижимости через брокеров.
- Инвесторы могут смотреть каталог объектов (раздел "Объекты"), фильтровать по городу, типу, доходности, добавлять в избранное, оставлять заявки брокеру.
- Брокеры добавляют свои объекты недвижимости, ведут воронку инвесторов, отслеживают сделки, есть реферальная программа.
- Есть калькулятор доходности инвестиций.
- Регистрация доступна для роли "инвестор" или "брокер" — кнопка "Войти" в шапке сайта.
- После регистрации у пользователя появляется личный кабинет с вкладками: портфель, финансы, мои объекты, обучение, настройки (для инвестора) или объекты, инвесторы, реферальная программа, настройки (для брокера).

Твоя задача:
- Отвечай кратко и по делу, на русском языке.
- Помогай разобраться, как пользоваться сайтом: где что найти, как зарегистрироваться, как оставить заявку на объект, как работает калькулятор.
- Если спрашивают про конкретный объект недвижимости — посоветуй открыть карточку объекта, там есть отдельный ИИ-консультант по этому объекту.
- Если вопрос не связан с платформой или инвестициями в недвижимость — вежливо скажи, что специализируешься на вопросах о платформе AREALVEST и инвестициях в недвижимость.
- Не выдумывай точные цифры (цены, доходности) — это индивидуально для каждого объекта, направляй в каталог объектов.

Передача менеджеру:
- Если клиент хочет поговорить с человеком, просит консультацию менеджера, хочет оставить заявку, узнать подробнее об объекте, продолжить общение с менеджером, или задаёт вопрос, на который ты не можешь ответить — предложи связаться с менеджером напрямую.
- В таком случае напиши короткий ответ и в САМОМ КОНЦЕ сообщения добавь отдельной строкой тег ${MANAGER_TAG} — интерфейс сам покажет кнопки Telegram, MAX, WhatsApp и «Позвонить».
- Никогда не пиши ссылки и номер телефона текстом и не описывай кнопки словами — просто ставь тег ${MANAGER_TAG}.
- Не проси клиента заполнить форму или оставить заявку на сайте, если он прямо хочет связаться с менеджером.`;

const SiteAssistantWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showManagerPanel, setShowManagerPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { generate, isLoading } = useChatGPT({ apiUrl: API_URL });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const roleContext = user
      ? `\n\nТекущий пользователь авторизован, его роли: ${getUserRoles(user).map((r) => ROLE_LABELS[r]).join(', ')}, имя: ${user.name}.`
      : '\n\nТекущий посетитель не авторизован (гость).';

    const apiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + roleContext },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    const result = await generate({ messages: apiMessages, model: 'gpt-5.4-mini', temperature: 0.5 });

    const raw = result.success && result.content ? result.content : '';
    const failed = !raw;
    const tagged = raw.includes(MANAGER_TAG);
    const content = tagged ? raw.replaceAll(MANAGER_TAG, '').trim() : raw;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: failed
          ? 'Не удалось получить ответ. Попробуйте ещё раз чуть позже или свяжитесь с менеджером напрямую.'
          : content || 'Могу передать вас менеджеру.',
        showManager: failed || tagged || MANAGER_INTENT.test(text),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'Как начать инвестировать?',
    'Как стать брокером на платформе?',
    'Как работает калькулятор доходности?',
  ];

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Открыть ИИ-консультанта"
        >
          <Icon name="MessageCircle" size={26} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 max-w-96 h-[min(600px,calc(100vh-3rem))] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Icon name="Sparkles" size={18} />
              <span className="font-semibold text-sm">ИИ-консультант AREALVEST</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
              aria-label="Закрыть"
            >
              <Icon name="X" size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Привет! Я помогу разобраться с платформой: как инвестировать, как стать брокером, как пользоваться сайтом.
                </p>
                <div className="flex flex-col gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setInput(q)}
                      className="text-left text-sm px-3 py-2 rounded-md border bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowManagerPanel((v) => !v)}
                    className="flex items-center justify-between gap-2 text-left text-sm px-3 py-2 rounded-md border bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Icon name="Headset" size={15} />
                      Связаться с менеджером
                    </span>
                    <Icon name={showManagerPanel ? 'ChevronUp' : 'ChevronDown'} size={15} />
                  </button>
                </div>
                {showManagerPanel && (
                  <ManagerContacts title="Выберите удобный способ связи с менеджером 👇" />
                )}
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                  {msg.role === 'assistant' && msg.showManager && <ManagerContacts />}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  Думаю...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Задайте вопрос о платформе..."
              rows={1}
              className="resize-none min-h-[40px]"
            />
            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default SiteAssistantWidget;