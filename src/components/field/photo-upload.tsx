"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { uploadFieldPhoto } from "@/app/(protected)/field/jobs/[id]/actions";

type Photo = { url: string; caption?: string; uploaded_at?: string };

export function FieldPhotoUpload({
  jobId,
  photos,
  disabled,
}: {
  jobId: string;
  photos: Photo[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    setBusy(true);
    start(async () => {
      const res = await uploadFieldPhoto(jobId, fd);
      setBusy(false);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Photo uploaded");
        router.refresh();
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-3">
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noreferrer" className="block">
              <Image
                src={p.url}
                alt={p.caption || `Site photo ${i + 1}`}
                width={200}
                height={200}
                className="aspect-square w-full rounded-lg object-cover border"
                unoptimized
              />
            </a>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No photos yet. Add one below.</p>
      )}

      {!disabled && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onPick}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending || busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/5 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {busy ? "Uploading…" : "Add Photo"}
          </button>
        </>
      )}
    </div>
  );
}
