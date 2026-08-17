export function resolveClinicalProtocolId(item: {
  matchedProtocolId?: string;
  preparedProtocol?: { primaryProtocolId?: string };
}): string | undefined {
  return item.matchedProtocolId ?? item.preparedProtocol?.primaryProtocolId;
}

export function exactQuestionCareAdvice<Advice extends { id: string }>(
  protocol: {
    questions: Array<{ id: string; careAdviceIds?: string[] }>;
    careAdvice: Advice[];
  },
  terminalQuestionId?: string
): Advice[] {
  if (!terminalQuestionId) {
    return [];
  }
  const question = protocol.questions.find((candidate) => candidate.id === terminalQuestionId);
  if (!question) {
    return [];
  }
  const approvedIds = new Set(question.careAdviceIds ?? []);
  return protocol.careAdvice.filter((advice) => approvedIds.has(advice.id));
}
