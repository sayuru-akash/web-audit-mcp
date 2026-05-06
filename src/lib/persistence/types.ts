import type {
  AuditRun,
  Finding,
  Metric,
  Notification,
  PasswordResetToken,
  Session,
  ShareLink,
  StoreData,
  User,
  Website,
} from "@/lib/types";

export type StoreHealth = {
  ok: boolean;
  path?: string;
  sizeBytes?: number;
  updatedAt?: string;
  version?: number;
  error?: string;
  provider?: "json" | "postgres";
};

export type StoreAdapter = {
  provider: "json" | "postgres";
  readStore(): Promise<StoreData>;
  updateStore<T>(mutator: (data: StoreData) => T | Promise<T>): Promise<T>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(
    input: Omit<User, "createdAt" | "updatedAt"> & {
      createdAt?: string;
      updatedAt?: string;
    },
  ): Promise<User>;
  updateUser(
    userId: string,
    updates: Partial<Omit<User, "id" | "createdAt">>,
  ): Promise<User>;
  findUserBySession(tokenHash: string): Promise<User | undefined>;
  createSession(input: Session): Promise<Session>;
  deleteSessionByTokenHash(tokenHash: string): Promise<void>;
  deleteSessionsForUser(userId: string): Promise<void>;
  createPasswordResetToken(
    input: PasswordResetToken,
  ): Promise<PasswordResetToken>;
  getValidPasswordResetToken(
    tokenHash: string,
  ): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(tokenId: string, usedAt: string): Promise<void>;
  getUserDashboard(userId: string): Promise<{
    data: StoreData;
    websites: StoreData["websites"];
    audits: StoreData["audits"];
    notifications: StoreData["notifications"];
  }>;
  getAuditReport(
    auditId: string,
    userId?: string,
  ): Promise<{
    website?: Website;
    audit?: AuditRun;
    findings: Finding[];
    metrics: Metric[];
    share?: ShareLink;
  }>;
  getSharedAuditReport(token: string): Promise<{
    website?: Website;
    audit?: AuditRun;
    findings: Finding[];
    metrics: Metric[];
    share?: ShareLink;
  }>;
  checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<boolean>;
  pruneExpiredSecurityRecords(): Promise<void>;
  getStoreHealth(): Promise<StoreHealth>;
};
