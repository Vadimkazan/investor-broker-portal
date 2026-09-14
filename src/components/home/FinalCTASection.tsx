import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface FinalCTASectionProps {
  onRegisterClick?: () => void;
}

const FinalCTASection = ({ onRegisterClick }: FinalCTASectionProps) => {
  const stats = [
    { value: '2,500+', label: 'Инвесторов' },
    { value: '₽15B+', label: 'Объем сделок' },
    { value: '350+', label: 'Брокеров' },
    { value: '98%', label: 'Довольных клиентов' }
  ];

  return (
    <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-primary to-secondary text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6">
          Ваш путь к финансовой свободе<br />начинается здесь
        </h2>
        <p className="text-xl text-white/90 mb-10">
          Присоединяйтесь к сообществу умных инвесторов и прогрессивных брокеров
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6" onClick={onRegisterClick}>
            <Icon name="UserPlus" className="mr-2" size={20} />
            Зарегистрироваться как инвестор
          </Button>
          <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6" onClick={onRegisterClick}>
            <Icon name="Building" className="mr-2" size={20} />
            Подключиться как брокер
          </Button>
        </div>
        
        <div className="mt-10 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-2xl sm:text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;