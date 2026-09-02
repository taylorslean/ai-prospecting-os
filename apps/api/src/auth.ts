import crypto from "node:crypto";
import { hash, verify, Algorithm } from "@node-rs/argon2";
import type { FastifyRequest, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

export const hashPassword = (s: string) =>
  hash(s, { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: Algorithm.Argon2id });

export const verifyPassword = (password: string, hashedPassword: string) =>
  verify(hashedPassword, password);

export const hashKey = (s: string) =>
  crypto.createHash("sha256").update(s).digest("hex");

export const randomToken = () =>
  crypto.randomBytes(32).toString("base64url");

export const tokenHash = (s: string) =>
  crypto.createHash("sha256").update(s).digest("hex");

export async function issueToken(app: FastifyInstance, userId: string, organizationId: string, role: string) {
  return (app as any).jwt.sign({ sub: userId, organizationId, role }, { expiresIn: "7d" });
}

export async function authContext(req: FastifyRequest, db: PrismaClient) {
  const raw = req.headers.authorization;
  if (!raw?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const payload = await (req.server as any).jwt.verify(raw.slice(7)) as { sub: string; organizationId: string; role: string };
  const m = await db.membership.findUnique({
    where: { userId_organizationId: { userId: payload.sub, organizationId: payload.organizationId } },
    include: { user: true, organization: true },
  });
  if (!m) throw new Error("UNAUTHORIZED");
  return m;
}

export function requireRole(role: string, allowed: string[]) {
  if (!allowed.includes(role)) throw new Error("FORBIDDEN");
}
