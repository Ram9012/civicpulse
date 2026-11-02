import type { NextFunction, Request, Response } from "express";
import type { Profile, Role } from "@civicpulse/contract";
import { db } from "../db.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: Profile;
  }
}

const unauthenticated = (res: Response, message: string) =>
  res.status(401).json({ error: { code: "unauthenticated", message } });

async function loadProfile(token: string): Promise<Profile | null> {
  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await db()
    .from("profiles")
    .select("id,name,role,department_id")
    .eq("id", data.user.id)
    .single();
  if (!profile) return null;
  return { id: profile.id, name: profile.name, role: profile.role, departmentId: profile.department_id };
}

const bearer = (req: Request) => req.headers.authorization?.replace(/^Bearer /i, "");

/** Verifies the Supabase JWT and attaches the profile (role, department) to req.user. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) return unauthenticated(res, "Missing token");
  try {
    const profile = await loadProfile(token);
    if (!profile) return unauthenticated(res, "Invalid token");
    req.user = profile;
    next();
  } catch (e) {
    next(e);
  }
}

/** Like requireAuth but anonymous callers pass through with req.user unset (public endpoints). */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) return next();
  try {
    const profile = await loadProfile(token);
    if (profile) req.user = profile;
    next();
  } catch (e) {
    next(e);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: "forbidden", message: "Insufficient role" } });
    }
    next();
  };
}
