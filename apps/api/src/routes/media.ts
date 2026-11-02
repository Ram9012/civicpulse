import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { db } from "../db.js";
import { HttpError, wrap } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { mediaUrl } from "../services/reports.js";

export const mediaRouter = Router();

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

const body = z.object({
  kind: z.enum(["photo", "video"]),
  contentType: z.string(),
  stage: z.enum(["original", "on_site", "proof"]).default("original"),
});

mediaRouter.post(
  "/upload-url",
  requireAuth,
  wrap(async (req, res) => {
    const user = req.user!;
    const b = body.parse(req.body);
    const ext = EXT[b.contentType];
    if (!ext || (b.kind === "photo") !== b.contentType.startsWith("image/")) {
      throw new HttpError(400, "unsupported_type", "Use JPEG, PNG or WEBP photos, or MP4, MOV or WEBM videos");
    }
    if (b.stage !== "original" && user.role === "citizen") {
      throw new HttpError(403, "forbidden", "Only staff can upload on-site or proof media");
    }

    const path = `${user.id}/${randomUUID()}.${ext}`;
    const { data, error } = await db().storage.from(config.mediaBucket).createSignedUploadUrl(path);
    if (error || !data) throw error ?? new Error("could not sign upload");

    const { data: row, error: insertError } = await db()
      .from("report_media")
      .insert({ kind: b.kind, stage: b.stage, storage_path: path, uploader_id: user.id })
      .select("id")
      .single();
    if (insertError || !row) throw insertError ?? new Error("could not record media");

    res.json({ mediaId: row.id, path, token: data.token, publicUrl: mediaUrl(path) });
  })
);
