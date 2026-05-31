import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, serial, index } from "drizzle-orm/pg-core";

// System table - DO NOT DELETE
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// Game categories
export const categories = pgTable(
  "categories",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }),
    sort_order: integer("sort_order").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("categories_slug_idx").on(table.slug),
  ]
);

// Tags for games
export const tags = pgTable(
  "tags",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 50 }).notNull().unique(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tags_name_idx").on(table.name),
  ]
);

// Games
export const games = pgTable(
  "games",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }),
    description: text("description"),
    cover_image: text("cover_image"),
    category_id: varchar("category_id", { length: 36 }).notNull().references(() => categories.id),
    developer: varchar("developer", { length: 200 }),
    publisher: varchar("publisher", { length: 200 }),
    release_date: varchar("release_date", { length: 50 }),
    platform: varchar("platform", { length: 50 }).default("pc").notNull(),
    video_url: text("video_url"),
    screenshots: jsonb("screenshots").$type<string[]>(),
    min_specs: jsonb("min_specs").$type<Record<string, string>>(),
    rec_specs: jsonb("rec_specs").$type<Record<string, string>>(),
    likes: integer("likes").default(0).notNull(),
    is_featured: boolean("is_featured").default(false).notNull(),
    download_url: text("download_url"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("games_category_id_idx").on(table.category_id),
    index("games_platform_idx").on(table.platform),
    index("games_created_at_idx").on(table.created_at),
    index("games_is_featured_idx").on(table.is_featured),
  ]
);

// Game-Tag junction table
export const gameTags = pgTable(
  "game_tags",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    game_id: varchar("game_id", { length: 36 }).notNull().references(() => games.id, { onDelete: "cascade" }),
    tag_id: varchar("tag_id", { length: 36 }).notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("game_tags_game_id_idx").on(table.game_id),
    index("game_tags_tag_id_idx").on(table.tag_id),
  ]
);

// Comments
export const comments = pgTable(
  "comments",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    game_id: varchar("game_id", { length: 36 }).notNull().references(() => games.id, { onDelete: "cascade" }),
    nickname: varchar("nickname", { length: 100 }).notNull(),
    avatar: varchar("avatar", { length: 500 }),
    content: text("content").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("comments_game_id_idx").on(table.game_id),
    index("comments_created_at_idx").on(table.created_at),
  ]
);
