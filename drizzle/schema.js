import { relations } from 'drizzle-orm';
import { boolean, text, timestamp } from 'drizzle-orm/mysql-core';
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const shortLinkTable = mysqlTable('short_link', {
  id: int().autoincrement().primaryKey(),
  url: varchar({ length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 25 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  userId: int("user_id").notNull().references(() => usersTable.id),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

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