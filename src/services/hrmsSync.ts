import { z } from "zod";
import { releaseQueueLocksForUser } from "./queueOrchestration.js";
import {
  getDirectoryUserByEmployeeId,
  revokeSessionsForUser,
  upsertDirectoryUserFromHrms
} from "./securityAdmin.js";
import type { AuthenticatedSession, DirectoryStatus } from "../types/security.js";

export class HrmsSyncError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string
  ) {
    super(message);
  }
}

export const HrmsEmployeeRecordSchema = z.object({
  employeeId: z.string().min(2).max(80).optional(),
  ist_staff_id: z.string().min(2).max(80).optional(),
  hrmsId: z.string().min(2).max(120).optional(),
  username: z.string().min(2).max(180).optional(),
  email: z.string().email().optional(),
  fullName: z.string().min(1).max(180).optional(),
  full_name: z.string().min(1).max(180).optional(),
  mobile: z.string().min(6).max(40).optional(),
  organizationCode: z.string().min(2).max(20).optional(),
  organization_code: z.string().min(2).max(20).optional(),
  facility: z.string().min(1).max(160).optional(),
  department: z.string().min(1).max(160).optional(),
  clinicalSpecialty: z.string().min(1).max(160).optional(),
  clinical_specialty: z.string().min(1).max(160).optional(),
  jobTitle: z.string().min(1).max(160).optional(),
  job_title: z.string().min(1).max(160).optional(),
  professionalCategory: z.string().min(1).max(120).optional(),
  professional_category: z.string().min(1).max(120).optional(),
  manager: z.string().min(1).max(160).optional(),
  employmentStatus: z.string().min(2).max(60).optional(),
  employment_status: z.string().min(2).max(60).optional()
}).refine((record) => Boolean(record.employeeId ?? record.ist_staff_id), {
  message: "employeeId or ist_staff_id is required"
});

export const HrmsSyncRequestSchema = z.object({
  source: z.string().min(2).max(80).default("oracle-fusion-hcm"),
  employees: z.array(HrmsEmployeeRecordSchema).min(1).max(5000)
});
export type HrmsSyncRequest = z.infer<typeof HrmsSyncRequestSchema>;

export type HrmsSyncSummary = {
  source: string;
  processed: number;
  created: number;
  updated: number;
  disabled: number;
  sessionsRevoked: number;
  queueLocksReleased: number;
};

function directoryStatusFromHrms(status: string | undefined): DirectoryStatus {
  const normalized = (status ?? "Active").toLowerCase().replace(/[\s-]+/g, "_");
  if (["inactive", "terminated", "resigned", "disabled"].includes(normalized)) {
    return "inactive";
  }
  if (["on_leave", "leave", "medical_leave"].includes(normalized)) {
    return "on_leave";
  }
  if (["rest_period", "rest"].includes(normalized)) {
    return "rest_period";
  }
  return "active";
}

function roleFor(record: z.infer<typeof HrmsEmployeeRecordSchema>): string {
  const text = `${record.jobTitle ?? record.job_title ?? ""} ${record.department ?? ""}`.toLowerCase();
  if (text.includes("service manager") || text.includes("triage manager")) return "triage_service_manager";
  if (text.includes("intake") || text.includes("call handler") || text.includes("coordinator")) return "call_intake_coordinator";
  if (text.includes("pediatric") || text.includes("paediatric")) return "pediatric_triage_nurse";
  if (text.includes("senior")) return "senior_triage_nurse";
  if (text.includes("physician") || text.includes("doctor")) return "teleconsult_physician";
  if (text.includes("occupational")) return "occupational_health_clinician";
  return "remote_triage_nurse";
}

function isAuthorized(session: AuthenticatedSession | undefined, cronAuthorized: boolean): boolean {
  if (cronAuthorized) {
    return true;
  }
  return Boolean(
    session &&
      ["triage_service_manager", "platform_super_administrator", "system_administrator"].includes(session.activeRole)
  );
}

export async function syncUsersFromHrms(args: {
  request: HrmsSyncRequest;
  session?: AuthenticatedSession;
  cronAuthorized?: boolean;
}): Promise<HrmsSyncSummary> {
  if (!isAuthorized(args.session, args.cronAuthorized ?? false)) {
    throw new HrmsSyncError(403, "HRMS sync requires triage service manager or secure scheduler authority.", "HRMS_SYNC_DENIED");
  }

  const summary: HrmsSyncSummary = {
    source: args.request.source,
    processed: 0,
    created: 0,
    updated: 0,
    disabled: 0,
    sessionsRevoked: 0,
    queueLocksReleased: 0
  };

  for (const record of args.request.employees) {
    const employeeId = record.employeeId ?? record.ist_staff_id;
    if (!employeeId) {
      continue;
    }
    const directoryStatus = directoryStatusFromHrms(record.employmentStatus ?? record.employment_status);
    const organizationCode = record.organizationCode ?? record.organization_code ?? "PHCC";
    const role = roleFor(record);
    const result = upsertDirectoryUserFromHrms({
      employeeId,
      hrmsId: record.hrmsId,
      email: record.email ?? record.username,
      fullName: record.fullName ?? record.full_name,
      mobile: record.mobile,
      organizationCode,
      facility: record.facility,
      department: record.department,
      clinicalSpecialty: record.clinicalSpecialty ?? record.clinical_specialty,
      jobTitle: record.jobTitle ?? record.job_title,
      professionalCategory: record.professionalCategory ?? record.professional_category,
      manager: record.manager,
      roles: [role],
      directoryStatus
    });

    summary.processed += 1;
    if (result.created) {
      summary.created += 1;
    } else {
      summary.updated += 1;
    }

    if (directoryStatus !== "active") {
      const user = getDirectoryUserByEmployeeId(employeeId);
      if (user) {
        summary.disabled += 1;
        summary.sessionsRevoked += await revokeSessionsForUser(user.id);
        summary.queueLocksReleased += await releaseQueueLocksForUser(user.id);
      }
    }
  }

  return summary;
}
