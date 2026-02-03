
let API_BASE = "https://ask-api-r25z.onrender.com";

// ===== CONFIG =====
const PROMPTS_KEY = "khmvoice.ask.prompts.v1";
const ACTIVE_PROMPT_KEY = "khmvoice.ask.activePromptId.v1";

// ===== Helpers =====
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

// ===== UI Prompts =====
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

  if (!title && !text) return;

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

  const next = prompts[0]?.id || "";
  if (next) applyPromptById(next);
  else newPrompt();
}

// ===== Send to API =====
async function sendQuestion() {
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
      answerBox.innerText = data?.error
        ? (data.error + (data.detail ? ("\n" + data.detail) : ""))
        : "Erreur API.";
      return;
    }

    answerBox.innerText = data.answer || "Aucune réponse.";
    answerBox.scrollIntoView({ behavior: "smooth" });
  } catch (e) {
    loading.hidden = true;
    answerBox.innerText = "Erreur de connexion.";
  }
}

// ===== Wiring =====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnNewPrompt").addEventListener("click", newPrompt);
  document.getElementById("btnSavePrompt").addEventListener("click", saveCurrentPrompt);
  document.getElementById("btnDeletePrompt").addEventListener("click", deleteCurrentPrompt);

  document.getElementById("promptList").addEventListener("change", (e) => {
    applyPromptById(e.target.value);
  });

  document.getElementById("sendBtn").addEventListener("click", sendQuestion);

  renderPromptList();
  const active = getActivePromptId();
  if (active) applyPromptById(active);
});
