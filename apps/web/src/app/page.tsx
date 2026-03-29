import { PaymentProvider } from "@ethiotransit/shared";
import { Button } from "@ethiotransit/ui";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
      <main className="max-w-lg text-center space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          EthioTransit
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Multi-tenant transport platform — Next.js web, Flutter mobile, Node
          API with M-Pesa and Chapa, and a Telegram bot in one monorepo.
        </p>
        <p className="text-sm font-mono text-neutral-500">
          Shared enum sample:{" "}
          <span className="text-brand-600 dark:text-brand-400">
            {PaymentProvider.CHAPA}
          </span>
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button type="button">Primary</Button>
          <Button type="button" variant="secondary">
            Secondary
          </Button>
        </div>
      </main>
    </div>
  );
}
