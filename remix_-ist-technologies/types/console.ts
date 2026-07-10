export interface Skill {
  c: string; // cluster
  n: string; // name
  w?: string; // description
  u?: number; // UAE availability
  i?: number; // India availability
  d?: number; // Demand comparative score
}

export interface ProficiencyLevel {
  def?: string;
  course?: string;
  assess?: string;
  cert?: string;
}

export interface SkillProficiency {
  L1?: ProficiencyLevel;
  L2?: ProficiencyLevel;
  L3?: ProficiencyLevel;
  L4?: ProficiencyLevel;
}
