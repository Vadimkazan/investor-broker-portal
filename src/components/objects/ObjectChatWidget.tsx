import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useChatGPT } from '@/components/extensions/chatgpt-polza/useChatGPT';
import { InvestmentObject, PROPERTY_TYPE_LABELS } from '@/types/investment-object';

const API_URL = 'https://functions.poehali.dev/9900f4e9-9b8a-4671-9500-d2d0019e24b4';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ObjectChatWidgetProps {
  object: InvestmentObject;
}

const buildSystemPrompt = (object: InvestmentObject): string => {
  const lines = [
    'Ты — консультант по инвестициям в недвижимость. Отвечай на вопросы инвестора ТОЛЬКО об этом конкретном объекте, кратко и по делу, на русском языке.',
    'Если вопрос не относится к объекту или инвестициям в недвижимость — вежливо скажи, что можешь консультировать только по этому объекту.',
    '',
    'Данные объекта:',
    `Название: ${object.title}`,
    `Тип: ${PROPERTY_TYPE_LABELS[object.type] || object.type}`,
    `Город: ${object.city}`,
    `Адрес: ${object.address}`,
    `Площадь: ${object.area} м²`,
    `Стоимость: ${object.price?.toLocaleString('ru-RU')} ₽`,
    `Доходность: ${object.yield}% годовых`,
    `Срок окупаемости: ${object.paybackPeriod} лет`,
  ];
  if (object.minInvestment) lines.push(`Минимальная сумма входа: ${object.minInvestment.toLocaleString('ru-RU')} ₽`);
  if (object.monthlyPayment) lines.push(`Ежемесячный платёж: ${object.monthlyPayment.toLocaleString('ru-RU')} ₽`);
  if (object.strategy) lines.push(`Стратегия: ${object.strategy}`);
  if (object.dealCycle) lines.push(`Цикл сделки: ${object.dealCycle}`);
  if (object.description) lines.push(`Описание: ${object.description}`);
  return lines.join('\n');
};

const ObjectChatWidget = ({ object }: ObjectChatWidgetProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { generate, isLoading } = useChatGPT({ apiUrl: API_URL });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const apiMessages = [
      { role: 'system' as const, content: buildSystemPrompt(object) },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];

    const result = await generate({ messages: apiMessages, model: 'openai/gpt-4o-mini', temperature: 0.5 });

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.success && result.content ? result.content : 'Не удалось получить ответ. Попробуйте ещё раз.',
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
    'Какая доходность у этого объекта?',
    'Какие риски у этой инвестиции?',
    'Как быстро окупится вложение?',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Sparkles" size={18} className="text-primary" />
          Задайте вопрос об объекте
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ИИ-ассистент ответит на вопросы про этот объект: доходность, риски, условия входа.
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
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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

        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Например: какая ожидаемая доходность?"
            rows={1}
            className="resize-none min-h-[40px]"
          />
          <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Icon name="Send" size={18} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ObjectChatWidget;
