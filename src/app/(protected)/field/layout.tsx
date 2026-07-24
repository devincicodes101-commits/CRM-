import { OfflineBoot } from "@/components/field/offline-boot";

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <OfflineBoot />
      {children}
    </div>
  );
}
