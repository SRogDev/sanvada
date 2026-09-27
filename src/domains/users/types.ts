import type { ISODateString, UUID } from "@/shared/types";

/**
 * Domain: users (PLAN §§7.1–7.2).
 * Application identity only. Authentication identity stays compatible with
 * Supabase Auth. Human Context NEVER lives here.
 */
export interface User {
  id: UUID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Profile {
  userId: UUID;
  displayName: string | null;
  avatarUrl: string | null;
  locale: string | null;
  timezone: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
