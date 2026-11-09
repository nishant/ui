import { createRef } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Badge, Button, Card, CardHeader, IconButton, Input, Label, Select } from './primitives';
import {
  FIELD,
  badgeClass,
  buttonClass,
  cardClass,
  fieldClass,
  iconButtonClass,
  linkClass,
  revealClass,
} from './primitives-classes';
import * as primitives from './primitives';

afterEach(cleanup);

const classes = (el: Element) => el.getAttribute('class') ?? '';

describe('Button', () => {
  it('defaults to type=button and the secondary md look', () => {
    render(<Button>Go</Button>);
    const b = screen.getByRole('button', { name: 'Go' });
    expect(b.getAttribute('type')).toBe('button');
    expect(classes(b)).toContain('h-9');
    expect(classes(b)).toContain('border-th-line-strong');
  });

  it('loading disables the button and sets aria-busy', () => {
    render(<Button loading>Save</Button>);
    const b = screen.getByRole('button') as HTMLButtonElement;
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
    expect(b.hasAttribute('data-disabled')).toBe(true);
    expect(b.querySelector('svg[data-nish-spin]')).not.toBeNull();
  });

  it('not loading has no aria-busy and is enabled', () => {
    render(<Button>Save</Button>);
    const b = screen.getByRole('button') as HTMLButtonElement;
    expect(b.disabled).toBe(false);
    expect(b.hasAttribute('aria-busy')).toBe(false);
    expect(b.hasAttribute('data-disabled')).toBe(false);
  });

  it('disabled sets data-disabled and does not click', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        No
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button').hasAttribute('data-disabled')).toBe(true);
  });

  it('shows the icon, and the spinner replaces it while loading', () => {
    const { rerender } = render(<Button icon={<i data-testid="ic" />}>A</Button>);
    expect(screen.queryByTestId('ic')).not.toBeNull();
    rerender(
      <Button icon={<i data-testid="ic" />} loading>
        A
      </Button>,
    );
    expect(screen.queryByTestId('ic')).toBeNull();
  });

  it('spinner is 12px for xs and sm and 14px otherwise', () => {
    const { rerender } = render(
      <Button size="xs" loading>
        A
      </Button>,
    );
    expect(document.querySelector('svg')?.getAttribute('width')).toBe('12');
    rerender(
      <Button size="sm" loading>
        A
      </Button>,
    );
    expect(document.querySelector('svg')?.getAttribute('width')).toBe('12');
    rerender(
      <Button size="lg" loading>
        A
      </Button>,
    );
    expect(document.querySelector('svg')?.getAttribute('width')).toBe('14');
  });

  it('spinner pulses instead of spinning under reduced motion', () => {
    render(<Button loading>A</Button>);
    expect(classes(document.querySelector('svg')!)).toContain('motion-reduce:animate-pulse');
  });

  it('forwards ref, merges className and passes rest through', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} className="extra" data-x="1" aria-label="named" type="submit">
        A
      </Button>,
    );
    const b = screen.getByRole('button');
    expect(ref.current).toBe(b);
    expect(classes(b)).toContain('extra');
    expect(b.getAttribute('data-x')).toBe('1');
    expect(b.getAttribute('aria-label')).toBe('named');
    expect(b.getAttribute('type')).toBe('submit');
  });

  it('link variant uses link sizing, no height and the link disabled look', () => {
    render(
      <Button variant="link" size="sm">
        More
      </Button>,
    );
    const c = classes(screen.getByRole('button'));
    expect(c).toContain('text-xs');
    expect(c).toContain('gap-1');
    expect(c).toContain('h-auto');
    expect(c).not.toContain('h-7');
    expect(c).toContain('disabled:no-underline');
    expect(c).not.toContain('disabled:border');
  });

  it('renders on the server', () => {
    expect(renderToString(<Button>Go</Button>)).toContain('Go');
  });
});

describe('buttonClass', () => {
  it('sizes: every size has its own height class', () => {
    expect(buttonClass({ size: 'xs' })).toContain('h-6');
    expect(buttonClass({ size: 'sm' })).toContain('h-7');
    expect(buttonClass({ size: 'md' })).toContain('h-9');
    expect(buttonClass({ size: 'lg' })).toContain('h-11');
  });

  it('xs, sm and md grow to 44px on touch, lg does not need to', () => {
    for (const size of ['xs', 'sm', 'md'] as const) expect(buttonClass({ size })).toContain('pointer-coarse:min-h-11');
    expect(buttonClass({ size: 'lg' })).not.toContain('pointer-coarse:min-h-11');
  });

  it('link sizes keep the type size and gap per size', () => {
    expect(buttonClass({ variant: 'link', size: 'xs' })).toContain('text-2xs');
    expect(buttonClass({ variant: 'link', size: 'xs' })).toContain('gap-1 ');
    expect(buttonClass({ variant: 'link', size: 'md' })).toContain('text-sm');
    expect(buttonClass({ variant: 'link', size: 'md' })).toContain('gap-1.5');
    expect(buttonClass({ variant: 'link', size: 'lg' })).toContain('text-base');
    expect(buttonClass({ variant: 'link', size: 'lg' })).toContain('gap-2');
  });

  it('link has a touch hit area unless inline, and no press scale', () => {
    expect(buttonClass({ variant: 'link' })).toContain('pointer-coarse:after:absolute');
    expect(buttonClass({ variant: 'link', inline: true })).not.toContain('pointer-coarse:after:absolute');
    expect(buttonClass({ variant: 'link' })).not.toContain('active:scale');
    expect(buttonClass({ variant: 'primary' })).toContain('active:scale-[0.97]');
  });

  it('non-link buttons draw a border in forced colors, links do not', () => {
    expect(buttonClass({ variant: 'primary' })).toContain('forced-colors:border-[ButtonText]');
    expect(buttonClass({ variant: 'link' })).not.toContain('forced-colors:border');
  });

  it('every variant has a distinct look', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger', 'soft', 'subtle', 'link'] as const;
    const set = new Set(variants.map((variant) => buttonClass({ variant })));
    expect(set.size).toBe(variants.length);
  });

  it('className is merged last and wins a conflict', () => {
    expect(buttonClass({ size: 'md', className: 'h-20' })).toContain('h-20');
    expect(buttonClass({ size: 'md', className: 'h-20' })).not.toContain('h-9');
  });

  it('matches the class Button renders', () => {
    render(<Button variant="soft">A</Button>);
    expect(classes(screen.getByRole('button'))).toContain(buttonClass({ variant: 'soft' }).split(' ')[0]!);
  });
});

describe('linkClass and revealClass', () => {
  it('linkClass tones', () => {
    expect(linkClass()).toContain('text-th-accent');
    expect(linkClass({ tone: 'muted' })).toContain('text-th-hi3');
    expect(linkClass({ tone: 'muted' })).not.toContain('text-th-accent');
  });

  it('linkClass touch hit area unless inline', () => {
    expect(linkClass()).toContain('pointer-coarse:after:absolute');
    expect(linkClass({ inline: true })).not.toContain('pointer-coarse:after:absolute');
    expect(linkClass({ className: 'x' })).toContain('x');
  });

  it('revealClass hides until hover or focus and shows on touch', () => {
    const c = revealClass('extra');
    expect(c).toContain('opacity-0');
    expect(c).toContain('group-hover:opacity-100');
    expect(c).toContain('group-focus-within:opacity-100');
    expect(c).toContain('pointer-coarse:opacity-100');
    expect(c).toContain('extra');
  });
});

describe('IconButton', () => {
  it('names the button with label as aria-label and title', () => {
    render(
      <IconButton label="Refresh">
        <i />
      </IconButton>,
    );
    const b = screen.getByRole('button', { name: 'Refresh' });
    expect(b.getAttribute('title')).toBe('Refresh');
    expect(b.getAttribute('type')).toBe('button');
  });

  it('active sets aria-pressed and data-state', () => {
    const { rerender } = render(<IconButton label="Pin" active />);
    const b = screen.getByRole('button');
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(b.getAttribute('data-state')).toBe('active');
    expect(classes(b)).toContain('bg-th-elevated');
    rerender(<IconButton label="Pin" active={false} />);
    expect(screen.getByRole('button').hasAttribute('aria-pressed')).toBe(false);
    expect(screen.getByRole('button').getAttribute('data-state')).toBe('inactive');
    rerender(<IconButton label="Pin" />);
    expect(screen.getByRole('button').hasAttribute('data-state')).toBe(false);
  });

  it('forwards ref, className and rest', () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    render(<IconButton ref={ref} label="X" className="mine" data-k="v" onClick={onClick} />);
    const b = screen.getByRole('button');
    expect(ref.current).toBe(b);
    expect(classes(b)).toContain('mine');
    expect(b.getAttribute('data-k')).toBe('v');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled sets data-disabled', () => {
    render(<IconButton label="X" disabled />);
    expect(screen.getByRole('button').hasAttribute('data-disabled')).toBe(true);
  });

  it('warns once in development when there is no label', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error label is required; this is the misuse the warning is for
    render(<IconButton />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('IconButton');
    warn.mockRestore();
  });

  it('does not warn when aria-label names it instead', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // @ts-expect-error label is required; aria-label is the escape hatch
    render(<IconButton aria-label="named" />);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('iconButtonClass', () => {
  it('sizes: square sizes and radii', () => {
    expect(iconButtonClass({ size: '2xs' })).toContain('size-5');
    expect(iconButtonClass({ size: 'xs' })).toContain('size-6');
    expect(iconButtonClass({ size: 'sm' })).toContain('size-7');
    expect(iconButtonClass({ size: 'md' })).toContain('size-9');
  });

  it('2xs keeps a 24px hit area under a fine pointer and 44px under touch', () => {
    const c = iconButtonClass({ size: '2xs' });
    expect(c).toContain('pointer-fine:after:-inset-0.5');
    expect(c).toContain('pointer-coarse:min-h-11');
    expect(c).toContain('pointer-coarse:min-w-11');
    expect(iconButtonClass({ size: 'md' })).not.toContain('pointer-fine:after');
  });

  it('variants: idle and active looks differ', () => {
    expect(iconButtonClass({ variant: 'ghost' })).toContain('text-th-hi3');
    expect(iconButtonClass({ variant: 'subtle' })).toContain('bg-th-elevated');
    expect(iconButtonClass({ variant: 'soft' })).toContain('bg-th-accent-soft');
    expect(iconButtonClass({ variant: 'soft', active: true })).toContain('bg-th-accent/25');
    expect(iconButtonClass({ variant: 'subtle', active: true })).toContain('bg-th-overlay');
    expect(iconButtonClass({ variant: 'ghost', active: true })).toContain('forced-colors:outline-[Highlight]');
    expect(iconButtonClass({ variant: 'ghost' })).not.toContain('forced-colors:outline-[Highlight]');
  });

  it('danger tone turns hover and pressed loss-red', () => {
    const c = iconButtonClass({ tone: 'danger' });
    expect(c).toContain('hover:bg-th-loss-soft');
    expect(c).toContain('hover:text-th-loss');
    expect(c).toContain('active:bg-th-loss-soft');
    expect(c).toContain('active:text-th-loss');
    expect(iconButtonClass({ tone: 'danger', active: true })).toContain('bg-th-loss-soft text-th-loss');
    expect(iconButtonClass()).not.toContain('hover:text-th-loss');
  });
});

describe('Card', () => {
  it('padding sizes', () => {
    expect(cardClass({ padding: 'none' })).not.toMatch(/\bp-\d/);
    expect(cardClass({ padding: 'sm' })).toContain('p-3');
    expect(cardClass({ padding: 'md' })).toContain('p-4 sm:p-5');
    expect(cardClass({})).toContain('p-4 sm:p-5');
    expect(cardClass({ padding: 'lg' })).toContain('p-6');
  });

  it('padded={false} is padding none, and padding wins over padded', () => {
    expect(cardClass({ padded: false })).not.toMatch(/\bp-\d/);
    expect(cardClass({ padded: true })).toContain('p-4');
    expect(cardClass({ padding: 'sm', padded: false })).toContain('p-3');
  });

  it('inset variant: elevated fill, transparent border, no card shadow', () => {
    const c = cardClass({ variant: 'inset' });
    expect(c).toContain('bg-th-elevated');
    expect(c).toContain('border-transparent');
    expect(c).toContain('rounded-lg');
    expect(c).not.toContain('shadow-card');
    const s = cardClass({});
    expect(s).toContain('shadow-card');
    expect(s).toContain('bg-th-surface');
    expect(s).toContain('rounded-xl');
  });

  it('interactive adds hover per variant', () => {
    expect(cardClass({ interactive: true })).toContain('hover:border-th-line-strong');
    expect(cardClass({ interactive: true, variant: 'inset' })).toContain('hover:bg-th-overlay');
    expect(cardClass({})).not.toContain('hover:');
  });

  it('renders the element named by as, with ref, className and rest', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Card as="section" ref={ref} className="mine" data-k="v" padded={false}>
        body
      </Card>,
    );
    const el = document.querySelector('section')!;
    expect(ref.current).toBe(el);
    expect(classes(el)).toContain('mine');
    expect(el.getAttribute('data-k')).toBe('v');
    expect(classes(el)).not.toMatch(/\bp-\d/);
  });

  it('a titled section is labelled by its heading', () => {
    render(
      <Card as="section" title="Alerts" description="Quiet line" action={<button type="button">Add</button>}>
        x
      </Card>,
    );
    const region = screen.getByRole('region', { name: 'Alerts' });
    expect(region).not.toBeNull();
    expect(screen.getByText('Quiet line')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Add' })).not.toBeNull();
  });

  it('keeps an explicit aria-label instead of the heading', () => {
    render(
      <Card as="article" title="Alerts" aria-label="Mine">
        x
      </Card>,
    );
    expect(document.querySelector('article')!.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('a titled div has no aria-labelledby', () => {
    render(<Card title="Alerts">x</Card>);
    expect(document.querySelector('div[aria-labelledby]')).toBeNull();
  });

  it('unpadded cards get a divided header', () => {
    render(
      <Card padding="none" title="T">
        x
      </Card>,
    );
    expect(classes(screen.getByRole('heading').parentElement!.parentElement!.parentElement!)).toContain('border-b');
  });

  it('padded cards give the header a bottom margin', () => {
    render(<Card title="T">x</Card>);
    const header = screen.getByRole('heading').parentElement!.parentElement!.parentElement!;
    expect(classes(header)).toContain('mb-3');
    expect(classes(header)).not.toContain('border-b');
  });

  it('survives a server render', () => {
    expect(renderToString(<Card title="T">x</Card>)).toContain('T');
  });
});

describe('CardHeader', () => {
  it('renders the title at the chosen level, with the id, icon and description', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <CardHeader ref={ref} title="Hello" as="h3" titleId="tid" icon={<i data-testid="i" />} description="d" className="mine" data-k="v" />,
    );
    const h = screen.getByRole('heading', { level: 3 });
    expect(h.id).toBe('tid');
    expect(ref.current).not.toBeNull();
    expect(classes(ref.current!)).toContain('mine');
    expect(ref.current!.getAttribute('data-k')).toBe('v');
    expect(screen.getByTestId('i').parentElement!.getAttribute('aria-hidden')).toBe('true');
  });

  it('defaults to h2 and omits empty slots', () => {
    const { container } = render(<CardHeader title="T" />);
    expect(screen.getByRole('heading', { level: 2 })).not.toBeNull();
    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelectorAll('div').length).toBe(3);
  });

  it('divided adds the border and padding', () => {
    const { container } = render(<CardHeader title="T" divided />);
    expect(classes(container.firstElementChild!)).toContain('border-b');
    expect(classes(container.firstElementChild!)).toContain('px-4 py-3');
  });
});

describe('Badge', () => {
  it('tones and hues have distinct looks', () => {
    const tones = ['neutral', 'accent', 'ok', 'loss', 'warn', 'info', 'on-accent'] as const;
    expect(new Set(tones.map((tone) => badgeClass({ tone }))).size).toBe(tones.length);
    const hues = ['emerald', 'indigo', 'amber', 'lime', 'rose', 'sky', 'violet', 'teal'] as const;
    expect(new Set(hues.map((hue) => badgeClass({ hue }))).size).toBe(hues.length);
    expect(badgeClass({ hue: 'sky', tone: 'loss' })).toContain('sky');
    expect(badgeClass({ hue: 'sky', tone: 'loss' })).not.toContain('loss');
  });

  it('sizes and variants', () => {
    expect(badgeClass({ size: 'xs' })).toContain('text-3xs');
    expect(badgeClass({ size: 'sm' })).toContain('text-xs');
    expect(badgeClass({ variant: 'tag' })).toContain('uppercase');
    expect(badgeClass({ variant: 'tag' })).toContain('rounded-sm');
    expect(badgeClass({ variant: 'pill' })).toContain('rounded-full');
  });

  it('dot renders a hidden 6px dot in the tone fill or the hue', () => {
    const { container, rerender } = render(<Badge tone="ok" dot>Up</Badge>);
    const dot = container.querySelector('span > span')!;
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    expect(classes(dot)).toContain('bg-th-ok-fill');
    rerender(
      <Badge hue="teal" dot>
        Up
      </Badge>,
    );
    expect(classes(container.querySelector('span > span')!)).toContain('bg-th-teal');
    rerender(<Badge>Up</Badge>);
    expect(container.querySelector('span > span')).toBeNull();
  });

  it('forwards ref, className and rest', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Badge ref={ref} className="mine" data-k="v" title="t">
        3
      </Badge>,
    );
    expect(ref.current!.textContent).toBe('3');
    expect(classes(ref.current!)).toContain('mine');
    expect(ref.current!.getAttribute('data-k')).toBe('v');
  });
});

describe('Input', () => {
  it('uses the control border and the hi3 placeholder', () => {
    expect(FIELD).toContain('border-th-line-control');
    expect(FIELD).not.toContain('border-th-line-strong');
    expect(FIELD).toContain('placeholder:text-th-hi3');
    expect(FIELD).not.toContain('placeholder:text-th-ghost');
    render(<Input aria-label="n" />);
    expect(classes(screen.getByLabelText('n'))).toContain('border-th-line-control');
  });

  it('sizes set height, text and logical padding', () => {
    expect(fieldClass({ size: 'xs' })).toContain('h-7');
    expect(fieldClass({ size: 'sm' })).toContain('h-8');
    expect(fieldClass({ size: 'md' })).toContain('h-9');
    expect(fieldClass({ size: 'md' })).toContain('ps-3');
    expect(fieldClass({ size: 'md' })).toContain('pe-3');
    expect(fieldClass({ size: 'md' })).not.toMatch(/\b(pl|pr)-\d/);
    expect(fieldClass({ size: 'sm' })).toContain('pointer-coarse:text-base');
  });

  it('invalid sets aria-invalid and the loss border', () => {
    render(<Input aria-label="n" invalid />);
    expect(screen.getByLabelText('n').getAttribute('aria-invalid')).toBe('true');
    expect(fieldClass({ invalid: true })).toContain('hover:border-th-loss');
    expect(fieldClass()).not.toContain('hover:border-th-loss');
    render(<Input aria-label="m" />);
    expect(screen.getByLabelText('m').hasAttribute('aria-invalid')).toBe(false);
  });

  it('leading and trailing slots use logical positions and padding', () => {
    const { container } = render(<Input aria-label="n" leading={<b>$</b>} trailing={<u>kg</u>} wrapperClassName="wrap" />);
    const wrapper = container.firstElementChild!;
    expect(classes(wrapper)).toContain('wrap');
    const input = screen.getByLabelText('n');
    expect(classes(input)).toContain('ps-8');
    expect(classes(input)).toContain('pe-8');
    expect(classes(input)).toContain('pointer-coarse:pe-12');
    expect(classes(screen.getByText('$').parentElement!)).toContain('start-0');
    expect(classes(screen.getByText('$').parentElement!)).toContain('pointer-events-none');
    expect(classes(screen.getByText('kg').parentElement!)).toContain('end-0');
    expect(classes(wrapper)).not.toMatch(/\b(left|right)-0\b/);
  });

  it('without slots it renders the bare input and ref reaches it', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(<Input ref={ref} aria-label="n" className="mine" data-k="v" />);
    expect(container.firstElementChild).toBe(ref.current);
    expect(classes(ref.current!)).toContain('mine');
    expect(ref.current!.getAttribute('data-k')).toBe('v');
  });

  it('with only one slot pads only that side', () => {
    render(<Input aria-label="n" leading={<b>$</b>} />);
    expect(classes(screen.getByLabelText('n'))).toContain('ps-8');
    expect(classes(screen.getByLabelText('n'))).not.toContain('pe-8');
  });

  it('works controlled and with a register-like object', () => {
    const onChange = vi.fn();
    const register = { name: 'email', onChange, onBlur: vi.fn(), ref: createRef<HTMLInputElement>() };
    render(<Input aria-label="n" {...register} />);
    const input = screen.getByLabelText('n') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'a@b.c' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.blur(input);
    expect(register.onBlur).toHaveBeenCalled();
    expect(register.ref.current).toBe(input);
    expect(input.name).toBe('email');
  });

  it('posts in a native form', () => {
    const { container } = render(
      <form>
        <Input name="q" defaultValue="hi" aria-label="q" />
      </form>,
    );
    expect(new FormData(container.querySelector('form')!).get('q')).toBe('hi');
  });
});

describe('Select', () => {
  it('ref, rest and name go to the select; className sizes the wrapper', () => {
    const ref = createRef<HTMLSelectElement>();
    const { container } = render(
      <Select ref={ref} name="s" aria-label="s" className="wrap" selectClassName="inner" data-k="v" defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    expect(ref.current!.tagName).toBe('SELECT');
    expect(classes(container.firstElementChild!)).toContain('wrap');
    expect(classes(ref.current!)).toContain('inner');
    expect(classes(ref.current!)).toContain('appearance-none');
    expect(ref.current!.getAttribute('data-k')).toBe('v');
    expect(ref.current!.value).toBe('b');
  });

  it('chevron sits on the logical end per size and the select pads for it', () => {
    const { container, rerender } = render(<Select aria-label="s" size="xs" />);
    expect(classes(container.querySelector('svg')!)).toContain('end-1.5');
    expect(classes(container.querySelector('select')!)).toContain('pe-6');
    rerender(<Select aria-label="s" size="sm" />);
    expect(classes(container.querySelector('svg')!)).toContain('end-2');
    expect(classes(container.querySelector('select')!)).toContain('pe-7');
    expect(container.querySelector('svg')!.getAttribute('width')).toBe('13');
    rerender(<Select aria-label="s" />);
    expect(classes(container.querySelector('svg')!)).toContain('end-2.5');
    expect(classes(container.querySelector('select')!)).toContain('pe-8');
    expect(classes(container.querySelector('svg')!)).not.toMatch(/\bright-/);
  });

  it('invalid sets aria-invalid', () => {
    render(<Select aria-label="s" invalid />);
    expect(screen.getByLabelText('s').getAttribute('aria-invalid')).toBe('true');
  });

  it('fires onChange', () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="s" onChange={onChange}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    fireEvent.change(screen.getByLabelText('s'), { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe('Label', () => {
  it('renders a span with ref, className and rest', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Label ref={ref} className="mine" data-k="v">
        Name
      </Label>,
    );
    expect(ref.current!.tagName).toBe('SPAN');
    expect(classes(ref.current!)).toContain('uppercase');
    expect(classes(ref.current!)).toContain('mine');
    expect(ref.current!.getAttribute('data-k')).toBe('v');
  });
});

describe('module surface', () => {
  it('keeps exporting the class helpers from primitives for existing import paths', () => {
    expect(primitives.buttonClass).toBe(buttonClass);
    expect(primitives.iconButtonClass).toBe(iconButtonClass);
    expect(primitives.cardClass).toBe(cardClass);
    expect(primitives.badgeClass).toBe(badgeClass);
    expect(primitives.fieldClass).toBe(fieldClass);
    expect(primitives.linkClass).toBe(linkClass);
    expect(primitives.revealClass).toBe(revealClass);
    expect(primitives.FIELD).toBe(FIELD);
  });

  it('renders every primitive under renderToString without throwing', () => {
    const html = renderToString(
      <div>
        <Button loading>a</Button>
        <IconButton label="b" active />
        <Card title="c" as="section">
          d
        </Card>
        <Badge dot>e</Badge>
        <Input leading="f" trailing="g" />
        <Select>
          <option>h</option>
        </Select>
        <Label>i</Label>
      </div>,
    );
    expect(html).toContain('aria-busy="true"');
  });
});
