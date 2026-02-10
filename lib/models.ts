export type ModelOption = {
  value: string;
  label: string;
};

export const MODEL_OPTIONS: ModelOption[] = [
  { value: "llama3.2", label: "llama 3.2 (local)" },
  { value: "deepseek-r1:8b", label: "deepseek-r1:8b (local)" },
  { value: "gemma3:27b", label: "gemma3:27b (local)" },
  { value: "gemini-1.5-flash", label: "gemini-1.5-flash" },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0].value;
