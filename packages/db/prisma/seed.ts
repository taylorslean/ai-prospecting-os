import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const db = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  try {
    const { hash, Algorithm } = await import("@node-rs/argon2");
    return hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: Algorithm.Argon2id });
  } catch {
    console.warn("WARNING: @node-rs/argon2 not available, falling back to SHA256 (dev only)");
    return crypto.createHash("sha256").update(password).digest("hex");
  }
}

async function main() {
  const org = await db.organization.upsert({
    where: { id: "demo-org" },
    update: {},
    create: { id: "demo-org", name: "Demo Organization", plan: "PRO" },
  });

  const passwordHash = await hashPassword("ChangeMe123!");

  const user = await db.user.upsert({
    where: { email: "owner@example.com" },
    update: { passwordHash },
    create: {
      id: "demo-user",
      email: "owner@example.com",
      name: "Demo Owner",
      passwordHash,
    },
  });

  await db.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: { role: "OWNER" },
    create: {
      id: "demo-membership",
      userId: user.id,
      organizationId: org.id,
      role: "OWNER",
    },
  });

  console.log("Seed completed: demo user owner@example.com / ChangeMe123!");
}

main().finally(() => db.$disconnect());