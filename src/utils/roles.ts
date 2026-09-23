import { UserRole } from '@/services/api';

export const ROLE_LABELS: Record<UserRole, string> = {
  investor: 'Инвестор',
  broker: 'Брокер',
  manager: 'Менеджер',
  admin: 'Админ',
};

type RoleBearing = { role?: UserRole; roles?: UserRole[] };

export const getUserRoles = (user: RoleBearing | null | undefined): UserRole[] => {
  if (!user) return [];
  if (user.roles && user.roles.length > 0) return user.roles;
  return user.role ? [user.role] : [];
};

export const hasRole = (user: RoleBearing | null | undefined, role: UserRole): boolean => {
  return getUserRoles(user).includes(role);
};

export const hasAnyRole = (user: RoleBearing | null | undefined, roles: UserRole[]): boolean => {
  const userRoles = getUserRoles(user);
  return roles.some((r) => userRoles.includes(r));
};

export const isAdminOrManager = (user: RoleBearing | null | undefined): boolean => {
  return hasAnyRole(user, ['admin', 'manager']);
};

export const isBroker = (user: RoleBearing | null | undefined): boolean => {
  return hasRole(user, 'broker');
};

export const hasAllRoles = (user: RoleBearing | null | undefined, roles: UserRole[]): boolean => {
  const userRoles = getUserRoles(user);
  return roles.every((r) => userRoles.includes(r));
};

export const canSwitchMode = (user: RoleBearing | null | undefined): boolean => {
  return hasAllRoles(user, ['investor', 'broker']);
};

export const getActiveMode = (user: RoleBearing | null | undefined): UserRole | null => {
  if (!user) return null;
  if (user.role && getUserRoles(user).includes(user.role)) return user.role;
  return getUserRoles(user)[0] ?? null;
};

export const canPublishObjects = (user: RoleBearing | null | undefined): boolean => {
  if (isAdminOrManager(user)) return true;
  if (!isBroker(user)) return false;
  return getActiveMode(user) === 'broker';
};

export const canManageObject = (
  user: (RoleBearing & { id?: number }) | null | undefined,
  objectBrokerId: number | null | undefined,
): boolean => {
  if (!user) return false;
  if (isAdminOrManager(user)) return true;
  if (!isBroker(user) || !objectBrokerId) return false;
  if (getActiveMode(user) !== 'broker') return false;
  return user.id === objectBrokerId;
};