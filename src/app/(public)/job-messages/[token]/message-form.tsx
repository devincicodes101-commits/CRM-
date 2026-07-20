"use client";

import { useState, useRef, useTransition } from "react";
import { Send, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { postClientMessage, uploadClientPhoto } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageForm({ token }: { token: string }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function send() {
    if (!text.trim()) return;
    start(async () => {
      const res = await postClientMessage(token, text);
      if ("error" in res) toast.error(res.error);
      else { setText(""); toast.success("Message sent"); }
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    start(async () => {
      const res = await uploadClientPhoto(token, fd);
      if ("error" in res) toast.error(res.error);
      else toast.success("Photo uploaded");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="flex items-end gap-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Send a message to the team…"
        rows={2}
        className="text-sm"
      />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      <Button variant="outline" size="icon" disabled={pending} onClick={() => fileRef.current?.click()} title="Attach photo">
        <ImagePlus className="size-4" />
      </Button>
      <Button size="icon" disabled={pending || !text.trim()} onClick={send} title="Send">
        <Send className="size-4" />
      </Button>
    </div>
  );
}
