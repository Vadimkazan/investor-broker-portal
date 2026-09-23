import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface GrowthSectionProps {
  isVisible: boolean;
}

const GrowthSection = ({ isVisible }: GrowthSectionProps) => {
  const features = [
    {
      icon: 'Blocks',
      title: 'Инвестиционный конструктор',
      description: 'Сборка портфеля из разных типов недвижимости',
      features: ['Диверсификация рисков', 'Гибкая стратегия', 'Автоматическая ребалансировка']
    },
    {
      icon: 'ShoppingCart',
      title: 'Биржа проверенных объектов',
      description: 'Покупка и продажа долей с прозрачной историей',
      features: ['Ликвидность активов', 'Прозрачное ценообразование', 'Безопасные сделки']
    },
    {
      icon: 'GraduationCap',
      title: 'Академия AREALVEST',
      description: 'Курсы и вебинары по стратегиям приумножения капитала',
      features: ['Обучение от экспертов', 'Практические кейсы', 'Сертификаты']
    }
  ];

  return (
    <section 
      id="growth" 
      data-animate 
      className={`py-12 sm:py-20 px-4 sm:px-6 bg-muted/30 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
            Больше чем сделка
          </h2>
          <p className="text-xl text-muted-foreground">
            Ваш капитал работает по стратегии
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((item, index) => (
            <Card key={index} className="hover:shadow-xl transition-all">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                  <Icon name={item.icon} size={32} className="text-white" />
                </div>
                <CardTitle className="text-2xl">{item.title}</CardTitle>
                <CardDescription className="text-base">{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {item.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-muted-foreground">
                      <Icon name="CheckCircle2" size={16} className="mr-2 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GrowthSection;
