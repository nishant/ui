// A server component (no 'use client') using the plain exports: cn and buttonClass are pure
// functions, Card and Badge need no state, Button is a client component that renders from here.
import { cn, buttonClass, Card, CardHeader, Badge, Button, Progress } from 'nish-ui';

export default function Home() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <h1 className={cn('text-xl font-semibold text-th-hi', 'tracking-tight')}>Server page</h1>
      <Card>
        <CardHeader title="From a server component" />
        <Badge>server</Badge>
        <Button>Button</Button>
        <Progress value={40} label="Upload" />
        <a href="/shell" className={buttonClass({ variant: 'secondary' })}>
          Open shell
        </a>
      </Card>
    </main>
  );
}
