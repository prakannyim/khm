const $ = (id) => document.getElementById(id);

let API_BASE = "https://api.khmvoice.org";
const LANG_KEY = "khmvoice.ask.lang.v1";
const KEY = "khmvoice.ask.prompts.v1";

// Phase 2: tu pourras changer API_BASE vers un domaine API (ex: https://api.khmvoice.org)
// ou laisser "" si l’API est sur le même site.

function loadStore() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}

function saveStore(obj) {
  localStorage.setItem(KEY, JSON.stringify(obj));
}

function refreshList(selectId = null) {
  const store = loadStore();
  const list = $("promptList");
  list.innerHTML = "";
  const names = Object.keys(store).sort((a,b)=>a.localeCompare(b));
  if (names.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "(aucun prompt sauvegardé)";
    list.appendChild(opt);
    return;
  }
  for (const name of names) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    list.appendChild(opt);
  }
  if (selectId && store[selectId]) list.value = selectId;
}

function status(msg) { $("status").textContent = msg || ""; }

// --- Prompt actions ---
$("btnNew").onclick = () => {
  $("promptTitle").value = "";
  $("promptText").value = "";
  status("Nouveau prompt.");
};

$("btnSave").onclick = () => {
  const title = ($("promptTitle").value || "").trim();
  const text = ($("promptText").value || "").trim();
  if (!title) return status("Erreur: nom du prompt requis.");
  if (!text) return status("Erreur: prompt vide.");
  const store = loadStore();
  store[title] = text;
  saveStore(store);
  refreshList(title);
  status(`Sauvé: ${title}`);
};

$("btnLoad").onclick = () => {
  const name = $("promptList").value;
  const store = loadStore();
  if (!store[name]) return status("Rien à charger.");
  $("promptTitle").value = name;
  $("promptText").value = store[name];
  $("questionText").value=store[name];
  status(`Chargé: ${name}`);
};

$("btnRename").onclick = () => {
  const oldName = $("promptList").value;
  const store = loadStore();
  if (!store[oldName]) return status("Rien à renommer.");
  const newName = prompt("Nouveau nom :", oldName);
  if (!newName) return;
  const n = newName.trim();
  if (!n) return;
  if (store[n] && n !== oldName) return status("Erreur: ce nom existe déjà.");
  store[n] = store[oldName];
  if (n !== oldName) delete store[oldName];
  saveStore(store);
  refreshList(n);
  $("promptTitle").value = n;
  status(`Renommé: ${oldName} → ${n}`);
};

$("btnDelete").onclick = () => {
  const name = $("promptList").value;
  const store = loadStore();
  if (!store[name]) return status("Rien à supprimer.");
  if (!confirm(`Supprimer le prompt "${name}" ?`)) return;
  delete store[name];
  saveStore(store);
  refreshList();
  status(`Supprimé: ${name}`);
};

$("btnExport").onclick = () => {
  const store = loadStore();
  const blob = new Blob([JSON.stringify(store, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ask_prompts.json";
  a.click();
  URL.revokeObjectURL(a.href);
  status("Export JSON terminé.");
};

$("btnImport").onclick = () => $("importFile").click();

$("importFile").onchange = async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const txt = await f.text();
  try {
    const obj = JSON.parse(txt);
    if (typeof obj !== "object" || Array.isArray(obj)) throw new Error("bad json");
    saveStore(obj);
    refreshList();
    status("Import JSON terminé.");
  } catch {
    status("Erreur: JSON invalide.");
  } finally {
    e.target.value = "";
  }
};

// --- Chat actions ---
$("btnClear").onclick = () => {
  $("questionText").value = "";
  $("answerText").value = "";
  status("");
};

$("btnCopy").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("answerText").value || "");
    status("Copié ✅");
  } catch {
    status("Copie impossible (navigateur).");
  }
};

// Phase 1: si pas d’API, on met un mode “manual paste”
// Phase 2: on active l’appel à /api/chat
$("btnSend").onclick = async () => {
  const lang = $("langSel").value || "fr";
  const prompt = ($("promptText").value || "").trim();
  const q = ($("questionText").value || "").trim();
  if (!q) return status("Erreur: question vide.");

$("answerText").value =
`[LANG]\n${lang}\n\n[PROMPT]\n${prompt || "(vide)"}\n\n[QUESTION]\n${q}\n\n[COLLE LA RÉPONSE ICI]`;
  status("Envoi...");

  // Si pas d'API en phase 1, tu peux coller la réponse manuellement
  if (!API_BASE) {
    status("Phase 1: pas d’API. Copie ton prompt+question dans ChatGPT, puis colle la réponse ici.");
    $("answerText").value =
`[PROMPT]\n${prompt || "(vide)"}\n\n[QUESTION]\n${q}\n\n[COLLE LA RÉPONSE ICI]`;
    return;
  }

  // Phase 2 (quand API_BASE est défini)
  try {
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ prompt, question: q })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Erreur API");
    $("answerText").value = data.answer || "";
    status("OK");
  } catch (e) {
    status("Erreur: " + e.message);
  }
};

// init

refreshList();

$("langSel").addEventListener("change", () => {
  localStorage.setItem(LANG_KEY, $("langSel").value);
});

// restore language
const savedLang = localStorage.getItem(LANG_KEY);
if (savedLang && $("langSel")) $("langSel").value = savedLang;
status("Prêt.");
