// ===== CONFIG =====
let API_BASE = "https://ask-api-r25z.onrender.com"; // <-- ton API

const PROMPTS_KEY = "khmvoice.ask.prompts.v2";
const ACTIVE_PROMPT_KEY = "khmvoice.ask.activePromptId.v2";

// ===== Storage helpers =====
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

// ===== DOM =====
const $ = (id) => document.getElementById(id);

// ===== Render lists (left list + top picker) =====
function renderPrompts(filterText = "") {
  const prompts = loadPrompts();
  const activeId = getActivePromptId();
  const f = filterText.trim().toLowerCase();

  const filtered = prompts
    .slice()
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    .filter(p => !f || (p.title || "").toLowerCase().includes(f));

  // Left list
  //$("promptList").innerHTML = "";
  //filtered.forEach(p => {
  //  const opt = document.createElement("option");
  //  opt.value = p.id;
  //  opt.textContent = p.title || "(Sans titre)";
  //  if (p.id === activeId) opt.selected = true;
  //  $("promptList").appendChild(opt);
  // }
  // );

  // Top picker (all prompts)
  $("promptPick").innerHTML = "";
  prompts
    .slice()
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    .forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.title || "(Sans titre)";
      if (p.id === activeId) opt.selected = true;
      $("promptPick").appendChild(opt);
      }
    );
}

function applyPromptById(id) {
  const prompts = loadPrompts();
  const p = prompts.find(x => x.id === id);

  $("promptTitle").value = p?.title || "";
  $("promptText").value = p?.text || "";

  setActivePromptId(p?.id || "");
  renderPrompts($("promptSearch").value || "");
}

function newPrompt() {
  const prompts = loadPrompts();
  const id = uid();
  const title = "Nouveau prompt";
  const text = "";

  prompts.push({ id, title, text });
  savePrompts(prompts);

  setActivePromptId(id);
  applyPromptById(id);
}

function saveCurrentPrompt() {
  const title = ($("promptTitle").value || "").trim() || "(Sans titre)";
  const text = ($("promptText").value || "").trim();
  let id = getActivePromptId();

  const prompts = loadPrompts();

  if (!id) {
    id = uid();
    prompts.push({ id, title, text });
  } else {
    const idx = prompts.findIndex(p => p.id === id);
    if (idx >= 0) prompts[idx] = { ...prompts[idx], title, text };
    else prompts.push({ id, title, text });
  }

  savePrompts(prompts);
  setActivePromptId(id);
  renderPrompts($("promptSearch").value || "");
  // resync selects
  $("promptPick").value = id;
  $("promptList").value = id;
}

function deleteCurrentPrompt() {
  const id = getActivePromptId();
  if (!id) return;

  const prompts = loadPrompts().filter(p => p.id !== id);
  savePrompts(prompts);

  const next = prompts[0]?.id || "";
  setActivePromptId(next);

  if (next) applyPromptById(next);
  else {
    $("promptTitle").value = "";
    $("promptText").value = "";
    renderPrompts($("promptSearch").value || "");
  }
}

// ===== Ask API =====
async function sendQuestion() {
  const lang = $("langSel").value || "fr";
  const prompt = ($("promptText").value || "").trim();
  const question = ($("promptText").value || "").trim();

  if (!question) {
    $("answerText").value = "Question vide.";
    return;
  }

  $("loading").hidden = false;
  $("answerText").value = "";

  try {
    const r = await fetch(API_BASE + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang, prompt, question })
    });

    const data = await r.json();
    $("loading").hidden = true;

    if (!r.ok) {
      $("answerText").value = data?.error
        ? (data.error + (data.detail ? ("\n" + data.detail) : ""))
        : "Erreur API.";
      return;
    }

    $("answerText").value = data.answer || "";
  } catch (e) {
    $("loading").hidden = true;
    $("answerText").value = "Erreur de connexion.";
  }
}

// ===== Answer utilities =====
function copyAnswer() {
  const text = $("answerText").value || "";
  if (!text) return;
  navigator.clipboard?.writeText(text);
}

function clearAnswer() {
  $("answerText").value = "";
}

// ===== Wiring =====
document.addEventListener("DOMContentLoaded", () => {
  // init lists
  renderPrompts("");

  // restore active
  const active = getActivePromptId();
  if (active) applyPromptById(active);

  // left list selection
  $("promptList").addEventListener("change", (e) => applyPromptById(e.target.value));
  // top picker selection
  $("promptPick").addEventListener("change", (e) => applyPromptById(e.target.value));

  // search
  $("promptSearch").addEventListener("input", () => renderPrompts($("promptSearch").value || ""));

  // actions
  $("btnNewPrompt").addEventListener("click", newPrompt);
  $("btnSavePrompt").addEventListener("click", saveCurrentPrompt);
  $("btnDeletePrompt").addEventListener("click", deleteCurrentPrompt);

  $("sendBtn").addEventListener("click", sendQuestion);

  $("btnCopyAnswer").addEventListener("click", copyAnswer);
  $("btnClearAnswer").addEventListener("click", clearAnswer);

  // Enter to send (question input)
  $("questionInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendQuestion();
  });
});
