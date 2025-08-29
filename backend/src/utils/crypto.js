import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getKey() {
  const key = process.env.CREDENTIALS_ENCRYPTION_KEY || "";
  if (!key || key.length < 32) {
    throw new Error(
      "CREDENTIALS_ENCRYPTION_KEY must be a 32+ character string (32 bytes recommended)"
    );
  }
  // Use first 32 bytes of key material
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(Buffer.from(String(plaintext), "utf-8")),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptSecret(payload) {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf-8");
}

export function maskEmail(email) {
  if (!email || typeof email !== "string") return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const maskedName = name.length <= 2 ? name[0] + "*" : name[0] + "*".repeat(Math.max(1, name.length - 2)) + name[name.length - 1];
  return `${maskedName}@${domain}`;
}

