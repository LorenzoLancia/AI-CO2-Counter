import { DEFAULTS } from "../common/config.js";

function load() {
  chrome.storage.local.get(DEFAULTS, (st) => {
    document.getElementById("WhPerRequest").value = st.WhPerRequest;
    document.getElementById("gCO2PerKWh").value = st.gCO2PerKWh;

    const tbody = document.querySelector("#providers tbody");
    tbody.innerHTML = "";
    Object.entries(st.providerMultipliers).forEach(([host, mult]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><code>${host}</code></td>
        <td><input type="number" step="0.1" min="0" value="${mult}" data-host="${host}" /></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function save() {
  const WhPerRequest = parseFloat(document.getElementById("WhPerRequest").value);
  const gCO2PerKWh = parseFloat(document.getElementById("gCO2PerKWh").value);

  const providerMultipliers = {};
  document.querySelectorAll('#providers tbody input[type="number"]').forEach((inp) => {
    providerMultipliers[inp.dataset.host] = parseFloat(inp.value);
  });

  chrome.storage.local.set({ WhPerRequest, gCO2PerKWh, providerMultipliers }, () => {
    alert("Impostazioni salvate.");
  });
}

function resetDefaults() {
  chrome.storage.local.set(DEFAULTS, () => {
    alert("Impostazioni ripristinate.");
    load();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("save").addEventListener("click", save);
  document.getElementById("reset").addEventListener("click", resetDefaults);
  load();
});

