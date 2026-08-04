const ARABIC_HEADING_PREFIX = "## العربية";

export type SplitBilingualSbarNote = {
  english: string;
  arabic: string | null;
};

// Tolerant, display-only split of the bilingual SOAP/SBAR Markdown produced by
// src/services/triageNoteCompiler.ts. Never throws: notes that predate the
// bilingual format (or any unexpected shape) just fall back to today's
// behavior - the whole string rendered as English, no Arabic block.
export function splitBilingualSbarNote(noteText: string | undefined | null): SplitBilingualSbarNote {
  if (!noteText) {
    return { english: "", arabic: null };
  }

  const index = noteText.indexOf(ARABIC_HEADING_PREFIX);
  if (index === -1) {
    return { english: noteText.trim(), arabic: null };
  }

  return {
    english: noteText.slice(0, index).trim(),
    arabic: noteText.slice(index).trim()
  };
}
