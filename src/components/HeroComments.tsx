"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicComment } from "@/data/comments";

type FormErrors = Partial<
  Record<"screenName" | "email" | "comment" | "turnstile" | "database", string>
>;

type FormState = {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
  errors: FormErrors;
  highlightedId: string | null;
};

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      theme: string;
      size: string;
      action?: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
};

type TurnstileWindow = Window & {
  turnstile?: TurnstileApi;
};

type CommentsResponse = {
  ok: boolean;
  comments?: PublicComment[];
  comment?: PublicComment;
  message?: string;
  errors?: FormErrors;
};

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const autoScrollPixelsPerMs = 0.035;

function getInitials(name: string) {
  const parts = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "LP";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absolute = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (absolute < 60) return "just now";
  if (absolute < 3600) return formatter.format(Math.round(diffSeconds / 60), "minute");
  if (absolute < 86400) return formatter.format(Math.round(diffSeconds / 3600), "hour");
  if (absolute < 604800) return formatter.format(Math.round(diffSeconds / 86400), "day");
  return formatter.format(Math.round(diffSeconds / 604800), "week");
}

export function HeroComments() {
  const [comments, setComments] = useState<PublicComment[] | null>(null);
  const [turnstileToken, setTurnstileToken] = useState(
    siteKey ? "" : "development-bypass",
  );
  const [scriptReady, setScriptReady] = useState(false);
  const [state, setState] = useState<FormState>({
    status: "idle",
    message: "",
    errors: {},
    highlightedId: null,
  });
  const [formOpen, setFormOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const pausedRef = useRef(false);

  const loopComments = useMemo(
    () =>
      comments && comments.length > 2
        ? [...comments, ...comments]
        : comments ?? [],
    [comments],
  );
  const hasScrollableComments = (comments?.length ?? 0) > 2;

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      try {
        const response = await fetch("/api/comments", { cache: "no-store" });
        const result = (await response.json()) as CommentsResponse;
        if (!cancelled && response.ok && result.ok && result.comments) {
          setComments(result.comments);
        }
      } catch {
        if (!cancelled) setComments([]);
      }
    }

    loadComments();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!formOpen) {
      widgetIdRef.current = null;
      return;
    }

    if (
      !siteKey ||
      !scriptReady ||
      !widgetRef.current ||
      widgetIdRef.current
    ) {
      return;
    }

    const turnstile = (window as TurnstileWindow).turnstile;
    if (!turnstile) return;

    widgetIdRef.current = turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      theme: "dark",
      size: "flexible",
      action: "hero-comment",
      callback: setTurnstileToken,
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [formOpen, scriptReady]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches || (comments?.length ?? 0) < 3) return;

    let animationFrame = 0;
    let lastTime = 0;

    const step = (time: number) => {
      const viewport = viewportRef.current;
      if (!lastTime) lastTime = time;
      const delta = time - lastTime;
      lastTime = time;

      if (viewport && !pausedRef.current) {
        const loopPoint = viewport.scrollHeight / 2;
        if (loopPoint > viewport.clientHeight) {
          viewport.scrollTop += delta * autoScrollPixelsPerMs;
          if (viewport.scrollTop >= loopPoint) {
            viewport.scrollTop = viewport.scrollTop - loopPoint;
          }
        }
      }

      animationFrame = window.requestAnimationFrame(step);
    };

    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [comments?.length]);

  useEffect(() => {
    if (!state.highlightedId) return;
    const timeout = window.setTimeout(() => {
      setState((current) => ({ ...current, highlightedId: null }));
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [state.highlightedId]);

  useEffect(() => {
    if (!formOpen) return;
    const timeout = window.setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => window.clearTimeout(timeout);
  }, [formOpen]);

  function setPaused(paused: boolean) {
    pausedRef.current = paused;
  }

  function resetTurnstile() {
    const turnstile = (window as TurnstileWindow).turnstile;
    turnstile?.reset(widgetIdRef.current ?? undefined);
    setTurnstileToken(siteKey ? "" : "development-bypass");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      screenName: String(data.get("screenName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      comment: String(data.get("comment") ?? "").trim(),
      company: String(data.get("company") ?? ""),
      turnstileToken,
    };

    const errors: FormErrors = {};
    if (payload.screenName.length < 2 || payload.screenName.length > 40) {
      errors.screenName = "Use 2 to 40 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      errors.email = "Enter a valid email.";
    }
    if (payload.comment.length < 10 || payload.comment.length > 280) {
      errors.comment = "Use 10 to 280 characters.";
    }
    if (!turnstileToken) {
      errors.turnstile = "Complete verification.";
    }

    if (Object.keys(errors).length) {
      setState({
        status: "error",
        message: "Check the highlighted fields.",
        errors,
        highlightedId: null,
      });
      return;
    }

    setState({
      status: "submitting",
      message: "",
      errors: {},
      highlightedId: null,
    });

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as CommentsResponse;

      if (!response.ok || !result.ok || !result.comment) {
        setState({
          status: "error",
          message: result.message ?? "The comment could not be published.",
          errors: result.errors ?? {},
          highlightedId: null,
        });
        resetTurnstile();
        return;
      }

      setComments((current) => [result.comment as PublicComment, ...(current ?? [])]);
      viewportRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      form.reset();
      resetTurnstile();
      setState({
        status: "success",
        message: "Comment published.",
        errors: {},
        highlightedId: result.comment.id,
      });
    } catch {
      setState({
        status: "error",
        message: "The connection failed. Please try again.",
        errors: {},
        highlightedId: null,
      });
      resetTurnstile();
    }
  }

  return (
    <aside
      className={`hero-comments ${
        hasScrollableComments ? "" : "hero-comments--sparse"
      }`}
      aria-label="Audience comments"
    >
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      )}

      <div
        className="hero-comments__stream"
        ref={viewportRef}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="hero-comments__track">
          {comments?.length === 0 ? (
            <article className="comment-card comment-card--empty">
              <div className="comment-card__body">
                <p>No comments yet. Share the first thought.</p>
              </div>
            </article>
          ) : null}
          {loopComments.map((comment, index) => (
            <article
              className={`comment-card ${
                state.highlightedId === comment.id ? "is-new" : ""
              }`}
              key={`${comment.id}-${index}`}
            >
              <div className="comment-card__body">
                <span className="comment-card__quote" aria-hidden="true">
                  &quot;
                </span>
                <p>{comment.body}</p>
                <footer>
                  <strong>{comment.screenName}</strong>
                  <span>{formatRelativeTime(comment.createdAt)}</span>
                </footer>
              </div>
              <span className="comment-card__avatar" aria-hidden="true">
                {getInitials(comment.screenName)}
              </span>
            </article>
          ))}
        </div>
      </div>

      <div className="hero-comment-popout">
        {!formOpen && (
          <button
            className="action-link action-link--primary hero-comment-trigger"
            type="button"
            aria-expanded={formOpen}
            aria-controls="hero-comment-form"
            onClick={() => setFormOpen(true)}
          >
            Share Thoughts
          </button>
        )}

        {formOpen && (
          <form
            className="hero-comment-form"
            id="hero-comment-form"
            ref={formRef}
            onSubmit={handleSubmit}
          >
            <button
              className="hero-comment-form__close"
              type="button"
              onClick={() => setFormOpen(false)}
            >
              Close
            </button>
            <div className="hero-comment-form__grid">
              <div className="form-field">
                <label htmlFor="comment-screen-name">Screen name</label>
                <input
                  id="comment-screen-name"
                  name="screenName"
                  autoComplete="nickname"
                  aria-invalid={Boolean(state.errors.screenName)}
                  aria-describedby={
                    state.errors.screenName
                      ? "comment-screen-name-error"
                      : undefined
                  }
                  ref={firstFieldRef}
                  required
                />
                {state.errors.screenName && (
                  <span className="field-error" id="comment-screen-name-error">
                    {state.errors.screenName}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="comment-email">Email address</label>
                <input
                  id="comment-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(state.errors.email)}
                  aria-describedby={
                    state.errors.email ? "comment-email-error" : undefined
                  }
                  required
                />
                {state.errors.email && (
                  <span className="field-error" id="comment-email-error">
                    {state.errors.email}
                  </span>
                )}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="comment-body">Comment</label>
              <textarea
                id="comment-body"
                name="comment"
                rows={3}
                maxLength={280}
                aria-invalid={Boolean(state.errors.comment)}
                aria-describedby={
                  state.errors.comment ? "comment-body-error" : undefined
                }
                required
              />
              {state.errors.comment && (
                <span className="field-error" id="comment-body-error">
                  {state.errors.comment}
                </span>
              )}
            </div>

            <div className="honeypot" aria-hidden="true">
              <label htmlFor="comment-company">Company</label>
              <input
                id="comment-company"
                name="company"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="form-field hero-comment-form__verification">
              {siteKey ? (
                <div ref={widgetRef} data-action="turnstile-spin-v1" />
              ) : (
                <p>
                  Turnstile is bypassed in local development. Add the
                  environment keys before production.
                </p>
              )}
              {state.errors.turnstile && (
                <span className="field-error">{state.errors.turnstile}</span>
              )}
              {state.errors.database && (
                <span className="field-error">{state.errors.database}</span>
              )}
            </div>

            <div className="hero-comment-form__submit">
              <button
                className="action-link action-link--primary"
                type="submit"
                disabled={state.status === "submitting"}
              >
                {state.status === "submitting" ? "Publishing..." : "Share Thoughts"}
              </button>
              <p
                className={`form-status form-status--${state.status}`}
                aria-live="polite"
              >
                {state.message}
              </p>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
}
