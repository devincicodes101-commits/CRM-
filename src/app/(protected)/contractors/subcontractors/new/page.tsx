import { SubcontractorForm } from "@/components/contractors/subcontractor-form";

export default function NewSubcontractorPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">New Subcontractor</h1>
        <p className="text-sm text-muted-foreground">Add a subcontractor to your network</p>
      </div>
      <SubcontractorForm />
    </div>
  );
}