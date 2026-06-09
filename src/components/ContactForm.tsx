"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { inquiryTypes, type InquiryType } from "@/data/site";

type FormErrors = Partial<Record<"name" | "email" | "type" | "message", string>>;

type FormState = {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
  errors: FormErrors;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          theme: string;
          size: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function ContactForm({
  initialType = "music",
}: {
  initialType?: InquiryType;
}) {
  const [type, setType] = useState<InquiryType>(initialType);
  const [turnstileToken, setTurnstileToken] = useState(
    siteKey ? "" : "development-bypass",
  );
  const [scriptReady, setScriptReady] = useState(false);
  const [state, setState] = useState<FormState>({
    status: "idle",
    message: "",
    errors: {},
  });
  const formRef = useRef<HTMLFormElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !siteKey ||
      !scriptReady ||
      !widgetRef.current ||
      !window.turnstile ||
      widgetIdRef.current
    ) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      theme: "dark",
      size: "flexible",
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [scriptReady]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      type,
      message: String(data.get("message") ?? "").trim(),
      company: String(data.get("company") ?? ""),
      turnstileToken,
    };

    const errors: FormErrors = {};
    if (payload.name.length < 2) errors.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (payload.message.length < 20) {
      errors.message = "Please include at least 20 characters.";
    }

    if (Object.keys(errors).length) {
      setState({
        status: "error",
        message: "Check the highlighted fields.",
        errors,
      });
      return;
    }

    if (!turnstileToken) {
      setState({
        status: "error",
        message: "Please complete the verification.",
        errors: {},
      });
      return;
    }

    setState({ status: "submitting", message: "", errors: {} });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        errors?: FormErrors;
      };

      if (!response.ok || !result.ok) {
        setState({
          status: "error",
          message: result.message ?? "The message could not be sent.",
          errors: result.errors ?? {},
        });
        window.turnstile?.reset(widgetIdRef.current ?? undefined);
        setTurnstileToken(siteKey ? "" : "development-bypass");
        return;
      }

      form.reset();
      setType("music");
      setState({
        status: "success",
        message: "Message sent. Luca will get back to you as soon as possible.",
        errors: {},
      });
    } catch {
      setState({
        status: "error",
        message: "The connection failed. Please try again or email directly.",
        errors: {},
      });
    }
  }

  return (
    <>
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      )}
      <form className="contact-form" ref={formRef} onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            aria-describedby={state.errors.name ? "name-error" : undefined}
            aria-invalid={Boolean(state.errors.name)}
            required
          />
          {state.errors.name && (
            <span className="field-error" id="name-error">
              {state.errors.name}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-describedby={state.errors.email ? "email-error" : undefined}
            aria-invalid={Boolean(state.errors.email)}
            required
          />
          {state.errors.email && (
            <span className="field-error" id="email-error">
              {state.errors.email}
            </span>
          )}
        </div>

        <div className="form-field form-field--wide">
          <label htmlFor="type">I’m getting in touch about</label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as InquiryType)}
          >
            {inquiryTypes.map((item) => (
              <option value={item.value} key={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field form-field--wide">
          <label htmlFor="message">Your message</label>
          <textarea
            id="message"
            name="message"
            rows={7}
            aria-describedby={
              state.errors.message ? "message-error" : undefined
            }
            aria-invalid={Boolean(state.errors.message)}
            required
          />
          {state.errors.message && (
            <span className="field-error" id="message-error">
              {state.errors.message}
            </span>
          )}
        </div>

        <div className="honeypot" aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="form-field form-field--wide form-verification">
          {siteKey ? (
            <div ref={widgetRef} />
          ) : (
            <p>
              Turnstile is bypassed in local development. Add the environment
              keys before production.
            </p>
          )}
        </div>

        <div className="form-submit">
          <button
            className="action-link action-link--dark"
            type="submit"
            disabled={state.status === "submitting"}
          >
            {state.status === "submitting" ? "Sending…" : "Send Message →"}
          </button>
          <p
            className={`form-status form-status--${state.status}`}
            aria-live="polite"
          >
            {state.message}
          </p>
        </div>
      </form>
    </>
  );
}
