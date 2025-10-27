function formatCO2(grams) {
  const g = Number(grams) || 0;
  if (Math.abs(g) >= 1000) return (g / 1000).toFixed(2) + " kg";
  return g.toFixed(2) + " g";
}

function refresh() {
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (st) => {
    if (!st) return;
    const total = Number.isFinite(st.totalGrams) ? formatCO2(st.totalGrams) : "0.00 g";
    document.getElementById("total").textContent = total;
    document.getElementById("reqs").textContent = String(st.totalRequests);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  refresh();
  document.getElementById("reset").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "RESET_COUNTERS" }, () => refresh());
  });
  document.getElementById("openOptions").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
});

