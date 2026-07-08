import { TelesalesChat } from "@/components/comms/telesales-chat";

export default function TelesalesChatPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Telesales Agent</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Business-hours assistant — captures leads, answers queries, books callbacks
        </p>
      </div>
      <TelesalesChat />
    </div>
  );
}