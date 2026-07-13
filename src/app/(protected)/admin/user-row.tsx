"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "./actions";
import { USER_ROLES } from "@/lib/schemas/users";
import type { UserRole } from "@/lib/schemas/users";

type Props = {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    created_date: string;
  };
  currentUserId: string;
};

export function UserRow({ user, currentUserId }: Props) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRoleChange(newRole: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(user.id, newRole);
      if (result && "error" in result) {
        setError(result.error);
        setRole(user.role);
      } else {
        setRole(newRole as UserRole);
      }
    });
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium text-sm">{user.full_name}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </td>
      <td className="px-4 py-3">
        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={pending || user.id === currentUserId}
          className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
        >
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(user.created_date).toLocaleDateString("en-GB")}
      </td>
      <td className="px-4 py-3">
        {user.id === currentUserId && (
          <span className="text-xs text-muted-foreground">(you)</span>
        )}
      </td>
    </tr>
  );
}
