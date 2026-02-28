import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { chatMessages, chatSessions } from '@foundation/db/schema';
import type { Handler } from 'hono';
import type { DBClient } from '@foundation/db';

const toNumber = (value: string | undefined, fallback: number, min = 1, max = 100) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export const createListChatSessionsHandler = (db: DBClient): Handler => async (c) => {
  const channel = c.req.query('channel');
  const query = c.req.query('query');
  const limit = toNumber(c.req.query('limit'), 20);
  const offset = toNumber(c.req.query('offset'), 0, 0, 100000);

  const filters = [sql`${chatSessions.deletedAt} is null`];

  if (channel) {
    filters.push(eq(chatSessions.channel, channel));
  }

  if (query) {
    filters.push(or(
      ilike(chatSessions.title, `%${query}%`),
      ilike(chatSessions.externalSessionId, `%${query}%`)
    )!);
  }

  const sessions = await db.query.chatSessions.findMany({
    where: and(...filters),
    orderBy: [desc(chatSessions.updatedAt)],
    limit,
    offset,
  });

  return c.json({ data: sessions, limit, offset });
};

export const createCreateChatSessionHandler = (db: DBClient): Handler => async (c) => {
  const body = await c.req.json();

  if (!body.title || !body.channel) {
    return c.json({ error: 'title and channel are required' }, 400);
  }

  const [created] = await db
    .insert(chatSessions)
    .values({
      title: body.title,
      channel: body.channel,
      externalSessionId: body.externalSessionId ?? null,
      participants: Array.isArray(body.participants) ? body.participants : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      metadata: body.metadata ?? null,
    })
    .returning();

  return c.json({ data: created }, 201);
};

export const createGetChatSessionHandler = (db: DBClient): Handler => async (c) => {
  const id = c.req.param('id');
  const session = await db.query.chatSessions.findFirst({
    where: and(eq(chatSessions.id, id), sql`${chatSessions.deletedAt} is null`),
  });

  if (!session) {
    return c.json({ error: 'session not found' }, 404);
  }

  return c.json({ data: session });
};

export const createUpdateChatSessionHandler = (db: DBClient): Handler => async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const [updated] = await db
    .update(chatSessions)
    .set({
      title: body.title,
      channel: body.channel,
      externalSessionId: body.externalSessionId,
      participants: body.participants,
      tags: body.tags,
      metadata: body.metadata,
      updatedAt: new Date(),
    })
    .where(and(eq(chatSessions.id, id), sql`${chatSessions.deletedAt} is null`))
    .returning();

  if (!updated) {
    return c.json({ error: 'session not found' }, 404);
  }

  return c.json({ data: updated });
};

export const createDeleteChatSessionHandler = (db: DBClient): Handler => async (c) => {
  const id = c.req.param('id');

  const [deleted] = await db
    .update(chatSessions)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(chatSessions.id, id), sql`${chatSessions.deletedAt} is null`))
    .returning();

  if (!deleted) {
    return c.json({ error: 'session not found' }, 404);
  }

  return c.json({ ok: true });
};

export const createListChatMessagesHandler = (db: DBClient): Handler => async (c) => {
  const sessionId = c.req.param('id');
  const query = c.req.query('query');
  const limit = toNumber(c.req.query('limit'), 50);
  const offset = toNumber(c.req.query('offset'), 0, 0, 100000);

  const filters = [eq(chatMessages.sessionId, sessionId), sql`${chatMessages.deletedAt} is null`];

  if (query) {
    filters.push(ilike(chatMessages.content, `%${query}%`));
  }

  const messages = await db.query.chatMessages.findMany({
    where: and(...filters),
    orderBy: [desc(chatMessages.createdAt)],
    limit,
    offset,
  });

  return c.json({ data: messages, limit, offset });
};

export const createCreateChatMessageHandler = (db: DBClient): Handler => async (c) => {
  const sessionId = c.req.param('id');
  const body = await c.req.json();

  if (!body.role || !body.content) {
    return c.json({ error: 'role and content are required' }, 400);
  }

  const session = await db.query.chatSessions.findFirst({
    where: and(eq(chatSessions.id, sessionId), sql`${chatSessions.deletedAt} is null`),
  });

  if (!session) {
    return c.json({ error: 'session not found' }, 404);
  }

  const [created] = await db
    .insert(chatMessages)
    .values({
      sessionId,
      role: body.role,
      channelMessageId: body.channelMessageId ?? null,
      sender: body.sender ?? null,
      content: body.content,
      metadata: body.metadata ?? null,
    })
    .returning();

  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId));

  return c.json({ data: created }, 201);
};

export const createIngestChatMessageHandler = (db: DBClient): Handler => async (c) => {
  const body = await c.req.json();

  if (!body.channel || !body.content) {
    return c.json({ error: 'channel and content are required' }, 400);
  }

  const externalSessionId = body.externalSessionId ?? body.channelThreadId ?? null;
  const title = body.title ?? `${body.channel}:${externalSessionId ?? 'default'}`;

  let session = await db.query.chatSessions.findFirst({
    where: and(
      eq(chatSessions.channel, body.channel),
      externalSessionId ? eq(chatSessions.externalSessionId, externalSessionId) : sql`${chatSessions.externalSessionId} is null`,
      sql`${chatSessions.deletedAt} is null`
    ),
  });

  if (!session) {
    const [createdSession] = await db
      .insert(chatSessions)
      .values({
        title,
        channel: body.channel,
        externalSessionId,
        participants: Array.isArray(body.participants) ? body.participants : [],
        tags: Array.isArray(body.tags) ? body.tags : [],
        metadata: body.sessionMetadata ?? null,
      })
      .returning();
    session = createdSession;
  }

  const [createdMessage] = await db
    .insert(chatMessages)
    .values({
      sessionId: session.id,
      role: body.role ?? 'user',
      channelMessageId: body.channelMessageId ?? null,
      sender: body.sender ?? null,
      content: body.content,
      metadata: body.metadata ?? null,
    })
    .returning();

  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, session.id));

  return c.json({ data: { session, message: createdMessage } }, 201);
};

export const createSearchChatMessagesHandler = (db: DBClient): Handler => async (c) => {
  const q = c.req.query('q');
  const channel = c.req.query('channel');
  const sessionId = c.req.query('sessionId');
  const limit = toNumber(c.req.query('limit'), 50);

  if (!q) {
    return c.json({ error: 'q is required' }, 400);
  }

  const filters = [
    ilike(chatMessages.content, `%${q}%`),
    sql`${chatMessages.deletedAt} is null`,
    sql`${chatSessions.deletedAt} is null`,
  ];

  if (channel) {
    filters.push(eq(chatSessions.channel, channel));
  }

  if (sessionId) {
    filters.push(eq(chatMessages.sessionId, sessionId));
  }

  const rows = await db
    .select({
      messageId: chatMessages.id,
      sessionId: chatMessages.sessionId,
      content: chatMessages.content,
      role: chatMessages.role,
      sender: chatMessages.sender,
      channel: chatSessions.channel,
      title: chatSessions.title,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
    .where(and(...filters))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  return c.json({ data: rows, query: q, limit });
};
