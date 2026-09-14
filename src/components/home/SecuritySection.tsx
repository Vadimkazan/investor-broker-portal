import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface SecuritySectionProps {
  isVisible: boolean;
}

const SecuritySection = ({ isVisible }: SecuritySectionProps) => {
  const guarantees = [
    {
      icon: 'Shield',
      title: 'Юридический эскроу',
      description: 'Средства защищены до завершения сделки',
      detail: 'Каждая сделка проходит через счет эскроу с гарантией возврата'
    },
    {
      icon: 'FileCheck',
      title: 'Аудит всех объектов',
      description: 'Проверка документов и юридической чистоты',
      detail: 'Каждый объект проходит 3-этапную проверку юристами'
    },
    {
      icon: 'Users',
      title: 'Сопровождение сделки',
      description: 'Юрист проверяет все документы по сделке',
      detail: 'Персональный юрист ведет вашу сделку от начала до конца'
    },
    {
      icon: 'Headphones',
      title: 'Поддержка 24/7',
      description: 'Всегда на связи для решения вопросов',
      detail: 'Персональный менеджер и техподдержка в любое время'
    }
  ];

  return (
    <section 
      id="security" 
      data-animate 
      className={`py-12 sm:py-20 px-4 sm:px-6 bg-background transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4">
            Инвестируйте с уверенностью
          </h2>
          <p className="text-xl text-muted-foreground">
            Многоуровневая система защиты ваших интересов
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {guarantees.map((item, index) => (
            <Card key={index} className="text-center hover:shadow-lg hover:scale-105 transition-all">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <Icon name={item.icon} size={32} className="text-white" />
                </div>
                <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                <CardDescription className="text-sm">{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
