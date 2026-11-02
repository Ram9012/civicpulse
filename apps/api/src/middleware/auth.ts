import type { NextFunction, Request, Response } from "express";
import type { Profile, Role } from "@civicpulse/contract";
import { db } from "../db.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: Profile;
  }
}

/** Verifies the Supabase JWT and attaches the profile (role, department) to req.user. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer /i, "");
  if (!token) return res.status(401).json({ error: { code: "unauthenticated", message: "Missing token" } });

  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: { code: "unauthenticated", message: "Invalid token" } });
  }

  const { data: profile } = await db()
    .from("profiles")
    .select("id,name,role,department_id")
    .eq("id", data.user.id)
    .single();
  if (!profile) return res.status(403).json({ error: { code: "no_profile", message: "No profile" } });

  req.user = {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    departmentId: profile.department_id,
  };
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: "forbidden", message: "Insufficient role" } });
    }
    next();
  };
}
