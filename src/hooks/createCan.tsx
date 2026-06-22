import type { ReactNode } from 'react';

/** Returns the current user's role(s), or `null`/`undefined` when unauthenticated. */
export type RoleResolver<T> = () => T | T[] | null | undefined;

export interface CanProps<T> {
  /** Roles allowed to see the content. Omitted/empty means "any authenticated user". */
  allowed?: T[];
  children: ReactNode;
  /** Rendered when access is denied (default `null`). */
  fallback?: ReactNode;
}

export interface CanApi<T> {
  /** Hook returning whether the current user may access `allowed`. */
  useCan: (allowed?: T[]) => boolean;
  /** Component that renders `children` only when the current user is allowed. */
  Can: (props: CanProps<T>) => ReactNode;
}

/**
 * Build a role-based access control pair (`useCan` + `Can`) decoupled from any
 * specific auth provider. Pass a resolver that reads the current user's role(s);
 * both the hook and the component share it.
 *
 * Semantics: unauthenticated (resolver returns `null`/`undefined`) -> denied.
 * Empty/omitted `allowed` -> any authenticated user is granted. Otherwise the
 * user is granted when any of their roles is in `allowed`.
 *
 * @param useCurrentRoles - resolver for the current user's role(s); may itself be a hook
 */
export function createCan<T>(useCurrentRoles: RoleResolver<T>): CanApi<T> {
  function useCan(allowed?: T[]): boolean {
    const current = useCurrentRoles();

    if (current == null) {
      return false;
    }

    if (!allowed || allowed.length === 0) {
      return true;
    }

    const roles = Array.isArray(current) ? current : [current];

    return roles.some((role) => allowed.includes(role));
  }

  function Can({ allowed, children, fallback = null }: CanProps<T>): ReactNode {
    return useCan(allowed) ? children : fallback;
  }

  return { useCan, Can };
}
