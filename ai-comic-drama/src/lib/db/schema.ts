import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const scripts = sqliteTable("scripts", {
  id: text("id").primaryKey(),
  locale: text("locale").notNull(),
  title: text("title").notNull(),
  titleEn: text("title_en"),
  characterSetup: text("character_setup").notNull(),
  characterSetupEn: text("character_setup_en"),
  worldSetup: text("world_setup").notNull(),
  worldSetupEn: text("world_setup_en"),
  stylePrompt: text("style_prompt").notNull().default(""),
  stylePromptEn: text("style_prompt_en"),
  referenceImageUrl: text("reference_image_url"),
  rootNodeId: text("root_node_id"),
  generationStatus: text("generation_status", {
    enum: ["pending", "generating", "ready", "partial_failure"],
  })
    .notNull()
    .default("pending"),
  totalScenes: integer("total_scenes").notNull().default(0),
  readyScenes: integer("ready_scenes").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const nodes = sqliteTable("nodes", {
  id: text("id").primaryKey(),
  scriptId: text("script_id")
    .notNull()
    .references(() => scripts.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  chosenOptionIndex: integer("chosen_option_index"),
  chosenOptionText: text("chosen_option_text"),
  chosenOptionTextEn: text("chosen_option_text_en"),
  narrative: text("narrative").notNull().default(""),
  narrativeEn: text("narrative_en"),
  imageUrl: text("image_url"),
  options: text("options", { mode: "json" }).$type<string[]>(),
  optionsEn: text("options_en", { mode: "json" }).$type<string[]>(),
  status: text("status", {
    enum: ["pending", "generating_text", "generating_image", "ready", "failed"],
  })
    .notNull()
    .default("pending"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const generationLogs = sqliteTable("generation_logs", {
  id: text("id").primaryKey(),
  nodeId: text("node_id")
    .notNull()
    .references(() => nodes.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["llm", "image"] }).notNull(),
  prompt: text("prompt").notNull(),
  response: text("response"),
  latencyMs: integer("latency_ms"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Script = typeof scripts.$inferSelect;
export type NewScript = typeof scripts.$inferInsert;
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
