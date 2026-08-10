import { formatDurationMMSS } from "./formatDuration";

describe("formatDurationMMSS", () => {
  it("formats zero seconds", () => {
    expect(formatDurationMMSS(0)).toBe("00:00");
  });

  it("pads single-digit minutes and seconds", () => {
    expect(formatDurationMMSS(65)).toBe("01:05");
  });

  it("does not roll minutes over into hours", () => {
    expect(formatDurationMMSS(125 * 60 + 7)).toBe("125:07");
  });

  it("floors fractional seconds", () => {
    expect(formatDurationMMSS(59.9)).toBe("00:59");
  });

  it("clamps negative durations to zero", () => {
    expect(formatDurationMMSS(-5)).toBe("00:00");
  });
});
