import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const sql = neon(connectionString);

export type DbDocument = {
  id: string;
  title: string;
  mode: string;
  content: unknown;
  synopsis: string;
  created_at: string;
  updated_at: string;
};
