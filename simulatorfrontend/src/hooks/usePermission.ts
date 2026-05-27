/**
 * usePermission – unified role-based access hook
 * Replaces scattered inline role checks across components.
 */
import { useAuth } from './useAuth';

export type Role = 'admin' | 'educator' | 'student';

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  educator: 2,
  student: 1,
};

export function usePermission() {
  const { user } = useAuth();
  const rawRole = (user?.role || 'student') as Role;
  // Normalise: some code uses 'user', others 'pending' etc.
  const role: Role = ROLE_HIERARCHY[rawRole] ? rawRole : 'student';

  return {
    /** Check exact role match */
    hasRole: (...roles: Role[]) => roles.includes(role),

    /** Check minimum role level (admin >= educator >= student) */
    hasMinRole: (minRole: Role) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole],

    role,
    isAdmin: role === 'admin',
    isEducator: role === 'educator',
    isStudent: role === 'student',
  };
}
