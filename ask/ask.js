const $ = (id) => document.getElementById(id);

let API_BASE = "https://ask-api-r25z.onrender.com";

const LANG_KEY = "khmvoice.ask.lang.v1";
const KEY = "khmvoice.ask.prompts.v1";
const lang = document.getElementById("langSel").value;
const prompt = document.getElementById("promptInput").value.trim();
const question = document.getElementById("questionInput").value.trim();


// Phase 2: tu pourras changer API_BASE vers un domaine API (ex: https://api.khmvoice.org)
// ou laisser "" si l’API est sur le même site.

const answerBox = document.getElementById("answerBox");
const loading = document.getElementById("loading");

loading.hidden = false;
answerBox.innerText = "";

fetch(API_BASE + "/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    lang,
    prompt,
    question
  })
})
.then(r => r.json())
.then(data => {
  loading.hidden = true;
  answerBox.innerText = data.answer || "Aucune réponse.";
  answerBox.scrollIntoView({ behavior: "smooth" });
})
.catch(err => {
  loading.hidden = true;
  answerBox.innerText = "Erreur de connexion.";
});




const PROMPTS_KEY = "khmvoice.ask.prompts.v1";
const ACTIVE_PROMPT_KEY = "khmvoice.ask.activePromptId.v1";

function loadPrompts() {
  try { return JSON.parse(localStorage.getItem(PROMPTS_KEY) || "[]"); }
  catch { return []; }
}

function savePrompts(arr) {
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(arr));
}

function uid() {
  return "p_" + Math.random().toString(36).slice(2, 10);
}

function getActivePromptId() {
  return localStorage.getItem(ACTIVE_PROMPT_KEY) || "";
}

function setActivePromptId(id) {
  localStorage.setItem(ACTIVE_PROMPT_KEY, id || "");
}


function renderPromptList() {
  const list = document.getElementById("promptList");
  const prompts = loadPrompts();
  const activeId = getActivePromptId();

  list.innerHTML = "";
  prompts
    .slice()
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    .forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.title || "(Sans titre)";
      if (p.id === activeId) opt.selected = true;
      list.appendChild(opt);
    });
}

function applyPromptById(id) {
  const prompts = loadPrompts();
  const p = prompts.find(x => x.id === id);
  document.getElementById("promptTitle").value = p?.title || "";
  document.getElementById("promptText").value = p?.text || "";
  setActivePromptId(p?.id || "");
  renderPromptList();
}
function newPrompt() {
  document.getElementById("promptTitle").value = "";
  document.getElementById("promptText").value = "";
  setActivePromptId("");
  renderPromptList();
}

function saveCurrentPrompt() {
  const title = (document.getElementById("promptTitle").value || "").trim();
  const text  = (document.getElementById("promptText").value || "").trim();

  if (!title && !text) return; // rien à sauver

  const prompts = loadPrompts();
  let id = getActivePromptId();

  if (!id) {
    id = uid();
    prompts.push({ id, title: title || "Nouveau prompt", text });
  } else {
    const idx = prompts.findIndex(p => p.id === id);
    if (idx >= 0) prompts[idx] = { ...prompts[idx], title: title || "(Sans titre)", text };
    else prompts.push({ id, title: title || "(Sans titre)", text });
  }

  savePrompts(prompts);
  setActivePromptId(id);
  renderPromptList();
}

function deleteCurrentPrompt() {
  const id = getActivePromptId();
  if (!id) return;

  const prompts = loadPrompts().filter(p => p.id !== id);
  savePrompts(prompts);

  // choisir un autre prompt (si existe), sinon vider
  const next = prompts[0]?.id || "";
  setActivePromptId(next);
  applyPromptById(next);
}
document.addEventListener("DOMContentLoaded", () => {
  // prompts menu
  document.getElementById("btnNewPrompt").addEventListener("click", newPrompt);
  document.getElementById("btnSavePrompt").addEventListener("click", saveCurrentPrompt);
  document.getElementById("btnDeletePrompt").addEventListener("click", deleteCurrentPrompt);

  document.getElementById("promptList").addEventListener("change", (e) => {
    applyPromptById(e.target.value);
  });

  // init
  renderPromptList();
  const active = getActivePromptId();
  if (active) applyPromptById(active);
});

document.getElementById("sendBtn").addEventListener("click", async () => {
  const lang = document.getElementById("langSel").value || "fr";
  const prompt = (document.getElementById("promptText").value || "").trim();
  const question = (document.getElementById("questionInput").value || "").trim();

  const answerBox = document.getElementById("answerBox");
  const loading = document.getElementById("loading");

  if (!question) {
    answerBox.innerText = "Question vide.";
    return;
  }

  loading.hidden = false;
  answerBox.innerText = "";

  try {
    const r = await fetch(API_BASE + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, prompt, question })
    });

    const data = await r.json();
    loading.hidden = true;

    if (!r.ok) {
      answerBox.innerText = data?.error ? (data.error + (data.detail ? ("\n" + data.detail) : "")) : "Erreur API.";
      return;
    }

    answerBox.innerText = data.answer || "Aucune réponse.";
    answerBox.scrollIntoView({ behavior: "smooth" });
  } catch (e) {
    loading.hidden = true;
    answerBox.innerText = "Erreur de connexion.";
  }
});










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
