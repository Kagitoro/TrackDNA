export type SectionType = "intro" | "groove" | "build" | "drop" | "breakdown" | "second_drop" | "outro";

export type KickFeatures = {
  punch: number;
  hardness: number;
  length: number;
  brightness: number;
  straightFourOnFloor: number;
  subWeight: number;
  transientStrength: number;
};

export type BassFeatures = {
  rolling: number;
  stabby: number;
  sustained: number;
  aggression: number;
  grooveComplexity: number;
  noteDensity: number;
  syncopation: number;
  subWeight: number;
  midBassPresence: number;
  bassHookStrength: number;
};

export type VocalFeatures = {
  present: boolean;
  density: number;
  shortHook: number;
  spoken: number;
  sung: number;
  repetitive: number;
  maleProbability?: number;
  femaleProbability?: number;
};

export type GrooveFeatures = {
  swing: number;
  syncopation: number;
  percussionDensity: number;
  grooveStrength: number;
  offbeatBassStrength: number;
};

export type DropFeatures = {
  bpm: number;
  key?: string;
  energy: number;
  darkness: number;
  brightness: number;
  arrangementDensity: number;
  dropImpact: number;
  lowEndEntryDelay: number;
  startsWithFullKickBass: boolean;
  melodyDensity: number;
  vocalDensity: number;
  swing: number;
  syncopation: number;
  kick: KickFeatures;
  bass: BassFeatures;
  vocal: VocalFeatures;
  groove: GrooveFeatures;
  embedding: number[];
};
