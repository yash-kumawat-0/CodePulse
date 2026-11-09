"use client";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain/simple hashed for client simulation
  avatar?: string;
  createdAt: number;
}

const ACCOUNTS_STORAGE_KEY = "devbattle_registered_accounts";
const SESSION_TOKEN_KEY = "devbattle_token";
const CURRENT_USER_KEY = "devbattle_current_user";

// Default seed accounts for out-of-the-box testing
const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    id: "dev-001",
    name: "Alex Developer",
    email: "developer@github.com",
    passwordHash: "DevPass123!",
    avatar: "https://avatars.githubusercontent.com/u/1?v=4",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "dev-002",
    name: "Demo User",
    email: "demo@devbattle.com",
    passwordHash: "Password123!",
    avatar: "https://avatars.githubusercontent.com/u/2?v=4",
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },
  {
    id: "dev-003",
    name: "Sarah Chen",
    email: "sarah@techcorp.com",
    passwordHash: "TechCorp2026!",
    avatar: "https://avatars.githubusercontent.com/u/3?v=4",
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
];

export function getRegisteredUsers(): UserAccount[] {
  if (typeof window === "undefined") {
    return DEFAULT_ACCOUNTS;
  }

  try {
    const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return JSON.parse(stored);
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveRegisteredUsers(users: UserAccount[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Fallback
    }
  }
}

/**
 * Checks if an email is already registered in the system
 */
export function isEmailRegistered(email: string): boolean {
  const users = getRegisteredUsers();
  const normalized = email.trim().toLowerCase();
  return users.some((u) => u.email.toLowerCase() === normalized);
}

/**
 * Registers a new user account
 */
export function registerUserAccount(data: {
  name: string;
  email: string;
  password: string;
}): { success: boolean; error?: string; user?: UserAccount } {
  const users = getRegisteredUsers();
  const normalizedEmail = data.email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return {
      success: false,
      error: "An account with this email address already exists. Please sign in instead.",
    };
  }

  const newUser: UserAccount = {
    id: `dev-${Date.now()}`,
    name: data.name.trim(),
    email: normalizedEmail,
    passwordHash: data.password,
    createdAt: Date.now(),
  };

  users.push(newUser);
  saveRegisteredUsers(users);

  // Set active session
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_TOKEN_KEY, `jwt_devbattle_${newUser.id}_${Date.now()}`);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  }

  return { success: true, user: newUser };
}

/**
 * Authenticates user credentials (verifies email and password)
 */
export function authenticateUser(
  email: string,
  password: string
): { success: boolean; error?: string; user?: UserAccount } {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return {
      success: false,
      error: "No account found with this email. Please check your email or sign up.",
    };
  }

  if (user.passwordHash !== password) {
    return {
      success: false,
      error: "Incorrect password. Please verify your password or use 'Forgot password?'.",
    };
  }

  // Set active session
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_TOKEN_KEY, `jwt_devbattle_${user.id}_${Date.now()}`);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  return { success: true, user };
}

/**
 * Updates a user's password (e.g. after password reset)
 */
export function updateUserPassword(
  email: string,
  newPassword: string
): { success: boolean; error?: string } {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const index = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

  if (index === -1) {
    // If not found, create or update demo entry
    users.push({
      id: `dev-${Date.now()}`,
      name: email.split("@")[0],
      email: normalizedEmail,
      passwordHash: newPassword,
      createdAt: Date.now(),
    });
  } else {
    users[index].passwordHash = newPassword;
  }

  saveRegisteredUsers(users);
  return { success: true };
}
