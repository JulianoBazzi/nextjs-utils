import type { ReactElement, ReactNode } from 'react';

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
  Can: (props: CanProps<T>) => ReactElement;
}

/**
 * Build a role-based UI gating pair (`useCan` + `Can`) decoupled from any
 * specific auth provider. Pass a resolver that reads the current user's role(s);
 * both the hook and the component share it.
 *
 * Semantics: unauthenticated (resolver returns `null`/`undefined`) -> denied.
 * Empty/omitted `allowed` -> any authenticated user is granted (an `allowed`
 * list computed at runtime that ends up empty therefore *grants*, not denies —
 * guard against that in the caller). Otherwise the user is granted when any of
 * their roles is in `allowed`.
 *
 * Security: this only hides UI. It runs on the client, where the resolver's
 * output and the guarded children are fully inspectable, so it is not an
 * authorization boundary — every protected action and data access must be
 * enforced again on the server.
 *
 * @param useCurrentRoles - resolver for the current user's role(s); should be a
 *   hook (or read from a reactive source) so access re-evaluates on login/logout
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

  // Always returns an element so `<Can>` type-checks with older `@types/react`
  // (18.x before ReactNode-returning components were accepted).
  function Can({ allowed, children, fallback = null }: CanProps<T>): ReactElement {
    return <>{useCan(allowed) ? children : fallback}</>;
  }

  return { useCan, Can };
}
