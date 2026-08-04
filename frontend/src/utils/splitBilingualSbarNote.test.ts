import { splitBilingualSbarNote } from "./splitBilingualSbarNote";

describe("splitBilingualSbarNote", () => {
  it("splits a bilingual note on the Arabic heading", () => {
    const note = "## English\nSituation: test\n\n## العربية - ملخص الحالة السريرية\nالحالة: اختبار";
    const { english, arabic } = splitBilingualSbarNote(note);

    expect(english).toBe("## English\nSituation: test");
    expect(arabic).toBe("## العربية - ملخص الحالة السريرية\nالحالة: اختبار");
  });

  it("falls back to treating the whole string as English when no Arabic heading is found", () => {
    const note = "## English\nSituation: legacy note, never had Arabic captured";
    const { english, arabic } = splitBilingualSbarNote(note);

    expect(english).toBe(note);
    expect(arabic).toBeNull();
  });

  it("returns empty english and null arabic for undefined/null/empty input", () => {
    expect(splitBilingualSbarNote(undefined)).toEqual({ english: "", arabic: null });
    expect(splitBilingualSbarNote(null)).toEqual({ english: "", arabic: null });
    expect(splitBilingualSbarNote("")).toEqual({ english: "", arabic: null });
  });
});
