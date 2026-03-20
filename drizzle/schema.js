import { relations, sql } from 'drizzle-orm';
import { boolean, text, timestamp, int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const shortLinkTable = mysqlTable('short_link', {
  id: int().autoincrement().primaryKey(),
  url: varchar({ length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 25 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  userId: int("user_id").notNull().references(() => usersTable.id, {onDelete : "cascade"}),
});

export const sessionsTable = mysqlTable('sessions', {
  id: int().autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id, {onDelete : "cascade"}),
  valid: boolean().default(true).notNull(),
  userAgent: text("user_agent"),
  ip: varchar({length: 255}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull()
});

export const usersTable = mysqlTable('users', {
  id: int().autoincrement().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  isEmailValid: boolean("is_email_valid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const verifyEmailTokenTable = mysqlTable('verify_email_tokens', {
  id: int().autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => usersTable.id, {onDelete : "cascade"}),
  token: varchar({length: 8}).notNull(),
  expiresAt: timestamp('expires_at').default(sql`(CURRENT_TIMESTAMP + INTERVAL 1 DAY)`).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const usersRelation = relations(usersTable, ({many}) => ({
  shortLink : many(shortLinkTable),
  session : many(sessionsTable)
}))

export const shortLinkRealtion = relations(shortLinkTable, ({one}) => ({
  users : one(usersTable, {
    fields: [shortLinkTable.userId], //foreign key 
    references: [usersTable.id] //reference kis table k sath
  })
}))

export const sessionRealtion = relations(sessionsTable, ({one}) => ({
  users : one(usersTable, {
    fields: [sessionsTable.userId], //foreign key 
    references: [usersTable.id] //reference kis table k sath
  })
}))