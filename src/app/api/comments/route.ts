import {
  countRecentComments,
  createComment,
  getCommentsDatabase,
  getRemoteIp,
  hashIp,
  listVisibleComments,
  validateCommentPayload,
  verifyTurnstile,
  type CommentPayload,
} from "@/lib/comments";

export const dynamic = "force-dynamic";

const dailyLimit = 3;

export async function GET() {
  const db = await getCommentsDatabase();

  if (!db) {
    return Response.json({ ok: true, comments: [] });
  }

  try {
    const comments = await listVisibleComments(db);
    return Response.json({ ok: true, comments });
  } catch {
    return Response.json(
      {
        ok: false,
        message: "Comments are temporarily unavailable.",
        comments: [],
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  let body: CommentPayload;

  try {
    body = (await request.json()) as CommentPayload;
  } catch {
    return Response.json(
      { ok: false, message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = validateCommentPayload(body);

  if (parsed.company) {
    return Response.json({ ok: true, ignored: true });
  }

  if (Object.keys(parsed.errors).length) {
    return Response.json(
      {
        ok: false,
        message: "Check the highlighted fields.",
        errors: parsed.errors,
      },
      { status: 422 },
    );
  }

  const db = await getCommentsDatabase();
  if (!db) {
    return Response.json(
      {
        ok: false,
        message: "Comments database is not configured.",
        errors: { database: "Comments database is not configured." },
      },
      { status: 503 },
    );
  }

  const remoteIp = getRemoteIp(request);
  const verified = await verifyTurnstile(parsed.turnstileToken, remoteIp);
  if (!verified) {
    return Response.json(
      {
        ok: false,
        message: "Verification failed. Please refresh and try again.",
        errors: { turnstile: "Please complete the verification." },
      },
      { status: 403 },
    );
  }

  const ipHash = await hashIp(remoteIp);
  if (!ipHash) {
    return Response.json(
      {
        ok: false,
        message: "Comment protection is not configured.",
        errors: { database: "Comment protection is not configured." },
      },
      { status: 503 },
    );
  }

  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const [emailCount, ipCount] = await Promise.all([
      countRecentComments(db, "email_normalized", parsed.emailNormalized, sinceIso),
      countRecentComments(db, "ip_hash", ipHash, sinceIso),
    ]);

    if (emailCount >= dailyLimit || ipCount >= dailyLimit) {
      return Response.json(
        {
          ok: false,
          message: "You have reached today's comment limit.",
        },
        { status: 429 },
      );
    }

    const comment = await createComment(db, {
      id: crypto.randomUUID(),
      screenName: parsed.screenName,
      body: parsed.comment,
      email: parsed.email,
      emailNormalized: parsed.emailNormalized,
      ipHash,
    });

    return Response.json({ ok: true, comment }, { status: 201 });
  } catch {
    return Response.json(
      { ok: false, message: "The comment could not be saved." },
      { status: 502 },
    );
  }
}
