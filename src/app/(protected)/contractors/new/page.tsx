import { ContractorForm } from "@/components/contractors/contractor-form";

export default function NewContractorPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">New Contractor</h1>
        <p className="text-sm text-muted-foreground">Add a contractor to your network</p>
      </div>
      <ContractorForm />
    </div>
  );
}