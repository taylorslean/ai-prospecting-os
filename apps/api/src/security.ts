import crypto from "node:crypto";
function key(){return Buffer.from((process.env.ENCRYPTION_KEY||"").padEnd(64,"0").slice(0,64),"hex")}
export function encryptSecret(v:string){const iv=crypto.randomBytes(12),c=crypto.createCipheriv("aes-256-gcm",key(),iv);const d=Buffer.concat([c.update(v,"utf8"),c.final()]);return `${iv.toString("hex")}:${c.getAuthTag().toString("hex")}:${d.toString("hex")}`}
export function decryptSecret(v:string){const [i,t,d]=v.split(":");const c=crypto.createDecipheriv("aes-256-gcm",key(),Buffer.from(i,"hex"));c.setAuthTag(Buffer.from(t,"hex"));return Buffer.concat([c.update(Buffer.from(d,"hex")),c.final()]).toString("utf8")}
