# 🧠⚔️ AI Text MMORPG Scaffold

A minimal, deterministic **TypeScript** scaffold for a text‑based MMORPG where an **AI acts as the Game Master (GM)**. Think **Zork** vibes with a **persistent world**, swappable **LLM adapters**, and a clean separation between **rules/state** (engine) and **narration** (model).

---

## ✨ Why this exists
- **Deterministic core**: game logic lives in a tiny TypeScript engine (state, timers, RNG, event log).  
- **Model‑agnostic**: adapters for **Ollama (local)**, **OpenAI**, and **Google Gemini**.  
- **Tight prompts**: the LLM only **narrates outcomes** and **suggests next actions**—it never mutates state.  
- **Lean UI**: one chat window + one input. All styling in a single CSS file using Tailwind’s `@apply`.

> 🧩 Use this as a foundation for a hobby game, a modding playground, or a SaaS proof‑of‑concept.

---

## 🚀 Quickstart

```bash
git clone <repo-url>
cd ai-mmorpg-scaffold
npm install
cp .env.example .env
# edit .env with your keys/urls
npm run dev
```
App opens at **http://localhost:5173**.

> ⚠️ This prototype expects a local Ollama setup. Install **[Ollama](https://ollama.com/)** and pull the lightweight model before launching:
> ```bash
> ollama pull gemma3:1b
> ```
> The `gemma3:1b` variant runs comfortably on lower-end hardware and matches the default config.

---

## 🔧 Environment Variables

| Key | Example | Required | Notes |
| --- | --- | :--: | --- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | ⭕ | Used by Local (Ollama) adapter; defaults to this value if omitted. |
| `OPENAI_API_KEY` | `sk-…` | ⭕ | Needed only if you select OpenAI. |
| `GOOGLE_API_KEY` | `…` | ⭕ | Needed only if you select Gemini. |
| `DEFAULT_MODEL_OLLAMA` | `gemma3:1b` | ⭕ | Optional override for local model. |
| `DEFAULT_MODEL_OPENAI` | `gpt-4o-mini` | ⭕ | Optional override. |
| `DEFAULT_MODEL_GEMINI` | `gemini-1.5-flash` | ⭕ | Optional override. |

> ⭕ = Optional. Provide at least one working adapter.

---

## 🏗️ Project Layout
```
/src
  /ui
    App.tsx
    screens/Welcome.tsx
    screens/Play.tsx
    components/Chat.tsx
    components/ModelPicker.tsx
    state/uiStore.ts
  /engine
    engine.ts
    rules.ts
    memory.ts
    prompts.ts
    types.ts
    world/rustgate.ts
  /adapters
    llm/base.ts
    llm/ollama.ts
    llm/openai.ts
    llm/gemini.ts
    pmm/bridge.ts
/assets
  styles.css
.env.example
index.html
vite.config.ts
package.json
README.md
```

---

## 🧩 Architecture at a glance

**UI (React + Vite)**  
- Two screens: **Welcome** (model picker + health test) and **Play** (chat + input).  
- No rules or world logic in UI.  
- Styling rule: **no Tailwind utility classes in JSX**. Use semantic class names + `@apply` in `/assets/styles.css`.

**Engine (TypeScript)**  
- Owns: **state**, **event log**, **timers**, **seeded RNG**, **light rules**, **prompt building**, **response parsing**.  
- Exposes `createEngine(io, config)` with `{ getState, setState, runTurn, getDigest, getHistory, reset }`.

**Adapters (LLM)**  
- **Ollama**, **OpenAI**, **Gemini** implement `{ id, name, health(), generate({system,user}) }`.  
- Adapters never change state; they only return text.

**PMM Bridge (stub)**  
- `/adapters/pmm/bridge.ts` maps game `Event`s to a ledger later; for now, provides `recordEvent()` and `snapshot()` no‑ops.

---

## 🔁 The Turn Loop (how play works)
1. **Frame**: Engine assembles a concise context from world facts + rules + current state.  
2. **Intent**: Player enters a command.  
3. **Resolve**: Engine advances timers and applies simple checks (deterministic RNG).  
4. **Narrate**: Engine calls the active adapter with a tight prompt → LLM returns 2–4 sentences + 3–5 next actions.  
5. **Update**: Engine logs an `Event`, updates digest/history, returns narration + options to UI.  

> 🧱 The model is a *narration service*. Only the engine changes truth.

---

## 🧮 Determinism & RNG
- RNG is **seeded** via `EngineConfig.rngSeed` for replayability.  
- The LLM **never rolls** or decides difficulty; it only describes outcomes produced by the engine.  
- Keep player inputs and seed constant to reproduce sessions.

---

## 🧰 World Content (Rustgate starter)
**Rustgate** is a tiny coastal outpost to prove the loop:
- **Places**: Docks, Market, Watchtower, Sewers (simple exits; a few interactions each).  
- **Groups**: Harbor Watch (law/trade), Ink Eels (smugglers).  
- **NPCs**: Captain Mora, Jax, Old Kessa.  
- **Problems**: *Blocked Shipment*, *Missing Guard*.  
- **Timers**: Patrol Sweep (3 turns), Storm Front (6 turns).  

Content lives in `/src/engine/world/rustgate.ts` as plain data + small helpers.

### Add your own world
Create `/src/engine/world/<name>.ts` exporting:
- `worldFacts: string[]` (10–15 bullets)
- `rulesSummary: string[]` (8–12 bullets)
- `createInitialWorldState(): WorldState`

> Keep these under ~400 tokens total so small local models perform well.

---

## 🧱 Prompting Contract (runtime)
The engine builds prompts with five blocks, in order:
1) **WORLD FACTS**  
2) **HOW PLAY WORKS**  
3) **RIGHT NOW**  
4) **PLAYER INTENT**  
5) **YOUR TASK** → *“Write 2–4 sentences of outcome, then list 3–5 next actions.”*

Responses are parsed; if the model returns junk, the engine falls back to generic options (`look around / talk / move`).

---

## 🧩 Adapters & Health Checks
- **Ollama** uses `OLLAMA_BASE_URL` (default `http://localhost:11434`). Health: GET `/api/tags`.  
- **OpenAI** uses `OPENAI_API_KEY`. Health: cheap models list call.  
- **Gemini** uses `GOOGLE_API_KEY`. Health: minimal ping.  
- Welcome screen shows pass/fail. You can switch adapters any time.

> 📴 If no adapter is healthy, a tiny **offline narration** stub keeps the Play screen usable.

---

## 🎨 Styling (hard rule)
All styling lives in **`/assets/styles.css`** using Tailwind + DaisyUI via `@apply`. JSX must only use semantic class names.

**Example**
```tsx
// ✅ JSX
<div className="chat-window">…</div>
```
```css
/* ✅ CSS */
.chat-window { @apply p-4 bg-base-200 rounded-lg overflow-y-auto; }
```
```tsx
// ❌ Utility chains in JSX (forbidden)
<div className="p-4 bg-base-200 rounded-lg overflow-y-auto">…</div>
```

---

## 🧯 Error Handling
- Bad LLM output → safe defaults + console warn.  
- Missing keys/URLs → inline warning on Welcome; adapter stays selectable.  
- Parsing failures never crash the loop.

---

## 🔒 Security (dev vs prod)
- Prototype calls LLM APIs from the browser for speed.  
- **Production** should proxy through a backend to protect keys, enforce quotas, and add auth/multi‑tenant routing.  
- Local Ollama may need CORS tweaks—check their docs if health fails.

---

## 🧪 Scripts
```bash
npm run dev       # Vite dev
npm run build     # Production build
npm run preview   # Preview build
npm run lint      # ESLint
npm run typecheck # TypeScript check (no emit)
```

---

## 🗺️ Roadmap (SaaS‑ready)
- 🔑 **Auth & Multi‑tenancy**: per‑tenant adapters & usage quotas.
- 🧾 **PMM Bridge**: map `Event`s to a hash‑chained ledger; snapshots & replays.
- 💾 **Persistent Saves**: server snapshots + shareable replay links.
- 🧰 **Admin Ops**: upload/validate world packs; seasonal content patches.
- 📊 **Telemetry (opt‑in)**: encounter rates, option pick rates, narrative pacing.

---

## 📄 License
Choose a license that fits your goals (e.g., dual license for OSS + commercial). Add a `LICENSE` file and update this section.

---

## 🙌 Credits
Built with ❤️ to **leverage AI to leverage AI to build an AI game**. Contributions welcome!
# Rustgate-MMORPG
