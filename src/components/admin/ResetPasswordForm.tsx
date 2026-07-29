"use client";

import Link from "next/link";
import { useState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState(
    token ? "Choose a new administrator password." : "This reset link is invalid.",
  );
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };
      setMessage(result.message || (response.ok ? "Password changed." : "Reset failed."));
      setSuccess(response.ok && result.ok === true);
      if (response.ok) {
        setPassword("");
        setConfirmation("");
        window.history.replaceState(null, "", "/admin/reset");
      }
    } catch {
      setMessage("The password could not be changed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-shell admin-shell--login" aria-label="Reset administrator password">
      <div className="admin-login-card">
        <header className="admin-login-card__header">
          <span>Luca 4</span>
          <h1>Reset Password</h1>
        </header>
        <p className={`admin-notice admin-notice--${success ? "success" : "neutral"}`} role="status">
          {message}
        </p>
        {!success && token ? (
          <form className="admin-login" onSubmit={submit}>
            <label>
              New password
              <input
                autoComplete="new-password"
                minLength={12}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <small>At least 12 characters with upper/lower case, a number and a symbol.</small>
            </label>
            <label>
              Confirm new password
              <input
                autoComplete="new-password"
                minLength={12}
                onChange={(event) => setConfirmation(event.target.value)}
                required
                type="password"
                value={confirmation}
              />
            </label>
            <button className="admin-button admin-button--primary" disabled={loading} type="submit">
              {loading ? "Changing…" : "Change password"}
            </button>
          </form>
        ) : null}
        <Link className="admin-button admin-button--secondary" href="/admin">Back to login</Link>
      </div>
    </section>
  );
}
