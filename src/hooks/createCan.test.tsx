import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createCan } from './createCan';

enum Role {
  Admin = 'admin',
  Editor = 'editor',
  Viewer = 'viewer',
}

function build(current: Role | Role[] | null) {
  return createCan<Role>(() => current);
}

describe('createCan / useCan', () => {
  it('denies when unauthenticated', () => {
    const { useCan } = build(null);
    const { result } = renderHook(() => useCan([Role.Admin]));
    expect(result.current).toBe(false);
  });

  it('denies unauthenticated even without allowed list', () => {
    const { useCan } = build(null);
    const { result } = renderHook(() => useCan());
    expect(result.current).toBe(false);
  });

  it('grants any authenticated user when allowed is empty or omitted', () => {
    const { useCan } = build(Role.Viewer);
    expect(renderHook(() => useCan()).result.current).toBe(true);
    expect(renderHook(() => useCan([])).result.current).toBe(true);
  });

  it('matches a single role against the allowed list', () => {
    const { useCan } = build(Role.Editor);
    expect(renderHook(() => useCan([Role.Editor, Role.Admin])).result.current).toBe(true);
    expect(renderHook(() => useCan([Role.Admin])).result.current).toBe(false);
  });

  it('matches when any of multiple roles is allowed', () => {
    const { useCan } = build([Role.Viewer, Role.Editor]);
    expect(renderHook(() => useCan([Role.Admin, Role.Editor])).result.current).toBe(true);
    expect(renderHook(() => useCan([Role.Admin])).result.current).toBe(false);
  });
});

describe('createCan / Can', () => {
  it('renders children when allowed', () => {
    const { Can } = build(Role.Admin);
    render(<Can allowed={[Role.Admin]}>secret</Can>);
    expect(screen.getByText('secret')).toBeDefined();
  });

  it('renders fallback when denied', () => {
    const { Can } = build(Role.Viewer);
    render(
      <Can allowed={[Role.Admin]} fallback={<span>denied</span>}>
        secret
      </Can>,
    );
    expect(screen.queryByText('secret')).toBeNull();
    expect(screen.getByText('denied')).toBeDefined();
  });

  it('renders nothing (null) by default when denied', () => {
    const { Can } = build(null);
    const { container } = render(<Can allowed={[Role.Admin]}>secret</Can>);
    expect(container.textContent).toBe('');
  });

  it('renders children for any authenticated user without allowed', () => {
    const { Can } = build(Role.Viewer);
    render(<Can>open</Can>);
    expect(screen.getByText('open')).toBeDefined();
  });
});
