export type SceneContext = {
  character: string;
  world: string;
  style: string;
  history: HistoryEntry[];
};

export type HistoryEntry = {
  narrative: string;
  chosenOption?: string;
};

export type SceneOutput = {
  narrative: string;
  imagePrompt: string;
  options: string[];
};
