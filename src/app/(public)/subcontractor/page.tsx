import { HardHat } from "lucide-react";
import { SubcontractorRegisterForm } from "./register-form";

export default function SubcontractorPortalPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="rounded-2xl border bg-background p-6">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <HardHat className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Join our contractor network</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Register your company to start receiving job opportunities in your area.
            </p>
          </div>
        </div>
      </div>

      <SubcontractorRegisterForm />
    </div>
  );
}
