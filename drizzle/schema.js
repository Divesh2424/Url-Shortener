import { timestamp } from 'drizzle-orm/mysql-core';
import { int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const shortLinkTable = mysqlTable('short_link', {
  id: int().autoincrement().primaryKey(),
  url: varchar({ length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 25 }).notNull().unique(),
});

export const usersTable = mysqlTable('users', {
  id: int().autoincrement().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
