"use client";

export interface PasswordResetTokenRecord {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number; // 15 mins in ms
  used: boolean;
}

const STORAGE_KEY = "devbattle_password_reset_tokens";
const EXPIRATION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// In-memory fallback
const inMemoryTokens = new Map<string, PasswordResetTokenRecord>();

export function getResetTokens(): Record<string, PasswordResetTokenRecord> {
  if (typeof window === "undefined") {
    const result: Record<string, PasswordResetTokenRecord> = {};
    inMemoryTokens.forEach((val, key) => {
      result[key] = val;
    });
    return result;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    const result: Record<string, PasswordResetTokenRecord> = {};
    inMemoryTokens.forEach((val, key) => {
      result[key] = val;
    });
    return result;
  }
}

function saveResetTokens(tokens: Record<string, PasswordResetTokenRecord>) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } catch {
      // Fallback
    }
  }
  Object.entries(tokens).forEach(([key, val]) => {
    inMemoryTokens.set(key, val);
  });
}

function generateSecureToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${crypto.randomUUID().replace(/-/g, "")}${Date.now().toString(36)}`;
  }
  return `cp_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
}

/**
 * Creates a single-use, 15-minute expiration password reset token
 */
export function createPasswordResetRequest(email: string): PasswordResetTokenRecord {
  const token = generateSecureToken();
  const now = Date.now();
  const record: PasswordResetTokenRecord = {
    token,
    email: email.trim().toLowerCase(),
    createdAt: now,
    expiresAt: now + EXPIRATION_DURATION_MS,
    used: false,
  };

  const currentTokens = getResetTokens();
  currentTokens[token] = record;
  saveResetTokens(currentTokens);

  return record;
}

/**
 * Verifies if a reset token is valid, unexpired, and single-use
 */
export function verifyResetToken(token: string): {
  valid: boolean;
  reason?: "invalid" | "expired" | "used";
  record?: PasswordResetTokenRecord;
} {
  if (!token) return { valid: false, reason: "invalid" };

  const tokens = getResetTokens();
  const record = tokens[token] || inMemoryTokens.get(token);

  if (!record) {
    return { valid: false, reason: "invalid" };
  }

  if (record.used) {
    return { valid: false, reason: "used", record };
  }

  if (Date.now() > record.expiresAt) {
    return { valid: false, reason: "expired", record };
  }

  return { valid: true, record };
}

/**
 * Consumes the reset token and marks it as used (single-use guarantee)
 */
export function completePasswordReset(token: string): boolean {
  const check = verifyResetToken(token);
  if (!check.valid || !check.record) {
    return false;
  }

  const tokens = getResetTokens();
  if (tokens[token]) {
    tokens[token].used = true;
    saveResetTokens(tokens);
  }

  if (inMemoryTokens.has(token)) {
    const mem = inMemoryTokens.get(token)!;
    mem.used = true;
    inMemoryTokens.set(token, mem);
  }

  return true;
}

