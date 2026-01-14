import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_REPLIT_ID = 'default-user'

let defaultUserId: string | null = null

export async function ensureDefaultUser(): Promise<string> {
  if (defaultUserId) {
    return defaultUserId
  }

  // Check if default user exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.replitId, DEFAULT_REPLIT_ID))
    .limit(1)

  if (existing.length > 0) {
    defaultUserId = existing[0].id
    return defaultUserId
  }

  // Create default user
  const [newUser] = await db
    .insert(users)
    .values({
      replitId: DEFAULT_REPLIT_ID,
      profile: { name: 'Default User' },
    })
    .returning()

  defaultUserId = newUser.id
  return defaultUserId
}

export function getDefaultUserId(): string {
  if (!defaultUserId) {
    throw new Error('Default user not initialized. Call ensureDefaultUser() first.')
  }
  return defaultUserId
}
