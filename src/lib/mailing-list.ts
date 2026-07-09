import { getCloudflareContext } from "@opennextjs/cloudflare";

export type MailingListSource = "comment" | "contact";

type SubscriberInput = {
  email: string;
  emailNormalized?: string;
  name: string;
  source: MailingListSource;
  seenAt?: string;
};

type ContactMessageInput = {
  email: string;
  emailNormalized?: string;
  id: string;
  inquiryType: string;
  ipHash: string | null;
  message: string;
  name: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function cleanDisplayName(name: string) {
  const cleaned = name.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

export async function getMailingListDatabase() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.DB ?? null;
  } catch {
    return null;
  }
}

export function prepareMailingListSubscriberUpsert(
  db: D1Database,
  input: SubscriberInput,
) {
  const seenAt = input.seenAt ?? new Date().toISOString();
  const emailNormalized = input.emailNormalized ?? normalizeEmail(input.email);
  const commentCount = input.source === "comment" ? 1 : 0;
  const messageCount = input.source === "contact" ? 1 : 0;

  return db
    .prepare(
      `INSERT INTO mailing_list_subscribers (
        email_normalized,
        email,
        display_name,
        first_source,
        last_source,
        comment_count,
        message_count,
        created_at,
        updated_at,
        last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email_normalized) DO UPDATE SET
        email = excluded.email,
        display_name = CASE
          WHEN excluded.display_name IS NOT NULL THEN excluded.display_name
          ELSE mailing_list_subscribers.display_name
        END,
        last_source = excluded.last_source,
        comment_count = mailing_list_subscribers.comment_count + excluded.comment_count,
        message_count = mailing_list_subscribers.message_count + excluded.message_count,
        updated_at = excluded.updated_at,
        last_seen_at = excluded.last_seen_at`,
    )
    .bind(
      emailNormalized,
      input.email,
      cleanDisplayName(input.name),
      input.source,
      input.source,
      commentCount,
      messageCount,
      seenAt,
      seenAt,
      seenAt,
    );
}

export async function upsertMailingListSubscriber(
  db: D1Database,
  input: SubscriberInput,
) {
  await prepareMailingListSubscriberUpsert(db, input).run();
}

function prepareContactMessageInsert(
  db: D1Database,
  input: ContactMessageInput,
  createdAt: string,
) {
  const emailNormalized = input.emailNormalized ?? normalizeEmail(input.email);

  return db
    .prepare(
      `INSERT INTO contact_messages (
        id,
        name,
        email,
        email_normalized,
        inquiry_type,
        message,
        ip_hash,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.name,
      input.email,
      emailNormalized,
      input.inquiryType,
      input.message,
      input.ipHash,
      createdAt,
    );
}

export async function createContactMessageAndSubscriber(
  db: D1Database,
  input: ContactMessageInput,
) {
  const createdAt = new Date().toISOString();
  const emailNormalized = input.emailNormalized ?? normalizeEmail(input.email);

  await db.batch([
    prepareContactMessageInsert(
      db,
      { ...input, emailNormalized },
      createdAt,
    ),
    prepareMailingListSubscriberUpsert(db, {
      email: input.email,
      emailNormalized,
      name: input.name,
      source: "contact",
      seenAt: createdAt,
    }),
  ]);

  return { id: input.id, createdAt };
}
