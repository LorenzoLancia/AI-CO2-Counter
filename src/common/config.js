// Shared configuration and helpers for the extension
// Used by background and options pages (ES modules)

export const DEFAULTS = {
  providerMultipliers: {
    "chat.openai.com": 1.0,
    "chatgpt.com": 1.0,
    "www.chatgpt.com": 1.0,
    "gemini.google.com": 1.0,
    "claude.ai": 1.0,
    "perplexity.ai": 1.0,
    "www.perplexity.ai": 1.0,
    "www.bing.com": 1.0,
    "copilot.microsoft.com": 1.0
  },
  WhPerRequest: 1.0,
  gCO2PerKWh: 300,
  totalRequests: 0,
  totalGrams: 0
};

export function gramsForOneRequest(state, host) {
  const mult = state.providerMultipliers?.[host] ?? 1.0;
  const Wh = (state.WhPerRequest ?? 0) * mult;
  return (Wh / 1000) * (state.gCO2PerKWh ?? 0);
}

