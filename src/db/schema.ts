import { pgTable, uuid, text, timestamp, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';

export const ideaStatusEnum = pgEnum('idea_status', ['processing', 'ready', 'pursuing', 'deferred']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  replitId: text('replit_id').unique(),
  profile: jsonb('profile'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ideas = pgTable('ideas', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  rawInput: text('raw_input').notNull(),
  audioUrl: text('audio_url'),
  status: ideaStatusEnum('status').default('processing').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  statusChangedAt: timestamp('status_changed_at').defaultNow().notNull(),
});

export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  ideaId: uuid('idea_id').references(() => ideas.id).notNull(),
  version: integer('version').default(1).notNull(),
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ideaId: uuid('idea_id').references(() => ideas.id).notNull(),
  messages: jsonb('messages').default([]).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
