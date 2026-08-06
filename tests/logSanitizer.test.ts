import { sanitizeForLog } from "../src/utils/logSanitizer.js";

describe("sanitizeForLog", () => {
  test("redacts an email field", () => {
    const result = sanitizeForLog({ email: "layla@irisstar.tech", other: "keep" }) as Record<string, unknown>;
    expect(result.email).toBe("***REDACTED***");
    expect(result.other).toBe("keep");
  });

  test("redacts a phone/mobile field", () => {
    const result = sanitizeForLog({ phone: "+974 5551234", mobile: "+974 5551234" }) as Record<string, unknown>;
    expect(result.phone).toBe("***REDACTED***");
    expect(result.mobile).toBe("***REDACTED***");
  });

  test("redacts clinical narrative fields", () => {
    const result = sanitizeForLog({
      medicalNarrative: "Patient reports chest pain",
      symptoms: "chest pain, sweating",
      diagnosis: "suspected MI"
    }) as Record<string, unknown>;
    expect(result.medicalNarrative).toBe("***REDACTED***");
    expect(result.symptoms).toBe("***REDACTED***");
    expect(result.diagnosis).toBe("***REDACTED***");
  });

  test("redacts token/cookie/password/secret/authorization fields", () => {
    const result = sanitizeForLog({
      password: "hunter2",
      token: "abc.def.ghi",
      cookie: "sid=abc123",
      secret: "totp-secret",
      authorization: "Bearer abc123",
      otp: "123456"
    }) as Record<string, unknown>;
    expect(result.password).toBe("***REDACTED***");
    expect(result.token).toBe("***REDACTED***");
    expect(result.cookie).toBe("***REDACTED***");
    expect(result.secret).toBe("***REDACTED***");
    expect(result.authorization).toBe("***REDACTED***");
    expect(result.otp).toBe("***REDACTED***");
  });

  test("redacts nested objects", () => {
    const result = sanitizeForLog({
      user: { profile: { email: "a@b.com", name: "ok" } }
    }) as { user: { profile: { email: unknown; name: unknown } } };
    expect(result.user.profile.email).toBe("***REDACTED***");
    expect(result.user.profile.name).toBe("ok");
  });

  test("redacts sensitive fields inside arrays", () => {
    const result = sanitizeForLog([{ email: "a@b.com" }, { email: "c@d.com" }]) as Array<Record<string, unknown>>;
    expect(result[0].email).toBe("***REDACTED***");
    expect(result[1].email).toBe("***REDACTED***");
  });

  test("bounds array length", () => {
    const input = Array.from({ length: 100 }, (_, i) => i);
    const result = sanitizeForLog(input) as unknown[];
    expect(result.length).toBe(26); // 25 items + one truncation marker
    expect(String(result[25])).toMatch(/more/);
  });

  test("sanitizes Error objects without leaking a raw stack", () => {
    const error = new Error("Something failed for user email a@b.com");
    const result = sanitizeForLog(error) as Record<string, unknown>;
    expect(result.name).toBe("Error");
    expect(result.message).toContain("Something failed");
    expect(result.stack).toBeUndefined();
  });

  test("handles circular references without throwing", () => {
    const circular: Record<string, unknown> = { name: "test" };
    circular.self = circular;
    expect(() => sanitizeForLog(circular)).not.toThrow();
    const result = sanitizeForLog(circular) as Record<string, unknown>;
    expect(result.self).toBe("[Circular]");
  });

  test("does not mutate the original input", () => {
    const input = { email: "a@b.com", nested: { phone: "123" } };
    const snapshot = JSON.parse(JSON.stringify(input));
    sanitizeForLog(input);
    expect(input).toEqual(snapshot);
  });

  test("preserves safe operational fields", () => {
    const result = sanitizeForLog({
      requestId: "req-123",
      method: "GET",
      path: "/api/v1/queue",
      statusCode: 200,
      durationMs: 42
    }) as Record<string, unknown>;
    expect(result).toEqual({
      requestId: "req-123",
      method: "GET",
      path: "/api/v1/queue",
      statusCode: 200,
      durationMs: 42
    });
  });

  test("truncates very long strings", () => {
    const longString = "a".repeat(5_000);
    const result = sanitizeForLog({ note: longString }) as Record<string, unknown>;
    expect((result.note as string).length).toBeLessThan(5_000);
    expect(result.note).toContain("truncated");
  });
});
