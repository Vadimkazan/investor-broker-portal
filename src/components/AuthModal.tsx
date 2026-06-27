import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuth?: (user: { name: string; email: string; role: string }) => void;
}

const AuthModal = ({ open, onClose, onAuth }: AuthModalProps) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'investor' | 'broker'>('investor');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const user = await login(loginEmail.trim().toLowerCase(), loginPassword);
      onAuth?.({ name: user.name, email: user.email, role: user.role });
      onClose();
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      const user = await register(regEmail.trim().toLowerCase(), regPassword, regName.trim(), regRole);
      onAuth?.({ name: user.name, email: user.email, role: user.role });
      onClose();
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Добро пожаловать в InvestPro</DialogTitle>
          <DialogDescription>
            Войдите или создайте аккаунт для доступа к платформе
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && (
                <p className="text-sm text-destructive">{loginError}</p>
              )}
              <Button type="submit" className="w-full gap-2" disabled={loginLoading}>
                {loginLoading
                  ? <Icon name="Loader2" size={18} className="animate-spin" />
                  : <Icon name="LogIn" size={18} />}
                Войти
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Имя</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Иван Иванов"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Пароль</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-3">
                <Label>Роль</Label>
                <RadioGroup value={regRole} onValueChange={(v) => setRegRole(v as 'investor' | 'broker')}>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="investor" id="investor" />
                    <Label htmlFor="investor" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon name="TrendingUp" size={18} className="text-primary" />
                        <div>
                          <p className="font-semibold">Инвестор</p>
                          <p className="text-xs text-muted-foreground">Вкладывайте в недвижимость</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted cursor-pointer">
                    <RadioGroupItem value="broker" id="broker" />
                    <Label htmlFor="broker" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Icon name="Building2" size={18} className="text-secondary" />
                        <div>
                          <p className="font-semibold">Брокер</p>
                          <p className="text-xs text-muted-foreground">Размещайте объекты и привлекайте капитал</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {regError && (
                <p className="text-sm text-destructive">{regError}</p>
              )}
              <Button type="submit" className="w-full gap-2" disabled={regLoading}>
                {regLoading
                  ? <Icon name="Loader2" size={18} className="animate-spin" />
                  : <Icon name="UserPlus" size={18} />}
                Зарегистрироваться
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
