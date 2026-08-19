import { usePathname } from 'next/navigation';

export interface UseActiveRouteOptions {
  /** Require the pathname to match `href` exactly instead of by segment prefix. Default `false`. */
  exact?: boolean;
}

function normalize(path: string): string {
  const [pathname = ''] = path.split(/[?#]/);
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/**
 * Whether the current route matches `href` — ideal for highlighting active
 * links in navbars and sidebars (Next.js App Router). By default it matches
 * whole path segments, so `/settings` is active on `/settings/profile` but
 * not on `/settings-old`. The root `/` only matches exactly.
 *
 * @param href - the link target to compare against the current pathname
 * @param options - matching behavior
 * @returns `true` when the route is active
 */
export function useActiveRoute(href: string, options: UseActiveRouteOptions = {}): boolean {
  const { exact = false } = options;
  const pathname = usePathname();

  const current = normalize(pathname ?? '');
  const target = normalize(href);

  // An empty, query-only or hash-only href has no path to match.
  if (target === '') {
    return false;
  }

  if (exact || target === '/') {
    return current === target;
  }

  return current === target || current.startsWith(`${target}/`);
}
