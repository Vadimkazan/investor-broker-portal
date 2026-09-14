import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface StatItem {
  label: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}

interface HeroSectionProps {
  dashboardStats: StatItem[];
  onRegisterClick?: () => void;
  scrollToSection: (id: string) => void;
}

const HeroSection = ({ dashboardStats, onRegisterClick, scrollToSection }: HeroSectionProps) => {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary py-12 sm:py-20 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center space-y-6">
          <Badge className="bg-white/20 text-white border-white/30 text-sm px-4 py-1">
            Экосистема будущих миллионеров
          </Badge>
          
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white leading-tight">
            Инвестируйте<br />в недвижимость с умом
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Ваш капитал растет, пока вы живете своей жизнью
          </p>
          
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            Rielvestor — экосистема, где будущие миллионеры встречаются с проверенными брокерами. 
            Начните с малого и масштабируйтесь безопасно.
          </p>
          
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center pt-6">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6" onClick={onRegisterClick}>
              <Icon name="TrendingUp" className="mr-2" size={20} />
              Начать инвестировать
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
              onClick={() => scrollToSection('for-brokers')}
            >
              <Icon name="Briefcase" className="mr-2" size={20} />
              Для брокеров
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-10 sm:mt-16">
          {dashboardStats.map((stat, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon name={stat.icon} size={22} className="text-white" />
                  <Badge className="bg-white/20 text-white text-xs">{stat.change}</Badge>
                </div>
                <div className="text-2xl sm:text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-white/70">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;