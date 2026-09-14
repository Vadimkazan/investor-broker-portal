import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface HowItWorksSectionProps {
  onRegisterClick?: () => void;
}

const HowItWorksSection = ({ onRegisterClick }: HowItWorksSectionProps) => {
  const steps = [
    {
      step: '01',
      icon: 'Target',
      title: 'Выбирайте стратегию',
      description: 'Пройдите тест и получите персональный инвестиционный план',
      benefit: 'Получите персональный инвестиционный план за 5 минут',
      color: 'from-blue-500 to-blue-600'
    },
    {
      step: '02',
      icon: 'Search',
      title: 'Найдите идеальный объект',
      description: 'Умный каталог с актуальными проверенными предложениями',
      benefit: 'Фильтруйте объекты по доходности, сумме входа, локации',
      color: 'from-purple-500 to-purple-600'
    },
    {
      step: '03',
      icon: 'Handshake',
      title: 'Совершите сделку',
      description: 'Рейтинги, отзывы и полная юридическая защита',
      benefit: 'Сравнивайте рейтинги брокеров и читайте реальные отзывы',
      color: 'from-pink-500 to-pink-600'
    },
    {
      step: '04',
      icon: 'LineChart',
      title: 'Отслеживайте рост',
      description: 'Аналитика денежного потока и стоимости актива в личном кабинете',
      benefit: 'Отслеживайте доходность портфеля в личном кабинете 24/7',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
            От мечты к доходу — за 4 простых шага
          </h2>
          <p className="text-xl text-muted-foreground">
            Инвестируйте в недвижимость без сложностей и рисков
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${item.color}`}></div>
              <CardHeader>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon name={item.icon} size={32} className="text-white" />
                </div>
                <div className="text-5xl font-bold text-muted-foreground/20 absolute top-4 right-4">
                  {item.step}
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{item.description}</p>
                <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <Icon name="CheckCircle2" size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-primary">{item.benefit}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button size="lg" className="bg-primary text-white hover:bg-primary/90 text-lg px-8 py-6" onClick={onRegisterClick}>
            <Icon name="Rocket" className="mr-2" size={20} />
            Начать инвестировать
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
