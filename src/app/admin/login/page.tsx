"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/forms/ContactFields";
import { apiRequest } from "@/lib/client-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const result = await apiRequest("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
    setIsSubmitting(false);
    if (!result.success) return setError(result.error);
    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-sm px-5 pt-24">
      <p className="eyebrow">Staff only</p>
      <h1 className="display mt-3 text-5xl">Kitchen login</h1>
      <form onSubmit={handleSubmit} className="mt-10 space-y-8">
        <div>
          <label htmlFor="password" className="label">Staff password</label>
          <input
            id="password"
            type="password"
            className="field"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <FormError message={error} />
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
