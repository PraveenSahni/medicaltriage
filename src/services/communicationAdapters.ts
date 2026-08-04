import crypto from "node:crypto";
import { randomUUID } from "node:crypto";
import { fetchWithRetry } from "../utils/httpRetry.js";
import type {
  CcpOutboundChannel,
  CcpSendResult,
  EmailSendInput,
  InboundMessage,
  MessagingSendInput,
  TransportAdapterStatus
} from "../types/communication.js";

export interface MessagingAdapter {
  readonly name: string;
  readonly live: boolean;
  send(message: MessagingSendInput): Promise<CcpSendResult>;
  verifyInbound(signature: string | undefined, url: string, params: Record<string, string>): boolean;
  parseInbound(params: Record<string, string>): InboundMessage | null;
}

export interface EmailAdapter {
  readonly name: string;
  readonly live: boolean;
  send(message: EmailSendInput): Promise<CcpSendResult>;
}

type TransportMode = "dry-run" | "live";

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  smsFrom?: string;
  whatsappFrom?: string;
};

type GraphConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  emailFrom: string;
};

let cachedGraphToken: { accessToken: string; expiresAtMs: number } | null = null;

function transportMode(): TransportMode {
  return process.env.CCP_TRANSPORT_MODE === "live" ? "live" : "dry-run";
}

function value(name: string): string | undefined {
  const raw = process.env[name];
  return raw && raw.trim() ? raw.trim() : undefined;
}

function isTwilioConfigured(): TwilioConfig | null {
  const accountSid = value("TWILIO_ACCOUNT_SID");
  const authToken = value("TWILIO_AUTH_TOKEN");

  if (!accountSid || !authToken) {
    return null;
  }

  return {
    accountSid,
    authToken,
    smsFrom: value("TWILIO_SMS_FROM"),
    whatsappFrom: value("TWILIO_WHATSAPP_FROM")
  };
}

function isGraphConfigured(): GraphConfig | null {
  const tenantId = value("MS_GRAPH_TENANT_ID");
  const clientId = value("MS_GRAPH_CLIENT_ID");
  const clientSecret = value("MS_GRAPH_CLIENT_SECRET");
  const emailFrom = value("EMAIL_FROM");

  if (!tenantId || !clientId || !clientSecret || !emailFrom) {
    return null;
  }

  return { tenantId, clientId, clientSecret, emailFrom };
}

function channelResult(
  channel: CcpOutboundChannel,
  provider: string,
  dryRun: boolean,
  message: string,
  ok = true,
  externalId?: string,
  error?: string
): CcpSendResult {
  return {
    ok,
    provider,
    channel,
    externalId,
    dryRun,
    message,
    error
  };
}

function normalizeWhatsappAddress(address: string): string {
  return address.startsWith("whatsapp:") ? address : `whatsapp:${address}`;
}

function safeCompare(valueA: string, valueB: string): boolean {
  const left = Buffer.from(valueA);
  const right = Buffer.from(valueB);
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

export class DryRunMessagingAdapter implements MessagingAdapter {
  readonly name = "dry-run-messaging";
  readonly live = false;

  async send(message: MessagingSendInput): Promise<CcpSendResult> {
    return channelResult(
      message.channel,
      this.name,
      true,
      "Dry-run transport: CCP approval was recorded, but no external WhatsApp/SMS message was sent.",
      true,
      `dry-run-${randomUUID()}`
    );
  }

  verifyInbound(): boolean {
    return transportMode() !== "live" || process.env.CCP_ALLOW_UNSIGNED_WEBHOOKS === "true";
  }

  parseInbound(params: Record<string, string>): InboundMessage | null {
    const body = params.Body ?? "";
    const from = params.From ?? "";
    const to = params.To ?? "";
    if (!body && !from) {
      return null;
    }

    return {
      id: `inbound-${randomUUID()}`,
      provider: this.name,
      providerMessageId: params.MessageSid,
      channel: from.startsWith("whatsapp:") || to.startsWith("whatsapp:") ? "whatsapp" : "sms",
      from,
      to,
      body,
      receivedAtIso: new Date().toISOString(),
      attachments: parseTwilioAttachments(params),
      raw: params
    };
  }
}

export class TwilioMessagingAdapter implements MessagingAdapter {
  readonly name = "twilio";
  readonly live = true;

  constructor(private readonly config: TwilioConfig) {}

  async send(message: MessagingSendInput): Promise<CcpSendResult> {
    const from = this.senderFor(message.channel);
    if (!from) {
      return channelResult(
        message.channel,
        this.name,
        false,
        `No Twilio ${message.channel} sender configured.`,
        false,
        undefined,
        `TWILIO_${message.channel === "whatsapp" ? "WHATSAPP" : "SMS"}_FROM is missing`
      );
    }

    const form = new URLSearchParams({
      To: message.channel === "whatsapp" ? normalizeWhatsappAddress(message.to) : message.to,
      From: message.channel === "whatsapp" ? normalizeWhatsappAddress(from) : from,
      Body: message.body
    });

    if (message.mediaUrl) {
      form.set("MediaUrl", message.mediaUrl);
    }

    const response = await fetchWithRetry(
      `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: form
      }
    );

    const payload = (await response.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number };
    if (!response.ok) {
      return channelResult(
        message.channel,
        this.name,
        false,
        "Twilio rejected the outbound message.",
        false,
        payload.sid,
        payload.message ?? response.statusText
      );
    }

    return channelResult(
      message.channel,
      this.name,
      false,
      "Twilio accepted the outbound message.",
      true,
      payload.sid ?? `twilio-${Date.now()}`
    );
  }

  verifyInbound(signature: string | undefined, url: string, params: Record<string, string>): boolean {
    if (!signature) {
      return false;
    }

    let data = url;
    for (const key of Object.keys(params).sort()) {
      data += key + params[key];
    }

    const expected = crypto.createHmac("sha1", this.config.authToken).update(data).digest("base64");
    return safeCompare(signature, expected);
  }

  parseInbound(params: Record<string, string>): InboundMessage | null {
    const body = params.Body ?? "";
    const from = params.From ?? "";
    const to = params.To ?? "";
    if (!body && !from) {
      return null;
    }

    return {
      id: `inbound-${randomUUID()}`,
      provider: this.name,
      providerMessageId: params.MessageSid,
      channel: from.startsWith("whatsapp:") || to.startsWith("whatsapp:") ? "whatsapp" : "sms",
      from,
      to,
      body,
      receivedAtIso: new Date().toISOString(),
      attachments: parseTwilioAttachments(params),
      raw: params
    };
  }

  private senderFor(channel: "sms" | "whatsapp"): string | undefined {
    return channel === "whatsapp" ? this.config.whatsappFrom : this.config.smsFrom;
  }
}

export class DryRunEmailAdapter implements EmailAdapter {
  readonly name = "dry-run-email";
  readonly live = false;

  async send(): Promise<CcpSendResult> {
    return channelResult(
      "email",
      this.name,
      true,
      "Dry-run transport: CCP approval was recorded, but no external email was sent.",
      true,
      `dry-run-${randomUUID()}`
    );
  }
}

export class MicrosoftGraphEmailAdapter implements EmailAdapter {
  readonly name = "microsoft-graph";
  readonly live = true;

  constructor(private readonly config: GraphConfig) {}

  async send(message: EmailSendInput): Promise<CcpSendResult> {
    const token = await getGraphToken(this.config);
    const mailbox = message.from ?? this.config.emailFrom;
    const payload = {
      message: {
        subject: message.subject,
        body: {
          contentType: "Text",
          content: message.body
        },
        toRecipients: [
          {
            emailAddress: {
              address: message.to
            }
          }
        ]
      },
      saveToSentItems: true
    };

    const response = await fetchWithRetry(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/sendMail`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return channelResult(
        "email",
        this.name,
        false,
        "Microsoft Graph rejected the outbound email.",
        false,
        undefined,
        errorPayload.error?.message ?? response.statusText
      );
    }

    return channelResult(
      "email",
      this.name,
      false,
      "Microsoft Graph accepted the outbound email request.",
      true,
      `graph-${Date.now()}`
    );
  }
}

async function getGraphToken(config: GraphConfig): Promise<string> {
  const now = Date.now();
  if (cachedGraphToken && cachedGraphToken.expiresAtMs > now + 60_000) {
    return cachedGraphToken.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: "https://graph.microsoft.com/.default"
  });

  const response = await fetchWithRetry(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? "Unable to acquire Microsoft Graph token.");
  }

  cachedGraphToken = {
    accessToken: payload.access_token,
    expiresAtMs: now + (payload.expires_in ?? 3600) * 1000
  };

  return cachedGraphToken.accessToken;
}

function parseTwilioAttachments(params: Record<string, string>) {
  const count = Number(params.NumMedia ?? 0);
  if (!Number.isFinite(count) || count <= 0) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => ({
    index,
    url: params[`MediaUrl${index}`] ?? "",
    contentType: params[`MediaContentType${index}`]
  })).filter((attachment) => attachment.url);
}

export function getMessagingAdapter(): MessagingAdapter {
  const configured = isTwilioConfigured();
  if (transportMode() === "live" && configured) {
    return new TwilioMessagingAdapter(configured);
  }
  return new DryRunMessagingAdapter();
}

export function getEmailAdapter(): EmailAdapter {
  const configured = isGraphConfigured();
  if (transportMode() === "live" && configured) {
    return new MicrosoftGraphEmailAdapter(configured);
  }
  return new DryRunEmailAdapter();
}

export function messagingAdapterStatus(): TransportAdapterStatus {
  const configured = Boolean(isTwilioConfigured());
  const mode = transportMode();
  return {
    mode,
    provider: mode === "live" && configured ? "twilio" : "dry-run-messaging",
    configured,
    live: mode === "live" && configured,
    notes: [
      "Twilio REST Messages API is used for SMS and WhatsApp when live mode and TWILIO_* secrets are configured.",
      "Inbound Twilio webhook signatures are verified with HMAC-SHA1 before parsing text and media attachments.",
      "Dry-run is the default so local demos cannot accidentally send a real message."
    ]
  };
}

export function emailAdapterStatus(): TransportAdapterStatus {
  const configured = Boolean(isGraphConfigured());
  const mode = transportMode();
  return {
    mode,
    provider: mode === "live" && configured ? "microsoft-graph" : "dry-run-email",
    configured,
    live: mode === "live" && configured,
    notes: [
      "Microsoft 365 Graph sendMail is used when live mode plus MS_GRAPH_* and EMAIL_FROM secrets are configured.",
      "Graph sendMail returns HTTP 202 with no provider message id, so the system stores a synthetic audit id.",
      "Mail.Send needs admin consent and production should lock app access to the approved mailbox."
    ]
  };
}
