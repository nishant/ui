import { useState } from 'react';
import { Accordion, AccordionItem } from '../../src/components/accordion';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

function Demo({ type, collapsible, headingLevel }: { type: 'single' | 'multiple'; collapsible?: boolean; headingLevel?: 2 | 3 | 4 }) {
  const body = (
    <>
      <AccordionItem value="ship" title="How does shipping work?">
        Orders leave within two business days. You get a tracking link by email.
      </AccordionItem>
      <AccordionItem value="returns" title="Can I return an item?">
        Yes, within 30 days in the original packaging.
      </AccordionItem>
      <AccordionItem value="gift" title="Gift wrapping" disabled>
        Not available right now.
      </AccordionItem>
      <AccordionItem value="pay" title="Which payments do you accept?">
        Cards, bank transfer and gift cards.
      </AccordionItem>
    </>
  );
  return (
    <div className="w-full min-w-0">
      {type === 'multiple' ? (
        <Accordion type="multiple" defaultValue={['ship']} headingLevel={headingLevel}>
          {body}
        </Accordion>
      ) : (
        <Accordion defaultValue="ship" collapsible={collapsible} headingLevel={headingLevel}>
          {body}
        </Accordion>
      )}
    </div>
  );
}

function Controlled() {
  const [v, setV] = useState('ship');
  return (
    <div className="w-full min-w-0">
      <Accordion value={v} onValueChange={setV} collapsible>
        <AccordionItem value="ship" title="Shipping">
          Two business days.
        </AccordionItem>
        <AccordionItem value="returns" title="Returns">
          Thirty days.
        </AccordionItem>
      </Accordion>
      <p className="mt-2 text-xs text-th-hi3">Open: {v || 'none'}</p>
    </div>
  );
}

export const accordion: ComponentDoc = {
  id: 'accordion',
  name: 'Accordion',
  exports: ['Accordion', 'AccordionItem'],
  summary:
    'Headers that open and close panels. The APG accordion: a button inside a heading, aria-expanded and aria-controls, a region per panel, Up, Down, Home and End between headers. Single or multiple open items; the height animates unless the user prefers reduced motion.',
  importLine: "import { Accordion, AccordionItem } from '@nish/ui';",
  controls: [
    { key: 'type', label: 'Type', type: 'select', options: ['single', 'multiple'] },
    { key: 'collapsible', label: 'Collapsible (single)', type: 'boolean' },
    { key: 'headingLevel', label: 'Heading level', type: 'select', options: ['2', '3', '4'] },
  ],
  initial: { type: 'single', collapsible: false, headingLevel: '3' },
  render: (a) => (
    <Demo
      type={a.type === 'multiple' ? 'multiple' : 'single'}
      collapsible={!!a.collapsible}
      headingLevel={a.headingLevel === '2' ? 2 : a.headingLevel === '4' ? 4 : 3}
    />
  ),
  code: (a) =>
    jsx(
      'Accordion',
      {
        type: a.type === 'multiple' ? 'multiple' : undefined,
        collapsible: a.type === 'multiple' ? undefined : a.collapsible,
        headingLevel: a.headingLevel === '3' ? undefined : Number(a.headingLevel),
      },
      '<AccordionItem value="ship" title="Shipping">…</AccordionItem>',
    ),
  stories: [
    { id: 'single', name: 'Single', render: () => <Demo type="single" /> },
    { id: 'collapsible', name: 'Single, collapsible', render: () => <Demo type="single" collapsible /> },
    { id: 'multiple', name: 'Multiple', render: () => <Demo type="multiple" /> },
    { id: 'controlled', name: 'Controlled', render: () => <Controlled /> },
  ],
  usage: `import { Accordion, AccordionItem } from '@nish/ui';

<Accordion defaultValue="ship" collapsible>
  <AccordionItem value="ship" title="Shipping">…</AccordionItem>
  <AccordionItem value="returns" title="Returns">…</AccordionItem>
</Accordion>

// Several open at once; value is a list
<Accordion type="multiple" value={open} onValueChange={setOpen}>…</Accordion>`,
  guidelines: [
    'Set headingLevel so the headers fit the page outline: under an h2 section use 3 (the default).',
    'type="single" keeps one item open once opened unless collapsible is set; onValueChange reports "" when the open item closes.',
    'A disabled item is skipped by the arrow keys.',
    'Closed panels are inert and hidden from assistive technology; their content stays in the DOM.',
  ],
};
