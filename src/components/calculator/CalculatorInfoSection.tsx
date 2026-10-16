import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    q: 'Как рассчитать доходность инвестиций в недвижимость?',
    a: 'Годовая доходность — это доход за год, делённый на сумму вложений и умноженный на 100%. Например, при вложении 1 000 000 рублей и доходе 150 000 рублей в год доходность составит 15% годовых. Калькулятор считает рост капитала с ежемесячным начислением: итоговая сумма = вложения × (1 + доходность / 12) в степени числа месяцев.',
  },
  {
    q: 'Как рассчитать срок окупаемости недвижимости?',
    a: 'Срок окупаемости — это стоимость объекта, делённая на годовой доход от него. Если объект стоит 1 000 000 рублей и приносит 100 000 рублей в год, он окупится за 10 лет. Чем выше доходность, тем быстрее окупаемость. Калькулятор считает срок окупаемости именно так: сумма вложений делится на годовой доход при выбранной доходности.',
  },
  {
    q: 'Что такое ROI и чем он отличается от доходности?',
    a: 'ROI — это отношение чистой прибыли ко всей сумме вложений за весь срок, в процентах. Доходность обычно указывают за год, а ROI показывает результат за весь выбранный период. Поэтому при сроке в несколько лет ROI будет больше годовой доходности.',
  },
  {
    q: 'Гарантирует ли калькулятор получение указанной прибыли?',
    a: 'Нет, калькулятор даёт прогноз на основе заданных вами условий. Реальный доход зависит от заполняемости объекта, арендных ставок, налогов и расходов на содержание. Для оценки конкретного объекта смотрите ожидаемую доходность и срок окупаемости в карточке объекта в каталоге.',
  },
];

const CalculatorInfoSection = () => {
  useEffect(() => {
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.dataset.calculatorFaq = '1';
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
    document.head.appendChild(ld);
    return () => ld.remove();
  }, []);

  return (
    <section className="mt-12 space-y-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Как считается доходность и окупаемость</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            <span className="font-semibold text-foreground">Доходность</span> показывает, сколько вы зарабатываете на вложенных деньгах за год. Калькулятор учитывает ежемесячное начисление: прибыль каждого месяца добавляется к капиталу и тоже приносит доход.
          </p>
          <p>
            <span className="font-semibold text-foreground">Чистая прибыль</span> — разница между итоговой суммой и вашими вложениями. <span className="font-semibold text-foreground">ROI</span> — эта прибыль в процентах от вложений за весь срок.
          </p>
          <p>
            <span className="font-semibold text-foreground">Окупаемость</span> — время, за которое доход вернёт вложенную сумму. Для объекта её считают как цену, делённую на годовой доход. Калькулятор показывает окупаемость по этой формуле при выбранной доходности.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Частые вопросы о расчёте доходности</h2>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} value={`calc-faq-${i}`}>
              <AccordionTrigger className="text-left text-base sm:text-lg">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default CalculatorInfoSection;
