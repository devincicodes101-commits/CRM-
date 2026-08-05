import { StaffSignupForm } from "./signup-form";

export default function StaffSignupPage() {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">Field Team Signup</h1>
        <p className="text-sm text-muted-foreground">
          Request access to the field app. An admin will approve you and send an invite.
        </p>
      </div>
      <StaffSignupForm />
    </div>
  );
}
