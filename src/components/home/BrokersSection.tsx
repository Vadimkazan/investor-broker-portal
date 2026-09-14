import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface BrokersSectionProps {
  isVisible: boolean;
  onRegisterClick?: () => void;
}

const BrokersSection = ({ isVisible, onRegisterClick }: BrokersSectionProps) => {
  const benefits = [
    {
      icon: 'Store',
      title: 'Персональная визитка брокера',
      description: 'Страница с портфолио, рейтингом и отзывами клиентов',
      benefit: 'Укрепите репутацию и привлекайте больше клиентов',
      features: ['Портфолио объектов', 'История сделок', 'Отзывы клиентов']
    },
    {
      icon: 'LayoutDashboard',
      title: 'Управление объектами',
      description: 'Моментальное обновление статусов, архив проданных объектов',
      benefit: 'Избавьтесь от устаревших объявлений навсегда',
      features: ['Обновление в 1 клик', 'Архив сделок', 'Аналитика просмотров']
    },
    {
      icon: 'Video',
      title: 'Дистанционные сделки',
      description: 'Встроенные инструменты для онлайн-показов и документооборота',
      benefit: 'Экономьте время на рутинных процессах',
      features: ['Онлайн-показы', '3D-туры', 'Электронный документооборот']
    },
    {
      icon: 'Users',
      title: 'Теплые лиды',
      description: 'Заявки от инвесторов, прошедших обучение на платформе',
      benefit: 'Работайте только с заинтересованными клиентами',
      features: ['Целевые заявки', 'Профиль инвестора', 'История запросов']
    }
  ];

  return (
    <section 
      id="for-brokers" 
      data-animate 
      className={`py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-secondary via-secondary/90 to-primary text-white transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">
            Для профессионалов рынка
          </Badge>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
            Ваш цифровой офис<br />и источник клиентов
          </h2>
          <p className="text-xl text-white/80">
            Перестаньте терять сделки в соцсетях
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((item, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon name={item.icon} size={28} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-xl mb-2">{item.title}</CardTitle>
                    <CardDescription className="text-white/70">{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 bg-white/10 rounded-lg p-3 mb-4">
                  <Icon name="Sparkles" size={16} className="text-yellow-300 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/90 font-medium">{item.benefit}</p>
                </div>
                <ul className="space-y-2">
                  {item.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-white/80">
                      <Icon name="CheckCircle2" size={14} className="mr-2 text-white/60" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6" onClick={onRegisterClick}>
            <Icon name="Rocket" className="mr-2" size={20} />
            Подключиться как брокер
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BrokersSection;
