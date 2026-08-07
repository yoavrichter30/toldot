export interface EraMeta {
  id: string;
  title: string;
  startDate: string;   // ISO "1904-01-01"
  endDate: string;     // ISO "1914-07-01"
  maxTurns: number;
  model: string;       // "qwen3.5:9b"
}

export interface EraConfig {
  locations: LocationConfig[];
  resources: {
    funds: number;
    people: number;
    publicTrust: number;
    ottomanTolerance: number;
  };
  foundationTracks: {
    settlementViability: number;
    economicIndependence: number;
    hebrewPublicLife: number;
    selfOrganization: number;
  };
  cohortTemplates: CohortTemplate[];
}

export interface LocationConfig {
  id: string;
  name: string;
  type: string;
  founded: number;
  initialHousing: number;
  initialWater: number;
  initialHealth: number;
  populationCapacity: number;
}

export interface CohortTemplate {
  id: string;
  name: string;
  size: number;
  skills: string[];
  preferredWork: string;
}

export interface Era {
  meta: EraMeta;
  config: EraConfig;
  promptTemplate: string;
  groundingDocs: string;
}