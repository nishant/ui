import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { Avatar, AvatarGroup, avatarHueIndex, avatarInitials } from './avatar';
import { NishProvider } from './provider';

afterEach(cleanup);

describe('avatarInitials', () => {
  it('uses first and last word initials, uppercased', () => {
    expect(avatarInitials('ada lovelace')).toBe('AL');
    expect(avatarInitials('Mary Jane Watson')).toBe('MW');
    expect(avatarInitials('  Cher ')).toBe('C');
    expect(avatarInitials('')).toBe('');
  });
});

describe('avatarHueIndex', () => {
  it('is stable and within 0..7', () => {
    expect(avatarHueIndex('Ada')).toBe(avatarHueIndex('Ada'));
    for (const n of ['a', 'Bob', 'Carol Danvers', 'x'.repeat(50)]) {
      const i = avatarHueIndex(n);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(8);
    }
    const all = new Set(Array.from({ length: 60 }, (_, i) => avatarHueIndex(`user${i}`)));
    expect(all.size).toBeGreaterThan(4);
  });
});

describe('Avatar', () => {
  it('shows initials with the name as its accessible label', () => {
    render(<Avatar name="Ada Lovelace" />);
    const img = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(img.textContent).toBe('AL');
  });
  it('gives the same name the same color', () => {
    render(
      <>
        <Avatar name="Zed" />
        <Avatar name="Zed" alt="Other" />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Zed' }).className).toBe(screen.getByRole('img', { name: 'Other' }).className);
  });
  it('shows an image when src is safe, alt defaults to name', () => {
    render(<Avatar name="Ada" src="https://x.test/a.png" />);
    const img = document.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('https://x.test/a.png');
    expect(img.getAttribute('alt')).toBe('Ada');
  });
  it('alt overrides name', () => {
    render(<Avatar name="Ada" alt="Profile photo" src="/a.png" />);
    expect(document.querySelector('img')!.getAttribute('alt')).toBe('Profile photo');
  });
  it('hides itself from screen readers with alt=""', () => {
    const { container } = render(<Avatar name="Ada Lovelace" alt="" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('[aria-hidden=true]')).not.toBeNull();
  });
  it('ignores unsafe src and shows initials', () => {
    render(<Avatar name="Ada Lovelace" src="javascript:alert(1)" />);
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeTruthy();
  });
  it('falls back to initials when the image fails', () => {
    render(<Avatar name="Ada Lovelace" src="/broken.png" />);
    fireEvent.error(document.querySelector('img')!);
    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Ada Lovelace' }).textContent).toBe('AL');
  });
  it('tries a new src after a failure', () => {
    const { rerender } = render(<Avatar name="Ada" src="/broken.png" />);
    fireEvent.error(document.querySelector('img')!);
    rerender(<Avatar name="Ada" src="/ok.png" />);
    expect(document.querySelector('img')!.getAttribute('src')).toBe('/ok.png');
  });
  it('uses the provider label with no name', () => {
    render(
      <NishProvider strings={{ avatar: 'Utilisateur' }}>
        <Avatar />
      </NishProvider>,
    );
    expect(screen.getByRole('img', { name: 'Utilisateur' })).toBeTruthy();
  });
  it('maps size and shape', () => {
    const { container } = render(<Avatar name="A" size="xl" shape="square" />);
    expect(container.firstElementChild!.className).toContain('size-16');
    expect(screen.getByRole('img').className).toContain('rounded-lg');
    cleanup();
    render(<Avatar name="A" size="xs" />);
    expect(screen.getByRole('img').className).toContain('rounded-full');
  });
  it('renders a status dot with an accessible name', () => {
    render(<Avatar name="Ada" status="ok" />);
    expect(screen.getByRole('img', { name: 'ok' })).toBeTruthy();
  });
  it('passes ref, className, id and data attributes to the root', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(<Avatar ref={ref} name="A" className="me-2" id="av" data-x="1" />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current!.className).toContain('me-2');
    expect(ref.current!.id).toBe('av');
    expect(ref.current!.getAttribute('data-x')).toBe('1');
  });
  it('renders on the server with initials', () => {
    expect(renderToString(<Avatar name="Ada Lovelace" />)).toContain('AL');
  });
});

describe('AvatarGroup', () => {
  const people = ['Ann A', 'Bob B', 'Cy C', 'Di D', 'Ed E'];
  it('shows all avatars without max', () => {
    render(
      <AvatarGroup>
        {people.map((p) => (
          <Avatar key={p} name={p} />
        ))}
      </AvatarGroup>,
    );
    expect(screen.getAllByRole('img')).toHaveLength(5);
  });
  it('limits to max and adds a +N badge with an accessible label', () => {
    render(
      <AvatarGroup max={2}>
        {people.map((p) => (
          <Avatar key={p} name={p} />
        ))}
      </AvatarGroup>,
    );
    expect(screen.getByRole('img', { name: '3 more' }).textContent).toBe('+3');
    expect(screen.queryByRole('img', { name: 'Cy C' })).toBeNull();
    expect(screen.getByRole('img', { name: 'Bob B' })).toBeTruthy();
  });
  it('uses the provider string for the overflow label', () => {
    render(
      <NishProvider strings={{ avatarMore: (n) => `${n} autres` }}>
        <AvatarGroup max={1}>
          <Avatar name="A" />
          <Avatar name="B" />
        </AvatarGroup>
      </NishProvider>,
    );
    expect(screen.getByRole('img', { name: '1 autres' })).toBeTruthy();
  });
  it('has no badge when everything fits', () => {
    render(
      <AvatarGroup max={5}>
        <Avatar name="A" />
        <Avatar name="B" />
      </AvatarGroup>,
    );
    expect(screen.queryByText(/^\+/)).toBeNull();
  });
  it('passes size and shape to children unless they set their own', () => {
    const { container } = render(
      <AvatarGroup size="lg" shape="square">
        <Avatar name="A" />
        <Avatar name="B" size="xs" />
      </AvatarGroup>,
    );
    const avatars = container.querySelectorAll('[role=group] > span > span');
    expect(avatars[0]!.className).toContain('size-12');
    expect(avatars[1]!.className).toContain('size-6');
    expect(screen.getByRole('img', { name: 'A' }).className).toContain('rounded-lg');
  });
  it('is a group and takes ref and rest props', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <AvatarGroup ref={ref} aria-label="Team" className="p-1" data-x="1">
        <Avatar name="A" />
      </AvatarGroup>,
    );
    const g = screen.getByRole('group', { name: 'Team' });
    expect(ref.current).toBe(g);
    expect(g.className).toContain('p-1');
    expect(g.getAttribute('data-x')).toBe('1');
  });
});
