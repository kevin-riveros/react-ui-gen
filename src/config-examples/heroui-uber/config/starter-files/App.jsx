import { Button, Card } from "@heroui/react";
import "./index.css";

export const App = () => {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-3xl px-6 py-16 space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Your HeroUI app</h1>
        <p>
          Describe what you want to build in the chat, and the model will
          replace this placeholder with real components — themed by the CSS
          variables in <code>./index.css</code>.
        </p>
        <Card>
          <Card.Content className="flex flex-row items-center justify-between gap-4 p-4">
            <span>Ready to build something?</span>
            <Button variant="primary">Start</Button>
          </Card.Content>
        </Card>
      </section>
    </main>
  );
};
