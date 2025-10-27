// Background service worker (MV3, ES module)
// Calculates CO₂ for each AI request and maintains totals in storage.

import { DEFAULTS, gramsForOneRequest } from "../common/config.js";

async function getState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULTS, resolve);
  });
}

async function setState(patch) {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULTS, (curr) => {
      const next = { ...curr, ...patch };
      chrome.storage.local.set(next, () => resolve(next));
    });
  });
}

async function increment(host) {
  const state = await getState();
  const gramsLast = gramsForOneRequest(state, host);
  const totalRequests = (state.totalRequests ?? 0) + 1;
  const totalGrams = (state.totalGrams ?? 0) + gramsLast;
  const next = await setState({ totalRequests, totalGrams });
  updateBadge(next.totalGrams);
  return { gramsLast, ...next };
}

function updateBadge(totalGrams) {
  const text = Math.round(totalGrams || 0).toString() + "g";
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: "#000000" });
}

chrome.runtime.onStartup.addListener(async () => {
  const st = await getState();
  updateBadge(st.totalGrams);
});

chrome.runtime.onInstalled.addListener(async () => {
  const st = await getState();
  updateBadge(st.totalGrams);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "AI_REQUEST_SENT") {
    increment(msg.host).then((res) => sendResponse({ ok: true, state: res }));
    return true; // async response
  }
  if (msg?.type === "GET_STATE") {
    getState().then((st) => sendResponse(st));
    return true;
  }
  if (msg?.type === "RESET_COUNTERS") {
    setState({ totalRequests: 0, totalGrams: 0 }).then((st) => {
      updateBadge(0);
      sendResponse(st);
    });
    return true;
  }
});

