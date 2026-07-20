import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createServiceClient } from "@/lib/supabase/server";
import { MessageForm } from "./message-form";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const ROLE_LABEL: Record<string, string> = { office: "Office", contractor: "Contractor", client: "You" };

export default async function JobMessagesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, title, customer_name, address, start_date, status, client_photos")
    .eq("message_token", token)
    .single<Row>();
  if (!job) notFound();

  const { data: msgs } = await supabase
    .from("job_messages")
    .select("id, sender_role, sender_name, body, created_date")
    .eq("job_id", job.id)
    .order("created_date", { ascending: true });

  const messages = (msgs ?? []) as Row[];
  const photos = (Array.isArray(job.client_photos) ? job.client_photos : []) as Row[];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-background p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Your job</p>
        <h1 className="text-2xl font-bold mt-1">{job.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {job.address}{job.start_date ? ` · ${format(new Date(job.start_date), "d MMM yyyy")}` : ""}
        </p>
      </div>

      {/* Thread */}
      <div className="rounded-2xl border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold text-sm">Messages</div>
        <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No messages yet. Send us a message below and we&apos;ll get back to you.
            </p>
          ) : messages.map((m) => {
            const mine = m.sender_role === "client";
            return (
              <div key={m.id} className={cn("max-w-[85%]", mine && "ml-auto")}>
                <div className={cn("rounded-2xl px-3 py-2 text-sm", mine ? "bg-primary text-white rounded-tr-sm" : "bg-muted rounded-tl-sm")}>
                  {m.body}
                </div>
                <p className={cn("text-[11px] text-muted-foreground mt-1", mine && "text-right")}>
                  {ROLE_LABEL[m.sender_role] ?? m.sender_role}
                  {m.created_date ? ` · ${format(new Date(m.created_date), "d MMM, HH:mm")}` : ""}
                </p>
              </div>
            );
          })}
        </div>
        <div className="border-t p-3">
          <MessageForm token={token} />
        </div>
      </div>

      {/* Photos */}
      <div className="rounded-2xl border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b font-semibold text-sm">Site Photos</div>
        <div className="p-4">
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No photos yet. Use the 📷 button above to add one.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption || "Site photo"} className="w-full h-24 object-cover rounded-lg border" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
