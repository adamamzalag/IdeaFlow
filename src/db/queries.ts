import { db, schema } from './index';
import { eq } from 'drizzle-orm';

export async function getIdeasByUserId(userId: string) {
  return db.query.ideas.findMany({
    where: eq(schema.ideas.userId, userId),
    orderBy: (ideas, { desc }) => [desc(ideas.createdAt)],
  });
}

export async function getIdeaById(ideaId: string) {
  return db.query.ideas.findFirst({
    where: eq(schema.ideas.id, ideaId),
  });
}

export async function createIdea(data: {
  userId: string;
  rawInput: string;
  audioUrl?: string;
}) {
  const [idea] = await db.insert(schema.ideas).values({
    userId: data.userId,
    rawInput: data.rawInput,
    audioUrl: data.audioUrl,
    status: 'processing',
  }).returning();
  return idea;
}

export async function updateIdeaStatus(ideaId: string, status: 'processing' | 'ready' | 'pursuing' | 'deferred') {
  const [idea] = await db.update(schema.ideas)
    .set({ 
      status, 
      statusChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.ideas.id, ideaId))
    .returning();
  return idea;
}

export async function getAnalysisByIdeaId(ideaId: string) {
  return db.query.analyses.findFirst({
    where: eq(schema.analyses.ideaId, ideaId),
    orderBy: (analyses, { desc }) => [desc(analyses.version)],
  });
}

export async function createAnalysis(data: {
  ideaId: string;
  content: unknown;
  version?: number;
}) {
  const [analysis] = await db.insert(schema.analyses).values({
    ideaId: data.ideaId,
    content: data.content,
    version: data.version || 1,
  }).returning();
  return analysis;
}

export async function getConversationByIdeaId(ideaId: string) {
  return db.query.conversations.findFirst({
    where: eq(schema.conversations.ideaId, ideaId),
  });
}

export async function upsertConversation(ideaId: string, messages: unknown[]) {
  const existing = await getConversationByIdeaId(ideaId);
  
  if (existing) {
    const [conversation] = await db.update(schema.conversations)
      .set({ 
        messages, 
        updatedAt: new Date(),
      })
      .where(eq(schema.conversations.id, existing.id))
      .returning();
    return conversation;
  } else {
    const [conversation] = await db.insert(schema.conversations).values({
      ideaId,
      messages,
    }).returning();
    return conversation;
  }
}
