/**
 * Protected – render children only if the user meets the role requirement.
 * If unauthorised, renders fallback (default null) instead.
 */
import { usePermission, Role } from '../hooks/usePermission';

interface Props {
  /** Minimum role level required */
  minRole?: Role;
  /** Exact roles allowed (overrides minRole if set) */
  roles?: Role[];
  /** Fallback JSX when not authorised */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Protected({ minRole, roles, fallback = null, children }: Props) {
  const permission = usePermission();

  if (roles) {
    if (!permission.hasRole(...roles)) return <>{fallback}</>;
  } else if (minRole) {
    if (!permission.hasMinRole(minRole)) return <>{fallback}</>;
  }

  return <>{children}</>;
}
