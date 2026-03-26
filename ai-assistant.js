/**
 * VAKEEL RAKESH PORTFOLIO — AI ASSISTANT
 * ai-assistant.js
 *
 * Architecture:
 *   Browser → Cloudflare Worker (proxy) → Anthropic Claude API
 *             ↑ API key lives here only, never in browser
 *
 * For local testing without a worker, set USE_MOCK_MODE = true below.
 */

(function () {
  'use strict';

  /* ================================================================
     CONFIG — update WORKER_URL after deploying Cloudflare Worker
  ================================================================ */
  const AI_CONFIG = {
    // Set to your Cloudflare Worker URL after deployment:
    WORKER_URL: 'https://portfolio-ai.YOUR-SUBDOMAIN.workers.dev/chat',

    // Live mode — call Cloudflare Worker
    USE_MOCK_MODE: true,

    MAX_HISTORY: 10,       // messages kept in context
    TYPING_DELAY_MS: 900,  // simulated typing delay in mock mode
  };

  /* ================================================================
     KNOWLEDGE BASE — the AI's source of truth about Vakeel
  ================================================================ */
  const SYSTEM_PROMPT = `You are Lilly, a smart, friendly, and professional AI assistant representing Raki and his portfolio website.
Your role is to act as a virtual personal assistant and provide accurate, helpful, and engaging responses based ONLY on the information available in the portfolio.

=== CORE RESPONSIBILITIES ===
Answer user questions about Raki's:
- Skills (IT, QA, Mechanical, Tools)
- Projects (Lilly AI, Workflow Automation, Odoo ERP, etc.)
- Experience (SystemaOps, Devsdom, IndiaAI, etc.)
- Technologies (Python, Playwright, Odoo ERP, HVAC, React/FastAPI)
- Achievements & Certifications (Deloitte, Simplilearn, Coursera, etc.)
- Contact Information (Email, LinkedIn, GitHub, Phone)

=== PERSONA & STYLE ===
- Friendly, natural, and human-like — never robotic.
- Professional but approachable.
- Response length: Clear and concise. 2-4 sentences is usually enough.
- Use a light conversational tone. Avoid emojis unless they serve a real purpose (e.g. status icons).
- Refer to the subject as 'Raki' or 'VR'. Do not use 'Vakeel' alone.

=== DATA SOURCE: RAKI'S BACKGROUND ===
- Name: Vakeel Rakesh (prefers 'Raki' or 'VR')
- Role: Workflow & Process Automation Associate @ SystemaOps (Jan 2026-Present)
- Location: Hyderabad, India
- Email: rakeshvakeel000@gmail.com | Phone: +91 76600 43617
- LinkedIn: linkedin.com/in/vakeel-rakesh | GitHub: github.com/VAKEELRAKESH
- Education: B.Tech in Mechanical Engineering

=== PROJECTS ===
0. Lilly: AI Orchestration Layer - Cloudflare Workers + Claude 3.5 Sonnet + JSON RAG.
1. Business Workflow Automation - Python-based workflows for SystemaOps.
2. Playwright UI Automation - Automated QA pipeline for web apps.
3. Odoo ERP Workflow Configuration - Techno-functional process mapping and gap analysis.
4. IndiaAI MSME-ODR Platform - Dispute resolution logic, React + FastAPI.
5. HVAC Operations Support - SOP documentation and task tracking.
6. BHEL R&D Engineering Support - Quality records and technical reporting.

=== STRICT RULES ===
1. DO NOT invent or assume information. If it is not in the portfolio, say: "That information isn't available in the portfolio yet."
2. DO NOT answer outside the portfolio's context.
3. Maps intents: "contac", "provied", "email", "reach him" all refer to Contact.
4. If a question is unclear or completely unrelated, say: "I’m not fully sure what you mean. You can ask me about Raki’s projects, skills, experience, or how to contact him."
5. If contact info is missing (unlikely here, but for security): "I couldn’t find contact details in the portfolio, but you can usually reach out through the provided platforms or contact section."
6. NO repeating introductions in every reply.
7. Use plain text only (lines and bullets are OK, but no markdown headers or bolding that might break standard text parsers).`;

  /* ================================================================
     MOCK MODE — smart canned replies for local testing
  ================================================================ */
  const MOCK_RESPONSES = [
    {
      patterns: ['your name', 'who are you', 'what are you', 'lilly', 'who is lilly'],
      reply: "I'm Lilly — VR's personal AI assistant! I'm here to help you learn about Raki's experience, skills, and availability. Ask me anything!",
    },
    {
      patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'greet'],
      reply: "Hey! I'm Lilly, VR's portfolio assistant. Ask me about Raki's experience in workflow automation, QA testing, Odoo ERP, or mechanical engineering — I'm all yours!",
    },
    {
      patterns: ['experience', 'work history', 'background', 'career', 'worked'],
      reply: "VR (Raki) has 3+ years of experience across IT and mechanical engineering. Currently at SystemaOps as a Workflow & Process Automation Associate. Previously QA & Testing at Devsdom Infotech, and engineering roles at IKON (Daikin partner) and BHEL R&D. He also contributed to the IndiaAI government platform in 2026.",
    },
    {
      patterns: ['current', 'now', 'presently', 'today', 'systemops', 'systemaops'],
      reply: "Raki is currently a Workflow & Process Automation Associate at SystemaOps (January 2026–present). He configures Odoo ERP workflows, prepares BRDs, conducts gap analysis, performs functional testing and UAT, and uses Playwright + Python for automation. He is open to better opportunities.",
    },
    {
      patterns: ['skill', 'tech', 'stack', 'know', 'language', 'tool', 'python', 'playwright', 'odoo', 'erp'],
      reply: "Core skills: Python, Playwright, Odoo ERP, workflow automation, manual & regression testing, UAT, BRD preparation, As-Is/To-Be mapping, and gap analysis. Mechanical background includes HVAC systems, process documentation, and quality validation. Growing in SQL, React, and FastAPI.",
    },
    {
      patterns: ['certification', 'certificate', 'course', 'deloitte', 'coursera', 'simplilearn', 'infosys'],
      reply: "Vakeel holds 5 verified certifications: Deloitte Australia Technology Job Simulation (Forage), Machine Learning (Simplilearn), Basics of Python (Infosys Springboard), Python Loops & Functions (Coursera), and a Python Tech Stack bundle. All earned in 2025.",
    },
    {
      patterns: ['available', 'hire', 'open', 'looking', 'job', 'position', 'role', 'opportunity', 'recruit'],
      reply: "Yes — Raki is open to opportunities in QA engineering, workflow automation, Odoo ERP functional roles, techno-functional analysis, and mechanical/HVAC operations. You can reach him directly at rakeshvakeel000@gmail.com or +91 76600 43617. He is based in Hyderabad, India.",
    },
    {
      patterns: ['contact', 'email', 'phone', 'reach', 'linkedin', 'github'],
      reply: "You can reach Raki at rakeshvakeel000@gmail.com or +91 76600 43617. You can also connect with him on LinkedIn and GitHub through the links in the footer.",
    },
    {
      patterns: ['education', 'degree', 'college', 'university', 'study', 'mechanical'],
      reply: "Vakeel holds a B.Tech in Mechanical Engineering. This engineering foundation gives him a unique advantage — he understands physical processes and workflows deeply, which he applies to software automation and ERP system design.",
    },
    {
      patterns: ['indiaai', 'india ai', 'msme', 'government', 'ai platform'],
      reply: "Vakeel contributed to the IndiaAI MSME-ODR platform in 2026 — a national AI challenge to build a dispute resolution platform for India's MSME sector. He designed workflow logic, conducted usability testing, validated multilingual AI integration, and worked with React and FastAPI in a government-grade product context.",
    },
    {
      patterns: ['bhel', 'ikon', 'hvac', 'daikin', 'mechanical engineering', 'industrial'],
      reply: "Raki has hands-on mechanical experience from BHEL R&D and IKON (a Daikin partner). He handled HVAC operations, quality validation, and process documentation before pivoting to IT and automation.",
    },
    {
      patterns: ['salary', 'pay', 'compensation', 'ctc', 'package', 'lpa'],
      reply: "Compensation expectations are best discussed directly with Vakeel. Please reach out at rakeshvakeel000@gmail.com to have that conversation.",
    },
    {
      patterns: ['resume', 'cv', 'download'],
      reply: "You can download VR's resume using the Resume button in the top navigation bar, or the Download PDF button in the Contact section. It includes his full work history, skills, and certifications.",
    },
    {
      patterns: ['project', 'build', 'portfolio projects', 'showcase'],
      reply: "Raki has showcased 7 key projects, ranging from AI orchestration (Lilly Layer) and Odoo ERP configuration to IndiaAI dispute resolution platforms and HVAC process support. You can see the full list in the Projects section above!",
    },
    {
      patterns: ['navigate', 'guide', 'section', 'where', 'find', 'portfolio'],
      reply: "The portfolio has 7 sections: About, Skills, Experience, Projects, Credentials, Freelance, and Contact. Use the top navigation or scroll down to explore VR's work!",
    },
    {
      patterns: ['strength', 'best at', 'strongest', 'specialise', 'speciali'],
      reply: "VR's core strength is bridging IT and operations — translating business and engineering requirements into working automated systems. He excels at process analysis, BRD documentation, Odoo ERP configuration, and QA testing. His engineering background makes him unusually effective at designing workflows from first principles.",
    },
  ];

  function getMockReply(userMessage) {
    const msg = userMessage.toLowerCase();
    for (const item of MOCK_RESPONSES) {
      if (item.patterns.some(p => msg.includes(p))) {
        return item.reply;
      }
    }
    return "I’m not fully sure what you mean. You can ask me about Raki’s projects, skills, experience, or how to contact him.";
  }

  /* ================================================================
     CONVERSATION STATE
  ================================================================ */
  const state = {
    history: [],     // { role: 'user'|'assistant', content: string }[]
    isOpen: false,
    isTyping: false,
    messageCount: 0,
  };

  /* ================================================================
     DOM — build the chat widget
  ================================================================ */
  function buildWidget() {
    const root = document.createElement('div');
    root.id = 'ai-widget';
    root.innerHTML = `
      <!-- Launcher button -->
      <button class="ai-launcher" id="ai-launcher" aria-label="Open AI Assistant" aria-expanded="false">
        <span class="ai-launcher-icon ai-launcher-open">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </span>
        <span class="ai-launcher-icon ai-launcher-close" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
        <span class="ai-launcher-badge" id="ai-launcher-badge" aria-hidden="true">✦</span>
      </button>

      <!-- Chat panel -->
      <div class="ai-panel" id="ai-panel" aria-hidden="true" role="dialog" aria-labelledby="ai-panel-title">
        <!-- Header -->
        <div class="ai-header">
          <div class="ai-header-left">
            <div class="ai-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p class="ai-title" id="ai-panel-title">Lilly — Vakeel's AI</p>
              <p class="ai-subtitle"><span class="ai-status-dot"></span> AI assistant · here to help</p>
            </div>
          </div>
          <button class="ai-close-btn" id="ai-close-btn" aria-label="Close assistant">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Suggested questions -->
        <div class="ai-suggestions" id="ai-suggestions">
          <p class="ai-suggestions-label">Quick questions</p>
          <div class="ai-chips" role="list">
            <button class="ai-chip" role="listitem" data-q="What is Vakeel's current role?">Current role</button>
            <button class="ai-chip" role="listitem" data-q="What are his strongest skills?">Top skills</button>
            <button class="ai-chip" role="listitem" data-q="Is he available to hire?">Available to hire?</button>
            <button class="ai-chip" role="listitem" data-q="Tell me about his certifications">Certifications</button>
            <button class="ai-chip" role="listitem" data-q="What roles is he open to?">Open roles</button>
            <button class="ai-chip" role="listitem" data-q="How do I contact Vakeel?">Contact info</button>
          </div>
        </div>

        <!-- Messages -->
        <div class="ai-messages" id="ai-messages" aria-live="polite" aria-label="Chat messages"></div>

        <!-- Input -->
        <div class="ai-input-row">
          <textarea
            class="ai-input"
            id="ai-input"
            placeholder="Ask Lilly anything about VR…"
            rows="1"
            maxlength="500"
            aria-label="Your message"
          ></textarea>
          <button class="ai-send-btn" id="ai-send-btn" aria-label="Send message" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p class="ai-footer-note">Lilly is Vakeel's AI — ask me anything about his work.</p>
      </div>
    `;
    document.body.appendChild(root);
  }

  /* ================================================================
     RENDER HELPERS
  ================================================================ */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMessage(role, text, isTyping) {
    const messages = document.getElementById('ai-messages');
    const wrap = document.createElement('div');
    wrap.className = `ai-msg ai-msg-${role}`;

    if (isTyping) {
      wrap.id = 'ai-typing-indicator';
      wrap.innerHTML = `
        <div class="ai-bubble ai-bubble-assistant">
          <span class="ai-typing-dots">
            <span></span><span></span><span></span>
          </span>
        </div>`;
    } else {
      const safeText = escapeHtml(text).replace(/\n/g, '<br>');
      wrap.innerHTML = `
        <div class="ai-bubble ai-bubble-${role}">${safeText}</div>
        <span class="ai-msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      `;
    }

    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return wrap;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('ai-typing-indicator');
    if (el) el.remove();
  }

  function hideSuggestions() {
    const s = document.getElementById('ai-suggestions');
    if (s) s.style.display = 'none';
  }

  /* ================================================================
     API CALL
  ================================================================ */
  async function callAI(userMessage) {
    // Add to history
    state.history.push({ role: 'user', content: userMessage });
    // Trim history to max length
    if (state.history.length > AI_CONFIG.MAX_HISTORY) {
      state.history = state.history.slice(-AI_CONFIG.MAX_HISTORY);
    }

    if (AI_CONFIG.USE_MOCK_MODE) {
      // Simulate network delay
      await new Promise(r => setTimeout(r, AI_CONFIG.TYPING_DELAY_MS));
      const reply = getMockReply(userMessage);
      state.history.push({ role: 'assistant', content: reply });
      return reply;
    }

    // Live mode — call Cloudflare Worker
    const resp = await fetch(AI_CONFIG.WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages:     state.history,
        systemPrompt: SYSTEM_PROMPT,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 429) throw new Error('Rate limit reached. Please try again later.');
      throw new Error(err.error || `Server error ${resp.status}`);
    }

    const data = await resp.json();
    state.history.push({ role: 'assistant', content: data.reply });
    return data.reply;
  }

  /* ================================================================
     SEND MESSAGE FLOW
  ================================================================ */
  async function sendMessage(text) {
    if (!text.trim() || state.isTyping) return;

    hideSuggestions();
    renderMessage('user', text);
    state.isTyping = true;

    const input    = document.getElementById('ai-input');
    const sendBtn  = document.getElementById('ai-send-btn');
    input.value    = '';
    input.style.height = '';
    sendBtn.disabled   = true;

    const typingEl = renderMessage('assistant', '', true);

    try {
      const reply = await callAI(text);
      removeTypingIndicator();
      renderMessage('assistant', reply);
    } catch (err) {
      removeTypingIndicator();
      renderMessage('assistant', '⚠️ ' + (err.message || 'Something went wrong. Please try again.'));
    } finally {
      state.isTyping = false;
      input.focus();
    }
  }

  /* ================================================================
     TOGGLE PANEL
  ================================================================ */
  function togglePanel(open) {
    state.isOpen = open;
    const panel    = document.getElementById('ai-panel');
    const launcher = document.getElementById('ai-launcher');
    const badge    = document.getElementById('ai-launcher-badge');

    panel.classList.toggle('ai-panel-open', open);
    panel.setAttribute('aria-hidden', (!open).toString());
    launcher.setAttribute('aria-expanded', open.toString());
    launcher.classList.toggle('ai-launcher-active', open);

    if (open) {
      badge.style.display = 'none';
      // Show welcome message on first open
      if (state.messageCount === 0) {
        setTimeout(() => {
          renderMessage('assistant', "Hey! I'm Lilly, Raki's portfolio assistant. I can help you explore his projects, skills, experience, and more—just ask!");
          state.messageCount++;
        }, 300);
      }
      setTimeout(() => document.getElementById('ai-input')?.focus(), 350);
    }
  }

  /* ================================================================
     EVENT LISTENERS
  ================================================================ */
  function bindEvents() {
    // Launcher
    document.getElementById('ai-launcher').addEventListener('click', () => togglePanel(!state.isOpen));
    document.getElementById('ai-close-btn').addEventListener('click', () => togglePanel(false));

    // Send button
    document.getElementById('ai-send-btn').addEventListener('click', () => {
      const val = document.getElementById('ai-input').value.trim();
      if (val) sendMessage(val);
    });

    // Input field
    const input = document.getElementById('ai-input');
    input.addEventListener('input', function () {
      document.getElementById('ai-send-btn').disabled = !this.value.trim();
      // Auto-resize
      this.style.height = '';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const val = this.value.trim();
        if (val) sendMessage(val);
      }
    });

    // Quick suggestion chips
    document.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => sendMessage(chip.getAttribute('data-q')));
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (state.isOpen &&
          !e.target.closest('#ai-widget')) {
        togglePanel(false);
      }
    });

    // ESC key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.isOpen) togglePanel(false);
    });
  }

  /* ================================================================
     INJECT STYLES
  ================================================================ */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ────── WIDGET SHELL ────── */
      #ai-widget {
        position: fixed;
        bottom: 84px;
        right: 24px;
        z-index: 9000;
        font-family: var(--font-b);
      }

      /* ────── LAUNCHER ────── */
      .ai-launcher {
        position: absolute;
        bottom: 0; right: 0;
        width: 52px; height: 52px;
        border-radius: 14px;
        background: var(--c-primary);
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 20px rgba(91,91,214,.3), 0 1px 4px rgba(0,0,0,.1);
        border: none; cursor: pointer;
        transition: transform .2s cubic-bezier(.22,1,.36,1),
                    background .15s, box-shadow .2s;
        z-index: 2;
      }
      .ai-launcher:hover {
        transform: scale(1.08) translateY(-2px);
        box-shadow: 0 8px 28px rgba(91,91,214,.4);
      }
      .ai-launcher-icon { display: flex; align-items: center; justify-content: center; }
      .ai-launcher-close { display: none; }
      .ai-launcher-active .ai-launcher-open  { display: none; }
      .ai-launcher-active .ai-launcher-close { display: flex; }

      .ai-launcher-badge {
        position: absolute;
        top: -6px; right: -6px;
        background: var(--c-rose); color: #fff;
        font-size: .55rem; font-weight: 800;
        padding: 2px 5px; border-radius: 99px;
        border: 2px solid var(--c-bg);
        font-family: var(--font-m);
        letter-spacing: .04em;
        animation: badge-pulse 2s ease-in-out infinite;
      }
      @keyframes badge-pulse {
        0%,100% { transform: scale(1); }
        50%      { transform: scale(1.15); }
      }

      /* ────── PANEL ────── */
      .ai-panel {
        position: absolute;
        bottom: 64px; right: 0;
        width: 360px;
        max-height: 560px;
        background: var(--glass-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--glass-border);
        border-radius: 20px;
        box-shadow: var(--shadow-lg);
        display: flex; flex-direction: column;
        overflow: hidden;
        opacity: 0; pointer-events: none;
        transform: translateY(16px) scale(.97);
        transform-origin: bottom right;
        transition: opacity .25s cubic-bezier(.22,1,.36,1),
                    transform .25s cubic-bezier(.22,1,.36,1);
      }
      .ai-panel-open {
        opacity: 1; pointer-events: all;
        transform: translateY(0) scale(1);
      }

      /* ────── HEADER ────── */
      .ai-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid var(--c-border);
        background: var(--c-primary-lt);
      }
      .ai-header-left { display: flex; align-items: center; gap: 10px; }
      .ai-avatar {
        width: 36px; height: 36px; border-radius: 10px;
        background: linear-gradient(135deg, var(--c-primary), var(--c-violet));
        color: #fff;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .ai-title { font-size: .88rem; font-weight: 700; color: var(--c-text1); margin: 0; }
      .ai-subtitle {
        font-size: .68rem; color: var(--c-text3); margin: 0;
        display: flex; align-items: center; gap: 5px;
      }
      .ai-status-dot {
        width: 7px; height: 7px; border-radius: 50%; background: var(--c-green);
        animation: status-pulse 2s ease-in-out infinite;
      }
      @keyframes status-pulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,.4); }
        50%      { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
      }
      .ai-close-btn {
        width: 28px; height: 28px; border-radius: 8px;
        background: var(--c-surface2); color: var(--c-text2);
        display: flex; align-items: center; justify-content: center;
        transition: background .15s, color .15s;
        border: none; cursor: pointer;
      }
      .ai-close-btn:hover { background: var(--c-border); color: var(--c-text1); }

      /* ────── SUGGESTIONS ────── */
      .ai-suggestions { padding: 12px 14px; border-bottom: 1px solid var(--c-border); }
      .ai-suggestions-label {
        font-size: .62rem; font-weight: 600; letter-spacing: .08em;
        text-transform: uppercase; color: var(--c-text3); margin-bottom: 8px;
      }
      .ai-chips { display: flex; flex-wrap: wrap; gap: 6px; }
      .ai-chip {
        font-size: .72rem; font-weight: 600; color: var(--c-text2);
        background: var(--c-surface2); border: 1px solid var(--c-border);
        padding: 4px 10px; border-radius: 99px; cursor: pointer;
        transition: background .15s, color .15s, border-color .15s;
        white-space: nowrap;
      }
      .ai-chip:hover { background: var(--c-primary-lt); color: var(--c-primary); border-color: var(--c-primary); }

      /* ────── MESSAGES ────── */
      .ai-messages {
        flex: 1; overflow-y: auto;
        padding: 14px 14px 8px;
        display: flex; flex-direction: column; gap: 10px;
        scroll-behavior: smooth;
      }
      .ai-messages::-webkit-scrollbar { width: 4px; }
      .ai-messages::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 2px; }

      .ai-msg { display: flex; flex-direction: column; gap: 3px; max-width: 88%; }
      .ai-msg-user  { align-self: flex-end; align-items: flex-end; }
      .ai-msg-assistant { align-self: flex-start; align-items: flex-start; }

      .ai-bubble {
        padding: 10px 13px; border-radius: 14px;
        font-size: .83rem; line-height: 1.65; color: var(--c-text1);
      }
      .ai-bubble-user {
        background: var(--c-primary); color: #fff;
        border-bottom-right-radius: 4px;
      }
      .ai-bubble-assistant {
        background: var(--c-surface2); border: 1px solid var(--c-border);
        border-bottom-left-radius: 4px;
      }
      .ai-msg-time {
        font-size: .6rem; color: var(--c-text3);
        font-family: var(--font-m);
      }

      /* Typing dots */
      .ai-typing-dots { display: flex; align-items: center; gap: 4px; padding: 2px 0; }
      .ai-typing-dots span {
        width: 7px; height: 7px; border-radius: 50%; background: var(--c-text3);
        animation: typing-bounce .9s ease-in-out infinite;
      }
      .ai-typing-dots span:nth-child(2) { animation-delay: .15s; }
      .ai-typing-dots span:nth-child(3) { animation-delay: .30s; }
      @keyframes typing-bounce {
        0%,100% { transform: translateY(0); opacity: .5; }
        50%      { transform: translateY(-5px); opacity: 1; }
      }

      /* ────── INPUT ────── */
      .ai-input-row {
        display: flex; align-items: flex-end; gap: 8px;
        padding: 10px 12px 10px;
        border-top: 1px solid var(--c-border);
      }
      .ai-input {
        flex: 1; resize: none; border: 1.5px solid var(--c-border);
        border-radius: 12px; padding: 9px 12px;
        font-size: .83rem; font-family: inherit; color: var(--c-text1);
        line-height: 1.5; outline: none; background: var(--c-surface2);
        transition: border-color .15s, background .15s;
        max-height: 120px;
      }
      .ai-input:focus { border-color: var(--c-primary); background: var(--c-bg); }
      .ai-input::placeholder { color: var(--c-text3); }
      .ai-send-btn {
        width: 38px; height: 38px; border-radius: 10px;
        background: var(--c-primary); color: #fff; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        transition: background .15s, transform .15s, opacity .15s;
        border: none; cursor: pointer;
      }
      .ai-send-btn:disabled { background: var(--c-border); color: var(--c-text3); cursor: not-allowed; }
      .ai-send-btn:not(:disabled):hover { background: var(--c-primary-dk); transform: scale(1.06); }

      .ai-footer-note {
        font-size: .62rem; color: var(--c-text3); text-align: center;
        padding: 0 12px 10px; margin: 0;
      }

      /* ────── MOBILE ────── */
      @media (max-width: 480px) {
        #ai-widget { bottom: 90px; right: 20px; }
        .ai-panel {
          position: fixed;
          bottom: 155px; right: 20px; left: 20px;
          width: auto; max-height: 60vh;
        }
      }

      /* ────── REDUCED MOTION ────── */
      @media (prefers-reduced-motion: reduce) {
        .ai-panel, .ai-launcher, .ai-badge { transition: none !important; animation: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ================================================================
     INIT
  ================================================================ */
  function init() {
    injectStyles();
    buildWidget();
    bindEvents();

    // Auto-open hint after 8 seconds on first visit
    if (!sessionStorage.getItem('ai_widget_seen')) {
      setTimeout(() => {
        sessionStorage.setItem('ai_widget_seen', '1');
        // Just pulse the badge to draw attention
        const badge = document.getElementById('ai-launcher-badge');
        if (badge) badge.style.animation = 'badge-pulse .5s ease-in-out 3';
      }, 8000);
    }
  }

  /* ================================================================
     GLOBAL API EXPOSURE
  ================================================================ */
  window.triggerLillyGreeting = function(email) {
    if (!state.isOpen) {
      togglePanel(true);
    }
    
    const isOwner = email.toLowerCase() === 'rakeshvakeel000@gmail.com';
    const name = email.split('@')[0];
    
    let msg = "";
    if (isOwner) {
      msg = "Welcome back, VR! 🚀 Everything is running smoothly. Your portfolio looks fantastic. How's the view from the driver's seat?";
    } else {
      msg = `Hey ${name}! I'm Lilly, Raki's portfolio assistant. I can help you explore his projects, skills, experience, and more—just ask!`;
    }

    setTimeout(() => {
      renderMessage('assistant', msg);
      state.messageCount++; // Increment so the default welcome doesn't trigger again
    }, 800);
  };


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
