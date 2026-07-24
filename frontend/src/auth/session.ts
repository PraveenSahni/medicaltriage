export type AuthenticatedSession = {
  sessionId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    department: string;
    facility: string;
    roles: string[];
    accountStatus: string;
    mfaStatus: string;
  };
  activeRole: string;
  permissions: string[];
  expiresAtIso: string;
  mfaVerified: boolean;
};
