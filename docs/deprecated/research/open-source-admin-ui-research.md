# **Exhaustive Technical Audit and Architectural Blueprint for Enterprise Open-Source Administrative Control Center Implementation**

> Deprecated research snapshot retained for historical reference. It is not
> the authoritative description of the current application or remediation status.

## **Executive Summary & Market Gap Analysis**

A rigorous technical audit of open-source software repositories across GitHub confirms that no single, off-the-shelf application natively satisfies all functional requirements specified for the unified Administrative Control Center. The requested feature matrix synthesizes capabilities across four historically distinct enterprise software categories: Privileged Access Management (PAM), Identity Governance and Administration (IGA), frontend SaaS administrative UI scaffolds, and helpdesk workflow engines.  
Turnkey open-source PAM systems such as JumpServer1, Infisical3, CyberPAM4, and GatePlane5 provide robust infrastructure proxies, secret management, session recording, and time-bound credential elevation. However, these applications lack domain-specific enterprise governance tools, such as client-rendered Role × Responsibility cross-tabulation matrices, strict @irisstar.tech domain creation validation, clinical safety governance queues, and two-step dual-control PII reveal workflows with 60-second single-use fetch windows. Conversely, comprehensive open-source IGA frameworks like MidPoint deliver advanced entitlement governance and segregation of duties (SoD) capabilities6, but their monolithic architectures and complex user interfaces make it difficult to support lightweight, permission-gated frontend shells or isolated hash-based routes (\#/admin).  
To achieve complete functional coverage without introducing high maintenance overhead, an engineering team must synthesize a modern, modular frontend shell leveraging open-source admin dashboard frameworks—such as satnaing/shadcn-admin8 or marmelab/shadcn-admin-kit10—and connect it to dedicated microservices, API gateways, and specialized backend platforms like Zammad11.

| Platform Name | Primary Category | Underlying Tech Stack | Core Matching Capabilities | Critical Gap Analysis vs. Requirements |
| :---- | :---- | :---- | :---- | :---- |
| **JumpServer** | Enterprise PAM Platform | Python (Django), Vue.js, Go, GPL-3.01 | Session recording, MFA enforcement, granular RBAC, resource modification history1. | Lacks @irisstar.tech domain validation, dual-control 60s PII reveal, custom Role × Responsibility matrix, and clinical governance modules1. |
| **Infisical** | Secrets & PAM Platform | TypeScript, Node.js, Go, AGPL-3.0 / MIT3 | Just-in-time requests, approval workflows, secret rotation, immutable audit logs3. | Designed for infrastructure secrets and machine identities rather than application user directory management and clinical governance work items3. |
| **CyberPAM** | Zero Trust Access Gateway | Go, React, Dark-themed UI4 | ABAC/RBAC access controls, mandatory TOTP, local user lifecycle, dark-mode dashboard4. | Missing fine-grained PII directory masking, dual-control approval state machines, and multi-tab domain governance. |
| **GatePlane** | Just-In-Time PAM Engine | Go, HashiCorp Vault / OpenBao Plugin5 | Time-bound privilege elevation, automated expiration, request-approval metrics5. | Serves purely as a backend access engine; requires a custom frontend shell for full UI/UX integration5. |
| **MidPoint** | Identity Governance (IGA) | Java, XML, Apache 2.06 | Complex role hierarchies, segregation of duties enforcement, access recertifications6. | Monolithic layout; difficult to adapt into a lightweight standalone React route (\#/admin). |
| **shadcn-admin** (Sat Naing) | Admin UI Starter Template | React 19, Vite, TypeScript, Tailwind CSS, MIT8 | Standalone routing layout, light/dark themes, virtualized data tables, responsive menus8. | Frontend scaffold only; requires API integration for elevation state machines, dual-control logic, and audit feeds8. |
| **shadcn-admin-kit** (Marmelab) | Headless Admin Engine | React, ra-core, Radix UI, Open Source10 | Pre-built RBAC canAccess hooks, dynamic CRUD forms, client preference caching10. | Requires custom schema mapping for responsibility matrices and specific 60s dual-control PII fetch windows10. |

## **Domain-by-Domain Capability & Deficit Analysis**

### **Identity & Account Lifecycle Management**

The specification mandates a directory listing where email addresses, mobile numbers, and employee identifiers are masked by default, unmasking only when authorized elsewhere in the application through purpose-based controls14. User creation must serve as the exclusive minting point for named users, enforcing strict @irisstar.tech email domain validation, mandatory assignment of at least one real role, justification logging, privilege elevation gating, and issuance of a temporary one-time password. Furthermore, account suspension, reactivation, MFA resets, active session views, and targeted session terminations must be gated behind active privilege elevation and guarded against self-lockout so administrators cannot accidentally disable their own accounts or invalidate their active sessions.  
Standard administrative dashboard templates like satnaing/shadcn-admin incorporate data tables built on TanStack Table8, but frontend masking and elevation-gated action buttons require custom cell renderers and wrapper hooks. In identity provider backends, user creation handlers enforce email domain restrictions using standard regular expressions (^\[a-zA-Z0-9.\_%+-\]+@irisstar\\.tech$). Self-lockout prevention requires verifying that the target user identifier differs from the authenticated administrator's session identifier before executing administrative mutations.  
In the user creation workflow, the administrator must first hold active 15-minute TOTP elevation. Upon submitting a valid @irisstar.tech address, assigned role, and justification, the backend creates the named account, logs the justification to an immutable audit trail, and issues a temporary one-time password.

### **Roles, Responsibilities & Entitlement Governance**

The governance model requires a catalog of 19 real roles with live permission counts, descriptions, and expandable sub-tables detailing assigned rights. Granting or revoking permissions within a role must require privilege elevation, log justification notes, and enforce server-side self-lockout checks to prevent administrators from revoking role-management permissions from roles assigned to their own accounts. Open-source frameworks like marmelab/react-admin and shadcn-admin-kit provide RBAC authorization providers (authProvider.canAccess()) that map cleanly to role-permission hierarchies10.  
The responsibility layer requires a catalog tracking business functions, risk tiers, and conflicting-responsibility counts. A core requirement is the client-rendered Role × Responsibility Matrix. This dynamic grid maps assigned permissions across all 19 roles to evaluate organizational capabilities and highlight potential Segregation of Duties (SoD) risks.  
In the interactive matrix grid, roles are displayed along the vertical axis and business responsibilities along the horizontal axis. Intersections highlight granted privileges, displaying risk tier flags (Low, Medium, High, Critical) and surfacing conflicting responsibility alerts whenever a single role spans mutually exclusive business functions.

### **Access Control, PAM Elevation & Chronological Audit Trails**

Privileged access management requires a persistent PAM status widget capable of toggling elevation states ("Elevate now" / "De-elevate now"). Elevation must be secured by real Time-based One-Time Password (TOTP) verification and establish a strict 15-minute operational window. Engines like Infisical3 and CyberPAM4 enforce mandatory TOTP and time-bound session limits, while GatePlane provides automated privilege expiration5. Integrating this into a unified frontend shell requires binding the widget UI state to an ephemeral session token that automatically expires after 900 seconds.  
The PAM elevation process follows a strict sequence:

* The administrator clicks "Elevate Now" in the header widget, triggering a TOTP prompt.  
* Upon successful TOTP verification, the server issues a 15-minute elevated session token and starts a 900-second countdown timer in the UI widget.  
* While elevated, the administrator can perform restricted actions such as user creation, role modification, or MFA resets.  
* When the 900-second timer expires, or if the administrator clicks "De-elevate Now", the elevated token is invalidated, immediately restoring standard un-elevated access rights.

Auditability is supported by a resource modification history search tool that indexes resource identifiers and constructs chronological audit trails. Entitlement reviews are supplemented by access-certification lists with explicit acknowledgment tracking, alongside a 30-day access-revocation metrics card.

### **Privacy Architecture & Dual-Control PII Reveal Workflow**

Privacy compliance requires default masking across user directory views, single-step reveals for authorized single-field requests, and an enforced two-step dual-control workflow for high-risk PII data fields18.  
The dual-control approval process operates through a strict multi-user sequence:

* **Step 1: Request Submission**: The requester submits a PII reveal request specifying the target resource ID and business justification.  
* **Step 2: Independent Approval**: A different authorized administrator reviews and approves the request. The backend strictly blocks self-approval attempts.  
* **Step 3: Ephemeral Token Generation**: Upon approval, the server generates a single-use token valid for exactly 60 seconds.  
* **Step 4: Data Fetch & Token Invalidation**: The requester executes the fetch call within 60 seconds to view the unmasked PII. The token is immediately invalidated upon use or timeout.

While PII masking utilities exist in platforms like MoEngage14 and SnackBase15, the specific 60-second single-use token lifecycle and server-enforced dual-control approval state machine must be implemented within custom API gateway logic.

### **Security, Governance & External Support Queues**

The Security and Audit modules provide centralized oversight controls targeted at Security Administrator roles:

* **Security Infrastructure**: Identity Provider (IdP) lists, Single Sign-On (SSO) integration statuses, and active cryptographic encryption policies2.  
* **Immutable Audit Feed**: Filterable event streams spanning security events, operational queues, PII reveals, manual overrides, system integrations, and governance approvals.  
* **Domain Governance**: Work-item tracking for clinical safety metrics, protocol releases, policy exceptions, and quality assurance workflows.  
* **Role-Gated Domain Tabs**: Restricted navigation sections for Protocol Libraries, Integration Connector Statuses, Report Catalogs, and Support Ticket Queues (integrated via REST APIs with open-source helpdesks like Zammad12 or FreeScout21).

## **Control Center Component Blueprint & Technical Mapping**

To bridge the gap between off-the-shelf software and the required functional specification, each operational component is mapped to its underlying governance controls, open-source building blocks, and technical implementation strategies.

| Functional Component | Required Governance Controls | Off-the-Shelf Engine / Scaffolding | Implementation Strategy |
| :---- | :---- | :---- | :---- |
| **User Directory & Lifecycle** | Email/Mobile masking14, @irisstar.tech domain validation, temporary OTP issuance, self-lockout protection. | shadcn-admin User Pages8 \+ API Gateway. | Build TanStack Table components with custom cell formatters for masked PII15. Enforce domain validation and self-lockout logic within the API gateway layer. |
| **Role Catalog & Permissions** | 19 roles, live permission counting, elevation-gated permission editing, self-lockout prevention on role management. | marmelab/shadcn-admin-kit (ra-core)10 \+ Custom Permission Engine. | Implement expandable data tables rendering permission counts. Enforce elevation checks and self-lockout validation during role mutation API calls. |
| **Responsibility & SoD Matrix** | Business function tagging, risk tiering, client-side cross-tabulated Role × Responsibility matrix rendering. | Custom React 19 Component \+ TanStack Table8. | Derive the matrix on the client by evaluating assigned permissions across roles to render risk indicators and flag SoD conflicts. |
| **PAM Elevation Widget** | TOTP-gated privilege elevation, 15-minute operational window, forced de-elevation toggle4. | Infisical3 / GatePlane API5 \+ React Custom Widget. | Embed a persistent header widget tied to a 900-second TOTP token lifecycle4. Auto-reset UI authorization state upon countdown expiration. |
| **Dual-Control PII Reveal** | Requester/Approver separation, server-side self-approval blocking, 60s single-use fetch token18. | Custom Backend Workflow Engine \+ Redis Ephemeral Keys. | Implement a state-machine backend. Upon secondary approval, write a 60-second TTL single-use token to Redis that burns immediately after the initial read. |
| **Support Helpdesk Integration** | Live ticket queue rendering, ticket status manipulation, escalation tags. | Zammad REST API / MCP Server12 or FreeScout API21. | Embed a dedicated tab consuming Zammad's /api/v1/tickets endpoint12 with role-gated access rights. |
| **Overview Dashboard & Metrics** | Active module filtering based on role permissions, 8 live status tiles (active, locked, approvals, reveals, exports, privacy, security incidents). | shadcn-admin Metric Cards & Grid Layouts8. | Dynamically filter visible module cards based on active RBAC capabilities. Fetch metric aggregations from a time-series event store. |

## **Proposed Reference Architecture & Technology Stack Selection**

Because no single open-source repository contains this complete feature matrix, the optimal solution is a **Modular Control Center Architecture**. This approach utilizes an open-source React dashboard framework for the frontend shell, supported by lightweight microservices, ephemeral key stores, and API gateways.  
The reference architecture consists of three core operational tiers:

> 1. **Client Shell Tier (\#/admin)**: Built on React 19, Vite, Tailwind CSS, and TanStack Router using the shadcn-admin framework8. It hosts the dynamic module grid, PAM TOTP elevation widget, virtualized user tables, and client-rendered Role × Responsibility matrix.  
> 2. **Backend-for-Frontend (BFF) Gateway**: A lightweight Node.js or Go gateway that enforces @irisstar.tech domain validation, self-lockout checks, 15-minute elevation session windows, and server-side rejection of self-approval requests.  
> 3. **Microservices & Integration Layer**: Comprises a PostgreSQL identity store, Infisical/GatePlane PAM engines3, a Redis ephemeral store for 60-second PII tokens, an immutable audit log database, and external REST integrations with Zammad Helpdesk12.

### **Frontend Routing & Isolated Shell Mechanics (\#/admin)**

To ensure complete operational isolation, the administrative control center runs as an independent application route (\#/admin) detached from legacy application shells. Using TanStack Router or React Router within the Vite framework9, the control center defines an isolated layout root:

TypeScript  
import { createHashHistory, createRouter, createRoute, redirect } from '@tanstack/react-router';

const hashHistory \= createHashHistory();

const adminRootRoute \= createRoute({  
  id: 'admin-root',  
  path: '/admin',  
  component: AdminShellLayout,  
  beforeLoad: async ({ context }) \=\> {  
    const isAuthorized \= await context.auth.checkAdminRouteAccess();  
    if (\!isAuthorized) {  
      throw redirect({ to: '/unauthorized' });  
    }  
  },  
});

This structural isolation prevents legacy application constraints from affecting administrative components while ensuring route guards evaluate user entitlements before mounting top-level layout views.

### **Permission-Gated Module Rendering Engine**

The Overview tab presents eight live metric tiles alongside a dynamic grid of available module cards corresponding to system capabilities (e.g., User Directory, PAM Elevation, Clinical Governance).  
When a user logs in, the backend supplies an array of granular permissions. The dashboard iterates through configured module descriptors, rendering only the cards and navigation tabs for which the active role holds explicit permissions:

TypeScript  
interface ModuleDescriptor {  
  id: string;  
  title: string;  
  requiredPermission: string;  
  route: string;  
}

const MODULE\_CATALOG: ModuleDescriptor\[\] \= \[  
  { id: 'users', title: 'User Directory', requiredPermission: 'users:read', route: '/admin/users' },  
  { id: 'roles', title: 'Role Catalog', requiredPermission: 'roles:read', route: '/admin/roles' },  
  { id: 'pam', title: 'PAM Controls', requiredPermission: 'pam:elevate', route: '/admin/pam' },  
  { id: 'governance', title: 'Clinical Governance', requiredPermission: 'governance:clinical:read', route: '/admin/governance' },  
\];

export function ModuleGrid({ userPermissions }: { userPermissions: string\[\] }) {  
  const visibleModules \= MODULE\_CATALOG.filter(mod \=\>   
    userPermissions.includes(mod.requiredPermission)  
  );

  return (  
    \<div className\="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"\>  
      {visibleModules.map(mod \=\> (  
        \<ModuleCard key\={mod.id} data\={mod} /\>  
      ))}  
    \</div\>  
  );  
}

### **Two-Step Dual-Control Backend Controller**

The two-step dual-control state machine guarantees that sensitive PII data cannot be unmasked unilaterally by a single administrator:

TypeScript  
export async function approvePiiRequest(requestId: string, approverId: string) {  
  const request \= await db.piiRequests.findById(requestId);  
    
  if (request.requesterId \=== approverId) {  
    throw new Error("Security Violation: Requester and Approver must be distinct identities.");  
  }  
    
  const fetchToken \= crypto.randomUUID();  
  await redis.set(\`pii:token:${fetchToken}\`, request.targetResourceId, 'EX', 60);  
    
  await db.piiRequests.update(requestId, { status: 'APPROVED', token: fetchToken });  
  return { status: 'SUCCESS', fetchToken };  
}

export async function executePiiFetch(fetchToken: string, requesterId: string) {  
  const targetResourceId \= await redis.get(\`pii:token:${fetchToken}\`);  
  if (\!targetResourceId) {  
    throw new Error("Access Denied: Fetch token expired or invalid.");  
  }  
    
  await redis.del(\`pii:token:${fetchToken}\`);  
    
  await auditLog.record({ event: 'PII\_REVEAL\_EXECUTE', fetchToken, requesterId, targetResourceId });  
  return await db.piiData.fetchUnmasked(targetResourceId);  
}

## **Comparative Architectural Matrix**

To evaluate architectural choices, the following matrix compares adapting a monolithic PAM platform versus building a modular frontend shell connected to specialized backend microservices:

| Operational Dimension | Turnkey Monolithic PAM Adaptation (e.g., JumpServer) | Enterprise Headless IGA Engine (e.g., MidPoint) | Modular Shell Synthesis (shadcn-admin \+ BFF) |
| :---- | :---- | :---- | :---- |
| **Deployment Complexity** | Low for infrastructure connectivity; High for UI source modifications1. | Extremely High; requires complex XML schemas and heavy server infrastructure. | Moderate; requires API gateway development and frontend UI wiring. |
| **UI Customization Flexibility** | Low; constrained by monolithic frontend framework (Vue/Lina)1. | Rigid; constrained by standardized identity governance templates. | Complete control; React 19 components match exact layout specifications8. |
| **Dual-Control Logic Adaptation** | Requires modifying upstream backend core code1. | Supported via workflow scripts, but difficult to surface in a 60s fetch UI. | Fully native; state machines are managed directly in the API gateway tier. |
| **Domain Workflow Support** | None; non-infrastructure concepts must be built from scratch1. | Minimal; requires complex custom identity resource connectors. | High; governance tabs mount directly as modular React views consuming REST APIs. |
| **Long-Term Upgrade Risk** | High risk of fork divergence when pulling upstream security patches1. | Low core engine risk, but high ongoing configuration maintenance debt. | Minimal risk; clean separation between UI components and backend APIs10. |

## **Strategic Implementation Roadmap**

To systematically build and deploy the Control Center while minimizing integration risks, development should proceed across four structured phases.

| Phase | Core Objective | Key Deliverables & Technical Milestones |
| :---- | :---- | :---- |
| **Phase 1** | Shell Scaffolding & Route Isolation | Deploy satnaing/shadcn-admin scaffold on Vite/React 198. Establish hash-based routing (\#/admin), global dark/light layout themes, and dynamic sidebars8. |
| **Phase 2** | Core Identity & Dual-Control Engine | Build API gateway endpoints enforcing @irisstar.tech domain validation, self-lockout guards, 15-minute TOTP elevation, and Redis-backed 60s PII fetch tokens4. |
| **Phase 3** | Governance Grids & Matrix Engine | Construct the 19-role catalog with expandable permission views10. Implement the client-rendered Role × Responsibility cross-tabulation matrix using TanStack Table16. |
| **Phase 4** | Domain Integration & Queue Binding | Connect the Support Queue tab to the Zammad REST API12. Integrate Clinical Safety work-item queues, protocol catalogs, and the 8 live overview metric tiles. |

## **Nuanced Conclusions**

While no single open-source GitHub repository provides this complete feature set out of the box, assembling the platform from scratch is unnecessary. The optimal strategy utilizes an open-source React dashboard template (satnaing/shadcn-admin8 or marmelab/shadcn-admin-kit10) as the frontend shell, paired with a custom API gateway that coordinates dedicated open-source backend microservices and specialized engines like Zammad12.  
This architectural approach allows engineering teams to deliver a tailored Administrative Control Center UI, meet strict security and privacy governance standards, and maintain long-term code maintainability.

#### **Works cited**

> 1. JumpServer is an open-source Privileged Access ... \- GitHub, [https://github.com/jumpserver/jumpserver](https://github.com/jumpserver/jumpserver)  
> 2. JumpServer: Open-Source Privileged Access Management, [https://www.jumpserver.com/](https://www.jumpserver.com/)  
> 3. Infisical is the open-source platform for secrets, certificates ... \- GitHub, [https://github.com/infisical/infisical](https://github.com/infisical/infisical)  
> 4. RamboRogers/cyberpamnow: CyberPAM Instant PAM Solution, [https://github.com/RamboRogers/cyberpamnow](https://github.com/RamboRogers/cyberpamnow)  
> 5. GatePlane: Conditional Just-In-Time Privileged Access Management, [https://gateplane.io/](https://gateplane.io/)  
> 6. Principles and Practices of Management and Organizational Behavior, [https://dokumen.pub/principles-and-practices-of-management-and-organizational-behavior.html](https://dokumen.pub/principles-and-practices-of-management-and-organizational-behavior.html)  
> 7. Information Systems Security Misbehaviour in the ... \- SciSpace, [https://scispace.com/pdf/information-systems-security-misbehaviour-in-the-workplace-21ltshudoc.pdf](https://scispace.com/pdf/information-systems-security-misbehaviour-in-the-workplace-21ltshudoc.pdf)  
> 8. Shadcn Admin — Free React Template, [https://www.shadcn.io/template/satnaing-shadcn-admin](https://www.shadcn.io/template/satnaing-shadcn-admin)  
> 9. 10 Best shadcn/ui CRM Dashboard Templates 2026 \- AdminLTE.IO, [https://adminlte.io/blog/shadcn-ui-crm-dashboard-templates/](https://adminlte.io/blog/shadcn-ui-crm-dashboard-templates/)  
> 10. Shadcn Admin Kit | Open Source App Components \- Marmelab, [https://marmelab.com/shadcn-admin-kit/](https://marmelab.com/shadcn-admin-kit/)  
> 11. Zammad \- Open-Source Customer Service Helpdesk Platform \- GitHub, [https://github.com/zammad-helpdesk](https://github.com/zammad-helpdesk)  
> 12. Zammad MCP Server — Connect Claude, Cursor & LLMs ... \- GitHub, [https://github.com/Softoft-Orga/zammad-mcp-server](https://github.com/Softoft-Orga/zammad-mcp-server)  
> 13. Infisical/infisical at reactjsexample.com \- GitHub, [https://github.com/Infisical/infisical-cli?ref=reactjsexample.com](https://github.com/Infisical/infisical-cli?ref=reactjsexample.com)  
> 14. PII Masking \- User Guide, [https://help.moengage.com/hc/en-us/articles/5902573446804-PII-Masking](https://help.moengage.com/hc/en-us/articles/5902573446804-PII-Masking)  
> 15. SnackBase is a Python/FastAPI-based BaaS providing auto ... \- GitHub, [https://github.com/lalitgehani/SnackBase](https://github.com/lalitgehani/SnackBase)  
> 16. shadcn-admin · GitHub Topics, [https://github.com/topics/shadcn-admin](https://github.com/topics/shadcn-admin)  
> 17. react-admin/docs/AuthRBAC.md at master \- GitHub, [https://github.com/marmelab/react-admin/blob/master/docs/AuthRBAC.md](https://github.com/marmelab/react-admin/blob/master/docs/AuthRBAC.md)  
> 18. Top ARCON | IDAM Alternatives in 2026 \- Slashdot, [https://slashdot.org/software/p/ARCON-IDAM/alternatives](https://slashdot.org/software/p/ARCON-IDAM/alternatives)  
> 19. CGSS Certification Exam Study Guide: Global Sanctions Compliance, [https://studylib.net/doc/27775212/acams-cgss-en-g-study-guide-v1.57](https://studylib.net/doc/27775212/acams-cgss-en-g-study-guide-v1.57)  
> 20. Free Open-Source Ticketing Systems for MSPs (2026) \- OpenMSP, [https://www.openmsp.ai/blog/ticketing-system-open-source](https://www.openmsp.ai/blog/ticketing-system-open-source)  
> 21. Development Guide · freescout-help-desk/freescout Wiki \- GitHub, [https://github.com/freescout-help-desk/freescout/wiki/Development-Guide/643a6f43f77290b8c9f2d298ec7abef5c3e03d80](https://github.com/freescout-help-desk/freescout/wiki/Development-Guide/643a6f43f77290b8c9f2d298ec7abef5c3e03d80)  
> 22. Open-source Zendesk Alternatives: Self-Hosted AI Ticketing Systems, [https://www.nocobase.com/en/blog/open-source-zendesk-alternatives-self-hosted-ai-ticketing-systems](https://www.nocobase.com/en/blog/open-source-zendesk-alternatives-self-hosted-ai-ticketing-systems)  
> 23. GitHub \- shadcnstore/shadcn-dashboard-landing-template, [https://github.com/shadcnstore/shadcn-dashboard-landing-template](https://github.com/shadcnstore/shadcn-dashboard-landing-template)  
> 24. FreeScout \- Self-Hosted Help Desk for Shared Inbox Support \- GitHub, [https://github.com/FreeScout-customer-support](https://github.com/FreeScout-customer-support)  
> 25. Zammad and 3CX Integration Template \- GitHub, [https://github.com/Mancy/Zammad\_3CX](https://github.com/Mancy/Zammad_3CX)  
> 26. Shadcn Admin Dashboard Template \- Free & Pro, [https://shadcnstudio.com/templates/admin-dashboard](https://shadcnstudio.com/templates/admin-dashboard)
