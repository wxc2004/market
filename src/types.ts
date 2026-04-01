export interface SkillMetadata {
  id: string;
  displayName: string;
  description: string;
  platforms: string[];
  defaultVersion: string;
}

export interface InstalledSkill {
  id: string;
  version: string;
  installedAt: string;
  platforms: string[];
}

export interface RegistryData {
  skills: Record<string, InstalledSkill>;
  lastUpdated: string;
}
