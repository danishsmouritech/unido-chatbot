/**
 * Demo Service — Simulates backend chat responses for demonstration purposes.
 * Mirrors the guard.service.js patterns and provides realistic UNIDO career answers.
 * Activate via VITE_DEMO_MODE=true in .env or appConfig.
 */

// ── Guard patterns (mirrors back-end/src/services/guard.service.js) ──────────

const OFFENSIVE_PATTERNS = [
  /\b(fuck|shit|bitch|bastard|asshole|idiot|moron|damn|crap|dickhead)\b/i,
  /\b(hate\s+speech|racist|racism|sexist|sexism|bigot|slur)\b/i,
  /\b(kill\s+yourself|kys|die|threat|bomb|attack|weapon)\b/i,
];

const CONFIDENTIAL_PATTERNS = [
  /\b(confidential|internal\s+document|private\s+document|leak|classified|secret)\b/i,
  /\b(staff\s+salary|salary\s+list|employee\s+data|personal\s+data|passport|ssn|social\s+security)\b/i,
  /\b(credit\s+card|bank\s+account|financial\s+record|medical\s+record)\b/i,
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i,
  /you\s+are\s+now\s+/i,
  /pretend\s+(you|to\s+be)/i,
  /system\s*:\s*/i,
  /\bDAN\b.*\bjailbreak\b/i,
  /override\s+(your|the)\s+(rules|instructions|guidelines)/i,
  /forget\s+(everything|your|all)/i,
  /act\s+as\s+(if|though)\s+you/i,
  /new\s+instructions?:/i,
  /\[INST\]/i,
  /<<SYS>>/i,
];

const OUT_OF_SCOPE_PATTERNS = [
  /\b(write\s+me\s+(a\s+)?code|generate\s+code|programming)\b/i,
  /\b(recipe|weather|sports|stock\s+market|crypto)\b/i,
  /\b(homework|essay|thesis|dissertation)\b/i,
];

// ── Guard blocked responses ──────────────────────────────────────────────────

const GUARD_RESPONSES = {
  offensive_content:
    "I'm here to help with UNIDO career-related questions. Please keep your queries professional and respectful.",
  confidential_request:
    "I can only assist with publicly available UNIDO careers information. I cannot share confidential or personal data.",
  prompt_injection:
    "I can only help with UNIDO careers information. How can I assist you with job opportunities or the application process?",
  out_of_scope:
    "I specialise in UNIDO career opportunities, application processes, and eligibility criteria. Could you ask something related to UNIDO careers?",
};

function getGuardReason(text) {
  if (OFFENSIVE_PATTERNS.some((p) => p.test(text))) return "offensive_content";
  if (CONFIDENTIAL_PATTERNS.some((p) => p.test(text))) return "confidential_request";
  if (PROMPT_INJECTION_PATTERNS.some((p) => p.test(text))) return "prompt_injection";
  if (OUT_OF_SCOPE_PATTERNS.some((p) => p.test(text))) return "out_of_scope";
  return null;
}

// ── Demo career responses (keyword → answer) ────────────────────────────────

const DEMO_RESPONSES = [
  {
    keywords: [/what\s+jobs|available\s+(jobs|positions|vacancies|openings)|current\s+openings|open\s+positions/i],
    answer:
      "Here are some currently available positions at UNIDO:\n\n" +
      "• **Industrial Development Officer (P-4)** — Vienna, Austria\n" +
      "  Deadline: 15 May 2026 | Department: Digitalization & AI\n\n" +
      "• **Programme Assistant (G-5)** — Addis Ababa, Ethiopia\n" +
      "  Deadline: 20 May 2026 | Department: Regional Programmes\n\n" +
      "• **Junior Professional Officer (P-2)** — Vienna, Austria\n" +
      "  Deadline: 30 May 2026 | Department: Trade & Investment\n\n" +
      "• **National Expert — Climate Technology** — Lagos, Nigeria\n" +
      "  Deadline: 10 June 2026 | Department: Energy & Environment\n\n" +
      "You can browse all openings at careers.unido.org. Would you like details about any specific position?"
  },
  {
    keywords: [/how\s+(do\s+i|to|can\s+i)\s+apply|application\s+process|apply\s+for/i],
    answer:
      "To apply for a position at UNIDO, follow these steps:\n\n" +
      "1. **Visit** careers.unido.org and browse available vacancies\n" +
      "2. **Create an account** on the UNIDO recruitment portal\n" +
      "3. **Complete your profile** — upload your CV, academic credentials, and a cover letter\n" +
      "4. **Submit your application** before the posted deadline\n" +
      "5. **Track your status** through the portal dashboard\n\n" +
      "**Tips:**\n" +
      "• Tailor your cover letter to the specific vacancy\n" +
      "• Highlight relevant experience matching the Terms of Reference\n" +
      "• Ensure all documents are in English or French\n\n" +
      "Applications received after the deadline will not be considered. Would you like help with eligibility criteria?"
  },
  {
    keywords: [/benefits|compensation|perks|what\s+does\s+unido\s+offer/i],
    answer:
      "UNIDO offers a competitive UN compensation package:\n\n" +
      "**Salary & Allowances:**\n" +
      "• Tax-exempt base salary (based on UN common salary scale)\n" +
      "• Post adjustment based on cost of living at duty station\n" +
      "• Dependency allowances for eligible family members\n\n" +
      "**Leave & Work-Life:**\n" +
      "• 30 days annual leave, 10 official UN holidays\n" +
      "• Flexible work arrangements and telecommuting options\n" +
      "• Maternity (16 weeks) and paternity (4 weeks) leave\n\n" +
      "**Health & Security:**\n" +
      "• UN medical insurance plan covering staff and dependents\n" +
      "• Pension through the UN Joint Staff Pension Fund\n" +
      "• Education grant for children of international staff\n\n" +
      "Benefits vary by contract type (Fixed-term, Temporary, Consultancy). Would you like to know about a specific contract type?"
  },
  {
    keywords: [/eligib(le|ility)|qualif(y|ication)|require(ment|d)|who\s+can\s+apply/i],
    answer:
      "Eligibility varies by position category:\n\n" +
      "**Professional Staff (P-1 to D-2):**\n" +
      "• Advanced university degree in a relevant field\n" +
      "• Fluency in English; knowledge of other UN languages is an asset\n" +
      "• Relevant work experience (varies by grade: P-2 requires 2+ years, P-4 requires 7+ years)\n" +
      "• Nationals of UNIDO Member States\n\n" +
      "**General Service (G-1 to G-7):**\n" +
      "• High school diploma; university degree preferred\n" +
      "• Usually recruited locally at the duty station\n\n" +
      "**Internships:**\n" +
      "• Currently enrolled in or recently completed a master's degree\n" +
      "• Under 35 years old at time of application\n" +
      "• Proficiency in English\n\n" +
      "Each vacancy has specific requirements in its Terms of Reference. Would you like to see current openings?"
  },
  {
    keywords: [/about\s+unido|what\s+is\s+unido|tell\s+me\s+about|unido\s+do/i],
    answer:
      "**UNIDO** (United Nations Industrial Development Organization) is a specialized agency of the United Nations that promotes industrial development for poverty reduction, inclusive globalization, and environmental sustainability.\n\n" +
      "**Key Facts:**\n" +
      "• Headquartered in Vienna, Austria (Vienna International Centre)\n" +
      "• 172 Member States\n" +
      "• ~700 staff, plus project personnel worldwide\n" +
      "• Focus areas: Digitalization, Climate & Energy, Agribusiness, Trade & Investment\n\n" +
      "**Mission:** To promote and accelerate inclusive and sustainable industrial development (ISID) in developing countries and economies in transition.\n\n" +
      "Would you like to explore career opportunities at UNIDO?"
  },
  {
    keywords: [/salary\s+grade|grade\s+level|pay\s+scale|p-?\d|g-?\d|un\s+grade/i],
    answer:
      "UNIDO follows the UN Common System salary scale:\n\n" +
      "**Professional & Higher Categories:**\n" +
      "| Grade | Typical Role | Annual Net (approx.) |\n" +
      "|-------|-------------|---------------------|\n" +
      "| P-1/P-2 | Junior/Associate Officer | $50,000 – $65,000 |\n" +
      "| P-3 | Officer | $65,000 – $80,000 |\n" +
      "| P-4 | Senior Officer | $80,000 – $95,000 |\n" +
      "| P-5 | Chief/Principal | $95,000 – $115,000 |\n" +
      "| D-1/D-2 | Director | $110,000 – $140,000 |\n\n" +
      "**Note:** Salaries are tax-exempt and supplemented by post adjustment (varies by duty station), dependency allowances, and other entitlements.\n\n" +
      "General Service grades (G-1 to G-7) are determined by local salary surveys. Would you like to know about other benefits?"
  },
  {
    keywords: [/where|location|office|headquarter|duty\s+station|vienna|field/i],
    answer:
      "UNIDO has presence across the globe:\n\n" +
      "**Headquarters:** Vienna, Austria (Vienna International Centre)\n\n" +
      "**Regional & Country Offices:**\n" +
      "• Africa: Ethiopia (Addis Ababa), Nigeria (Lagos), South Africa (Pretoria)\n" +
      "• Asia-Pacific: China (Beijing), India (New Delhi), Thailand (Bangkok)\n" +
      "• Latin America: Mexico (Mexico City), Colombia (Bogotá)\n" +
      "• Arab Region: Egypt (Cairo), Jordan (Amman)\n\n" +
      "**Project Offices:** UNIDO also operates through project-based offices in over 60 countries.\n\n" +
      "Most Professional staff positions are based in Vienna. Field positions are listed with their duty station in each vacancy notice. Shall I show you current openings?"
  },
  {
    keywords: [/intern(ship)?|volunteer|jpo|junior\s+professional/i],
    answer:
      "UNIDO offers several entry-level pathways:\n\n" +
      "**Internship Programme:**\n" +
      "• Duration: 3–6 months\n" +
      "• Locations: Vienna HQ or field offices\n" +
      "• Eligibility: Enrolled in or recently completed a master's degree, under 35\n" +
      "• Stipend: Monthly stipend provided\n\n" +
      "**Junior Professional Officer (JPO) Programme:**\n" +
      "• Duration: 2–3 years (P-2 level)\n" +
      "• Sponsored by your country of nationality\n" +
      "• Full UN salary and benefits package\n" +
      "• Excellent pathway to a long-term UN career\n\n" +
      "**UN Volunteers:**\n" +
      "• Managed through UNV in partnership with UNIDO\n" +
      "• Various field-based assignments\n\n" +
      "Would you like details on current internship openings?"
  },
  {
    keywords: [/interview|selection|shortlist|assessment|recruit(ment)?\s+process/i],
    answer:
      "The UNIDO recruitment process typically follows these stages:\n\n" +
      "1. **Application Screening** — HR reviews applications against the Terms of Reference\n" +
      "2. **Shortlisting** — A panel evaluates qualifications and experience\n" +
      "3. **Written Assessment** — Technical test or case study (for some positions)\n" +
      "4. **Interview** — Competency-based interview (usually virtual via MS Teams)\n" +
      "5. **Reference Checks** — At least 2 professional references contacted\n" +
      "6. **Offer & Onboarding** — Selected candidate receives a formal offer\n\n" +
      "**Timeline:** Typically 2–4 months from closing date to offer.\n\n" +
      "**Tips for the interview:**\n" +
      "• Prepare examples using the STAR method (Situation, Task, Action, Result)\n" +
      "• Review UNIDO's strategic priorities and the specific project/department\n" +
      "• Demonstrate your knowledge of inclusive and sustainable industrial development\n\n" +
      "Would you like to know about eligibility requirements?"
  },
  {
    keywords: [/faq|frequently\s+asked|common\s+question/i],
    answer:
      "Here are some frequently asked questions about UNIDO careers:\n\n" +
      "**Q: Can I apply for multiple positions?**\n" +
      "A: Yes, you may apply for as many positions as you qualify for.\n\n" +
      "**Q: Do I need to be a citizen of a member state?**\n" +
      "A: For Professional posts, preference is given to nationals of UNIDO member states. General Service posts are usually recruited locally.\n\n" +
      "**Q: Is there an age limit?**\n" +
      "A: There is no general age limit for staff positions. Internships require applicants to be under 35.\n\n" +
      "**Q: Can I submit my application after the deadline?**\n" +
      "A: No, late applications are not accepted by the system.\n\n" +
      "**Q: Are UNIDO salaries taxed?**\n" +
      "A: No, UN salaries are exempt from national income tax.\n\n" +
      "Would you like details on any specific topic?"
  },
  {
    keywords: [/hello|hi\b|hey|good\s+(morning|afternoon|evening)|greetings/i],
    answer:
      "Hello! Welcome to UNIDO Careers. I can help you with:\n\n" +
      "• **Job openings** — Browse current vacancies\n" +
      "• **Application process** — Step-by-step guidance\n" +
      "• **Eligibility** — Qualification requirements\n" +
      "• **Benefits** — Salary, leave, and compensation details\n" +
      "• **Internships & JPO** — Entry-level opportunities\n\n" +
      "What would you like to know?"
  },
  {
    keywords: [/thank|thanks|thx|appreciate/i],
    answer:
      "You're welcome! If you have any more questions about UNIDO careers, feel free to ask. Good luck with your application!"
  },
];

const FALLBACK_ANSWER =
  "I appreciate your question! While I don't have specific information on that topic right now, I can help you with:\n\n" +
  "• Current job openings at UNIDO\n" +
  "• The application process\n" +
  "• Eligibility and qualification requirements\n" +
  "• Salary grades and benefits\n" +
  "• Internships and entry-level programmes\n\n" +
  "Could you rephrase your question or ask about one of these topics?";

// ── Main demo handler ────────────────────────────────────────────────────────

const TYPING_DELAY_MS = 1200;

export function isDemoMode() {
  return import.meta.env.VITE_DEMO_MODE === "true";
}

/**
 * Simulates the backend /api/chat/ask response.
 * Returns { answer, sources, guardReason? } after a realistic delay.
 */
export function getDemoResponse(question) {
  return new Promise((resolve) => {
    const text = (question || "").trim();

    // 1. Guard check (mirrors backend)
    const guardReason = getGuardReason(text);
    if (guardReason) {
      setTimeout(() => {
        resolve({
          answer: GUARD_RESPONSES[guardReason],
          sources: [],
          guardReason,
        });
      }, 600);
      return;
    }

    // 2. Match a demo response
    const match = DEMO_RESPONSES.find((entry) =>
      entry.keywords.some((pattern) => pattern.test(text))
    );

    setTimeout(() => {
      resolve({
        answer: match ? match.answer : FALLBACK_ANSWER,
        sources: [],
      });
    }, TYPING_DELAY_MS);
  });
}
