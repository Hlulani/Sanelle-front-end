import { useMemo, useState } from "react";

type Screen = "today" | "food" | "health" | "visit";
type Profile = {
  name: string;
  priorities: string[];
  fibroidCount: string;
  largestSize: string;
  symptoms: string[];
  foodNeeds: string[];
  appointmentDate: string;
};
type SymptomEntry = {
  symptoms: string[];
  impact: string;
  recordedAt: string;
  bleeding: string;
};
type ClinicalResult = { value: string; date: string };
type SavedReport = {
  id: number;
  name: string;
  date: string;
  pages: number;
  status: "Needs checking" | "Checked";
  originalWording: string;
};
type VisitQuestion = {
  id: number;
  text: string;
  status: "Open" | "Answered" | "Unresolved";
  answer?: string;
  nextStep?: string;
  reviewDate?: string;
  source?: string;
};
type EvidenceEntry = {
  id: string;
  title: string;
  explanation: string;
  topic: string;
  status: "Draft" | "In review" | "Published" | "Withdrawn";
  population: string;
  outcome: string;
  findings: string;
  limitations: string;
  reviewer: string;
  reviewDate: string;
  version: string;
  cutoff: string;
  citations: string[];
  usedBy: string[];
  history: string[];
};
type IconName =
  | "home"
  | "food"
  | "health"
  | "visit"
  | "arrow"
  | "plus"
  | "check"
  | "info"
  | "close"
  | "cart"
  | "clock"
  | "people"
  | "spark";

const mealImage =
  "https://images.unsplash.com/photo-1547592180-85f173990554?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400";
const quickMealImage =
  "https://images.unsplash.com/photo-1714062105876-1756a22c4caf?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900";
const pantryMealImage =
  "https://images.unsplash.com/photo-1577594412936-01fbd0d88d2c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900";
const cookingImage =
  "https://images.unsplash.com/photo-1636647511729-6703539ba71f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=84&w=1200";
const notesImage =
  "https://images.unsplash.com/photo-1620275765334-4ed948bb4502?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900";
const groceriesImage =
  "https://images.unsplash.com/photo-1760445530338-d5cb6c5b2e74?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=82&w=900";
const readingImage =
  "https://images.unsplash.com/photo-1749704647390-8f696a0be917?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=84&w=1000";

const evidenceEntries: EvidenceEntry[] = [
  {
    id: "EXP-001",
    title: "When a report does not record fibroid location",
    explanation: "A saved report may confirm fibroids without saying where they are. The missing detail should be clarified with the clinician who interpreted the scan.",
    topic: "Report details",
    status: "Published",
    population: "People with a recorded fibroid diagnosis; illustrative metadata",
    outcome: "Understanding missing location information",
    findings: "Supports a neutral explanation and a question prompt. No location is inferred.",
    limitations: "This entry explains documentation, not an individual scan or clinical significance.",
    reviewer: "Reviewer role placeholder",
    reviewDate: "Illustrative: 12 Feb 2025",
    version: "v1.2 — illustrative",
    cutoff: "Illustrative research cutoff: Jan 2025",
    citations: ["G02 — FIGO classification review (PMC12553092)", "R48 — AMIGOS secondary analysis (PMC5472203)"],
    usedBy: ["Report details: Location", "Suggested visit question", "Appointment summary"],
    history: ["v1.2 — wording clarified", "v1.1 — question prompt added", "v1.0 — initial draft"],
  },
  {
    id: "SYM-004",
    title: "Describing symptom check-in coverage",
    explanation: "Symptom summaries should state how many days were recorded and keep days without entries unknown.",
    topic: "Symptoms",
    status: "Published",
    population: "People recording symptoms in an app; illustrative metadata",
    outcome: "Accurate interpretation of personal symptom history",
    findings: "Coverage and response counts should appear beside any calculated frequency.",
    limitations: "Personal observations are not a diagnosis and are separate from research statistics.",
    reviewer: "Reviewer role placeholder",
    reviewDate: "Illustrative: 20 Feb 2025",
    version: "v2.0 — illustrative",
    cutoff: "Illustrative research cutoff: Jan 2025",
    citations: ["R38 — Core outcome reporting for heavy menstrual bleeding", "T03 — COMPARE-UF design and missingness context"],
    usedBy: ["Symptom statistics", "Appointment summary"],
    history: ["v2.0 — missing-day wording added", "v1.0 — initial draft"],
  },
  {
    id: "FOOD-007",
    title: "No whole-food regimen has been shown here to remove fibroids",
    explanation: "In this bounded review, observational diet associations and supplement studies do not establish that a meal pattern shrinks existing fibroids.",
    topic: "Food & nutrition",
    status: "Published",
    population: "Populations in observational diet studies and selected supplement studies",
    outcome: "Incidence, measured growth, and dietary treatment claims kept separate",
    findings: "No reliably established whole-food regimen that removes fibroids was demonstrated in the bounded review.",
    limitations: "This is not proof that no future dietary effect exists; all nutrition trials have not been comprehensively screened.",
    reviewer: "Reviewer role placeholder",
    reviewDate: "Review pending",
    version: "v0.8 — illustrative",
    cutoff: "Illustrative research cutoff: Jan 2025",
    citations: ["R19 — observational dairy estimates", "R09/R10/R41/R42/R51 — vitamin D studies with different questions", "T02 — FRIEND protocol"],
    usedBy: ["Food claim explanation", "Meal recommendation boundary", "Ingredient swaps"],
    history: ["v0.8 — in review", "v0.4 — criteria revised"],
  },
  {
    id: "TRT-003",
    title: "Symptom relief and fibroid-volume change are different outcomes",
    explanation: "A treatment can reduce bleeding or improve quality of life without eliminating fibroids. Outcomes should be shown separately.",
    topic: "Treatment",
    status: "Published",
    population: "Eligible participants in treatment studies and guidance populations",
    outcome: "Bleeding, symptoms, quality of life, volume, repeat treatment and fertility",
    findings: "Treatment studies measure different outcomes; improvement in one should not stand in for another.",
    limitations: "Does not rank treatments for an individual or predict fertility outcomes.",
    reviewer: "Reviewer role placeholder",
    reviewDate: "Illustrative: 22 Feb 2025",
    version: "v1.0 — illustrative",
    cutoff: "Illustrative research cutoff: Jan 2025",
    citations: ["G03 — management overview", "R23/R24 — LIBERTY outcomes", "R15 — FEMME comparison"],
    usedBy: ["Treatment discussion", "Visit question prompts"],
    history: ["v1.0 — published example", "v0.5 — outcomes separated"],
  },
  {
    id: "VIT-018",
    title: "Vitamin D studies answer different questions",
    explanation: "Incidence, measured growth, cross-sectional levels, genetic instruments and supplementation outcomes should not be merged into one claim.",
    topic: "Food & nutrition",
    status: "In review",
    population: "Different cohorts and selected trial populations",
    outcome: "Incidence, growth and supplementation outcomes",
    findings: "Evidence is heterogeneous and source discrepancies remain.",
    limitations: "Small trials, residual confounding and different settings prevent a single treatment conclusion.",
    reviewer: "Reviewer role placeholder",
    reviewDate: "Review in progress",
    version: "v0.7 — illustrative",
    cutoff: "Illustrative research cutoff: Oct 2026",
    citations: ["R09, R34, R41, R42, R51"],
    usedBy: ["No patient-facing features until review completes"],
    history: ["v0.7 — Ugandan reading added", "v0.5 — outcomes separated"],
  },
  {
    id: "BIO-003",
    title: "Avoid a single excess-estrogen explanation",
    explanation: "Draft scope for explaining genetic, cellular, hormonal and tissue-environment findings without diagnosing a hormone imbalance.",
    topic: "Biology",
    status: "Draft",
    population: "Laboratory models, tissue studies and selected human cohorts",
    outcome: "Plain-language biology explanation",
    findings: "Draft explanation awaiting content review.",
    limitations: "Mechanistic model effects do not establish a patient treatment.",
    reviewer: "Not assigned",
    reviewDate: "Not reviewed",
    version: "v0.2 — illustrative",
    cutoff: "Research cutoff not set",
    citations: ["R11, R21, R22, R37, R43"],
    usedBy: ["No active patient features"],
    history: ["v0.2 — scope narrowed", "v0.1 — initial draft"],
  },
  {
    id: "OLD-002",
    title: "Withdrawn food wording",
    explanation: "Withdrawn explanation retained for audit history only.",
    topic: "Food & nutrition",
    status: "Withdrawn",
    population: "Illustrative metadata",
    outcome: "No longer used",
    findings: "Withdrawn",
    limitations: "Must not appear in the patient experience.",
    reviewer: "Reviewer role placeholder",
    reviewDate: "Illustrative: 03 Dec 2024",
    version: "v1.1 — withdrawn",
    cutoff: "Illustrative research cutoff: Nov 2024",
    citations: ["Citation placeholder OLD-002-A"],
    usedBy: ["No active features"],
    history: ["v1.1 — withdrawn", "v1.0 — previously published"],
  },
];

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    food: <><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 2-3 5-3 8h4v10M18 3v8" /></>,
    health: <><path d="M4 13h4l2-7 4 12 2-5h4" /><path d="M19 5a5 5 0 0 0-7 0 5 5 0 0 0-7 0c-2 2-2 5 0 7l7 7 7-7c2-2 2-5 0-7Z" /></>,
    visit: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 2v3M16 2v3M8 10h8M8 14h5" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    cart: <><path d="M3 4h2l2 11h11l2-7H6" /><circle cx="9" cy="19" r="1" /><circle cx="18" cy="19" r="1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 2-7 6-7s6 3 6 7M16 5a3 3 0 0 1 0 6M17 14c3 1 4 3 4 6" /></>,
    spark: <><path d="M12 2c0 6-3 9-9 9 6 0 9 3 9 9 0-6 3-9 9-9-6 0-9-3-9-9Z" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const tabs: { id: Screen; label: string; icon: IconName }[] = [
  { id: "today", label: "Today", icon: "home" },
  { id: "food", label: "Food", icon: "food" },
  { id: "health", label: "My health", icon: "health" },
  { id: "visit", label: "Appointment", icon: "visit" },
];

const intentMap: Record<string, Screen> = {
  "Understand my scan": "health",
  "Figure out food": "food",
  "Log how I feel": "health",
  "Prepare for a visit": "visit",
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => window.localStorage.getItem("sanelle-auth") === "true");
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const saved = window.localStorage.getItem("sanelle-profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [screen, setScreen] = useState<Screen>("today");
  const [workspace, setWorkspace] = useState<"patient" | "evidence">("patient");
  const [showDesignComparison, setShowDesignComparison] = useState(false);
  const [healthView, setHealthView] = useState<"diagnosis" | "symptoms">("diagnosis");
  const [showIntent, setShowIntent] = useState(() => window.localStorage.getItem("sanelle-today-intro-seen") !== "true");
  const [showLog, setShowLog] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [showReportReview, setShowReportReview] = useState(false);
  const [showReportScan, setShowReportScan] = useState(false);
  const [savedReport, setSavedReport] = useState<SavedReport | null>(null);
  const [hasMealPlan, setHasMealPlan] = useState(false);
  const [suggestedQuestion, setSuggestedQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>(["Bleeding"]);
  const [impact, setImpact] = useState("Slowed me down");
  const [bleeding, setBleeding] = useState("Heavy");
  const [latestCheckIn, setLatestCheckIn] = useState<SymptomEntry | null>(null);
  const [checkIns, setCheckIns] = useState<SymptomEntry[]>([]);
  const [clinicalResult, setClinicalResult] = useState<ClinicalResult | null>(null);
  const [questions, setQuestions] = useState<VisitQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [recentAction, setRecentAction] = useState("");

  const pageTitle = useMemo(
    () => ({ today: `Good morning, ${profile?.name || "there"}`, food: "Food, without the fear", health: "Your health", visit: "Prepare for an appointment" })[screen],
    [screen, profile],
  );

  if (!authenticated) {
    return (
      <AuthFlow
        onAuthenticated={() => {
          window.localStorage.setItem("sanelle-auth", "true");
          setAuthenticated(true);
        }}
      />
    );
  }

  if (!profile) {
    return (
      <Onboarding
        onComplete={(newProfile) => {
          window.localStorage.setItem("sanelle-profile", JSON.stringify(newProfile));
          setProfile(newProfile);
        }}
      />
    );
  }

  if (workspace === "evidence") {
    return <EvidenceCatalog entries={evidenceEntries} onExit={() => setWorkspace("patient")} />;
  }

  if (showDesignComparison) {
    return <DesignComparison onExit={() => setShowDesignComparison(false)} />;
  }

  function go(next: Screen) {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function dismissTodayIntro() {
    window.localStorage.setItem("sanelle-today-intro-seen", "true");
    setShowIntent(false);
  }

  return (
    <div className="app-shell">
      <aside className="desktop-nav" aria-label="Primary navigation">
        <Brand />
        <nav>
          {tabs.map((tab) => (
            <button key={tab.id} className={screen === tab.id ? "active" : ""} onClick={() => go(tab.id)}>
              <Icon name={tab.icon} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="support-note">
          <span>Private by design</span>
          Your entries stay on this device in this demo.
        </div>
      </aside>

      <main>
        <header className="topbar">
          <Brand />
          <div className="topbar-actions">
            <button className="comparison-link" onClick={() => setShowDesignComparison(true)}>Compare design</button>
            <button className="internal-link" onClick={() => setWorkspace("evidence")}><span>Internal</span> Evidence catalog</button>
            <button className="avatar" aria-label="Open profile">{profile.name.slice(0, 1).toUpperCase()}</button>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              {screen !== "today" && <p className="eyebrow">{tabs.find((t) => t.id === screen)?.label}</p>}
              <h1>{pageTitle}</h1>
              {screen === "today" && <p>One helpful next step is enough.</p>}
            </div>
            {screen === "health" && <button className="secondary compact" onClick={() => setShowLog(true)}><Icon name="plus" /> Log symptoms</button>}
          </div>

          {screen === "today" && (
            <Today
              showIntent={showIntent}
              onCloseIntent={dismissTodayIntro}
              go={go}
              chooseIntent={(label) => {
                dismissTodayIntro();
                setRecentAction(label);
                go(intentMap[label]);
              }}
              openLog={() => setShowLog(true)}
              openClaim={() => setShowClaim(true)}
              recentAction={recentAction}
              profile={profile}
              latestCheckIn={latestCheckIn}
              onViewSymptoms={() => {
                setHealthView("symptoms");
                go("health");
              }}
              savedReport={savedReport}
              appointmentDate={profile.appointmentDate}
              hasMealPlan={hasMealPlan}
              openReport={() => setShowReportScan(true)}
            />
          )}
          {screen === "food" && <Food profile={profile} onClaim={() => setShowClaim(true)} onAdd={() => { setHasMealPlan(true); flash("Meal and shopping list saved"); }} />}
          {screen === "health" && <Health
            openLog={() => setShowLog(true)}
            onSuggestQuestion={setSuggestedQuestion}
            onReviewReport={() => setShowReportReview(true)}
            onScanReport={() => setShowReportScan(true)}
            savedReport={savedReport}
            profile={profile}
            latestCheckIn={latestCheckIn}
            checkIns={checkIns}
            clinicalResult={clinicalResult}
            setClinicalResult={setClinicalResult}
            view={healthView}
            setView={setHealthView}
          />}
          {screen === "visit" && (
            <Visit
              profile={profile}
              latestCheckIn={latestCheckIn}
              clinicalResult={clinicalResult}
              questions={questions}
              setQuestions={setQuestions}
              newQuestion={newQuestion}
              setNewQuestion={setNewQuestion}
              addQuestion={() => {
                if (!newQuestion.trim()) return;
                setQuestions([...questions, { id: Date.now(), text: newQuestion.trim(), status: "Open", source: "Added by you" }]);
                setNewQuestion("");
              }}
              removeQuestion={(index) => setQuestions(questions.filter((_, i) => i !== index))}
              onCopy={() => flash("Summary copied")}
            />
          )}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Primary navigation">
        {tabs.map((tab) => (
          <button key={tab.id} className={screen === tab.id ? "active" : ""} onClick={() => go(tab.id)}>
            <Icon name={tab.icon} size={21} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <button className="comparison-fab" onClick={() => setShowDesignComparison(true)}>View design A / B</button>

      {showLog && (
        <SymptomSheet
          symptoms={symptoms}
          setSymptoms={setSymptoms}
          impact={impact}
          setImpact={setImpact}
          bleeding={bleeding}
          setBleeding={setBleeding}
          onClose={() => setShowLog(false)}
          onSave={() => {
            const entry = {
              symptoms: [...symptoms],
              impact,
              recordedAt: new Intl.DateTimeFormat("en", { weekday: "long", hour: "numeric", minute: "2-digit" }).format(new Date()),
              bleeding,
            };
            setLatestCheckIn(entry);
            setCheckIns([entry, ...checkIns]);
            setShowLog(false);
            setRecentAction("Log how I feel");
            flash("Check-in added to your health record");
          }}
        />
      )}
      {showClaim && <ClaimSheet onClose={() => setShowClaim(false)} />}
      {suggestedQuestion && (
        <QuestionSuggestion
          initialQuestion={suggestedQuestion}
          onClose={() => setSuggestedQuestion("")}
          onSave={(text) => {
            setQuestions([...questions, { id: Date.now(), text, status: "Open", source: "Suggested from a missing report detail" }]);
            setSuggestedQuestion("");
            flash("Added to your next doctor’s visit");
          }}
        />
      )}
      {showReportReview && <ReportReview profile={profile} onClose={() => setShowReportReview(false)} onSave={() => { setShowReportReview(false); flash("Checked report details saved"); }} />}
      {showReportScan && (
        <ReportScan
          existingReport={savedReport}
          onClose={() => setShowReportScan(false)}
          onSave={(report) => {
            setSavedReport(report);
            setShowReportScan(false);
            flash(report.status === "Checked" ? "Checked report details saved" : "Report saved to finish later");
          }}
        />
      )}
      {notice && <div className="toast" role="status"><Icon name="check" /> {notice}</div>}
    </div>
  );
}

function Brand() {
  return <div className="brand"><span className="brand-mark">s</span><span>sanelle</span></div>;
}

function AuthFlow({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [view, setView] = useState<"welcome" | "register" | "login" | "forgot" | "check-email">("welcome");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function validate(kind: "register" | "login") {
    setError("");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (kind === "register" && !name.trim()) return setError("Enter your first name.");
    if (password.length < 8) return setError("Your password needs at least 8 characters.");
    if (kind === "register" && !accepted) return setError("Please agree to the terms and privacy policy.");
    if (kind === "register") setView("check-email");
    else onAuthenticated();
  }

  return (
    <div className="auth-shell">
      <header className="auth-header"><Brand /><span>Private, practical support</span></header>
      <main className="auth-main">
        {view === "welcome" && (
          <section className="auth-card welcome-auth">
            <p className="eyebrow">Welcome to Sanelle</p>
            <h1>Your health information,<br />finally in one place.</h1>
            <p>Understand what was recorded, make food decisions with less fear, notice symptom patterns, and prepare for appointments.</p>
            <button className="auth-primary" onClick={() => setView("register")}>Create my account <Icon name="arrow" /></button>
            <button className="auth-secondary" onClick={() => setView("login")}>I already have an account</button>
            <div className="auth-trust"><Icon name="info" /><span>Sanelle supports understanding and organisation. It does not replace medical advice.</span></div>
          </section>
        )}

        {view === "register" && (
          <section className="auth-card">
            <button className="auth-back" onClick={() => setView("welcome")}>← Back</button>
            <p className="eyebrow">Create your account</p>
            <h1>Let’s make Sanelle yours.</h1>
            <p className="auth-description">Your account lets you return to your diagnosis notes, meal plans, symptom history, and appointment questions.</p>
            <div className="auth-fields">
              <label><span>First name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" placeholder="How should we address you?" /></label>
              <label><span>Email address</span><input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" placeholder="you@example.com" /></label>
              <label><span>Password</span><div className="password-field"><input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div></label>
            </div>
            <label className="terms-check"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>I agree to the Terms and acknowledge the Privacy Policy.</span></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="auth-primary" onClick={() => validate("register")}>Create account <Icon name="arrow" /></button>
            <p className="auth-switch">Already registered? <button onClick={() => setView("login")}>Log in</button></p>
          </section>
        )}

        {view === "login" && (
          <section className="auth-card">
            <button className="auth-back" onClick={() => setView("welcome")}>← Back</button>
            <p className="eyebrow">Welcome back</p>
            <h1>Log in to Sanelle</h1>
            <p className="auth-description">Continue with your saved health notes and plans.</p>
            <div className="auth-fields">
              <label><span>Email address</span><input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" placeholder="you@example.com" /></label>
              <label><span>Password <button type="button" onClick={() => setView("forgot")}>Forgot password?</button></span><div className="password-field"><input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" type={showPassword ? "text" : "password"} placeholder="Your password" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div></label>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="auth-primary" onClick={() => validate("login")}>Log in <Icon name="arrow" /></button>
            <p className="auth-switch">New to Sanelle? <button onClick={() => setView("register")}>Create an account</button></p>
            <p className="prototype-note">Prototype interaction: any valid email and password of 8+ characters will continue.</p>
          </section>
        )}

        {view === "forgot" && (
          <section className="auth-card">
            <button className="auth-back" onClick={() => setView("login")}>← Back to login</button>
            <div className="auth-state-icon"><Icon name="visit" size={28} /></div>
            <p className="eyebrow">Reset your password</p>
            <h1>We’ll send you a secure link.</h1>
            <p className="auth-description">Enter the email address connected to your Sanelle account.</p>
            <div className="auth-fields"><label><span>Email address</span><input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="you@example.com" /></label></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="auth-primary" onClick={() => email.includes("@") ? setView("check-email") : setError("Enter a valid email address.")}>Send reset link</button>
          </section>
        )}

        {view === "check-email" && (
          <section className="auth-card auth-confirmation">
            <div className="auth-state-icon"><Icon name="check" size={30} /></div>
            <p className="eyebrow">Check your email</p>
            <h1>Your link is on its way.</h1>
            <p>We sent a secure link to <strong>{email}</strong>. In a production app, the link would verify your email or let you reset your password.</p>
            <button className="auth-primary" onClick={onAuthenticated}>Continue to Sanelle</button>
            <button className="auth-secondary" onClick={() => setView("login")}>Back to login</button>
          </section>
        )}
      </main>
    </div>
  );
}

const blankProfile: Profile = {
  name: "",
  priorities: [],
  fibroidCount: "",
  largestSize: "",
  symptoms: [],
  foodNeeds: [],
  appointmentDate: "",
};

function Onboarding({ onComplete }: { onComplete: (profile: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(blankProfile);
  const totalSteps = 5;
  const priorities = ["Understand my diagnosis", "Make food feel simpler", "Track symptoms", "Prepare for appointments"];
  const symptomOptions = ["Heavy bleeding", "Pain or cramping", "Pelvic pressure", "Low energy", "No symptoms right now"];
  const foodOptions = ["Quick meals", "Budget-friendly ideas", "Cooking for others", "Ingredient substitutions", "Understanding food claims"];

  function toggle(field: "priorities" | "symptoms" | "foodNeeds", value: string) {
    setProfile((current) => ({
      ...current,
      [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value],
    }));
  }

  function loadThandi() {
    setProfile({
      name: "Thandi",
      priorities: ["Understand my diagnosis", "Make food feel simpler", "Prepare for appointments"],
      fibroidCount: "2",
      largestSize: "4.1",
      symptoms: ["Heavy bleeding"],
      foodNeeds: ["Quick meals", "Ingredient substitutions", "Understanding food claims"],
      appointmentDate: "",
    });
    setStep(1);
  }

  return (
    <div className="onboarding">
      <header className="onboarding-header">
        <Brand />
        {step > 0 && <span>Step {step} of {totalSteps - 1}</span>}
      </header>
      <div className="onboarding-progress" aria-hidden="true"><i style={{ width: step === 0 ? "0%" : `${(step / (totalSteps - 1)) * 100}%` }} /></div>
      <main className="onboarding-main">
        {step === 0 && (
          <section className="welcome-step">
            <div className="onboarding-photo"><img src={readingImage} alt="A woman reading at home in natural light" /><span>Start with what matters to you</span></div>
            <p className="eyebrow">Your companion after a fibroid diagnosis</p>
            <h1>Less confusion.<br />More clarity for your next step.</h1>
            <p>Sanelle brings your diagnosis details, food questions, symptoms, and appointment notes into one calm place.</p>
            <label className="onboarding-label" htmlFor="first-name">What should we call you?</label>
            <input id="first-name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your first name" autoComplete="given-name" />
            <button className="primary wide" disabled={!profile.name.trim()} onClick={() => setStep(1)}>Start setting up Sanelle <Icon name="arrow" /></button>
            <button className="demo-link" onClick={loadThandi}>Preview with Thandi’s demo details</button>
            <p className="privacy-copy">You can skip optional questions and update anything later. This local demo stores your answers only in this browser.</p>
          </section>
        )}

        {step === 1 && (
          <OnboardingStep
            eyebrow="Make Sanelle useful from day one"
            title={`What would you like help with, ${profile.name}?`}
            description="Choose any that matter now. This only organises what you see first—it does not create medical recommendations."
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          >
            <div className="onboarding-choices">
              {priorities.map((item) => <ChoiceButton key={item} label={item} selected={profile.priorities.includes(item)} onClick={() => toggle("priorities", item)} />)}
            </div>
          </OnboardingStep>
        )}

        {step === 2 && (
          <OnboardingStep
            eyebrow="Your diagnosis record"
            title="Add only what you know"
            description="Scan reports can be hard to read. Leave anything blank if it was not recorded or you are unsure—Sanelle will never fill the gaps for you."
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          >
            <div className="diagnosis-form">
              <label><span>Number of fibroids <small>Optional</small></span><input inputMode="numeric" value={profile.fibroidCount} onChange={(e) => setProfile({ ...profile, fibroidCount: e.target.value.replace(/\D/g, "") })} placeholder="Not recorded" /></label>
              <label><span>Largest recorded size <small>Optional</small></span><div className="unit-input"><input inputMode="decimal" value={profile.largestSize} onChange={(e) => setProfile({ ...profile, largestSize: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="Not recorded" /><b>cm</b></div></label>
            </div>
            <div className="onboarding-unknowns">
              <Icon name="info" />
              <div><strong>Details to look for later</strong><p>Location, FIGO type and whether a fibroid affects the uterine cavity. It is okay not to know these yet.</p></div>
            </div>
          </OnboardingStep>
        )}

        {step === 3 && (
          <OnboardingStep
            eyebrow="Your everyday context"
            title="What would you like Sanelle to keep in mind?"
            description="These answers make check-ins and meal ideas more relevant. They are optional and can change."
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          >
            <fieldset className="onboarding-group">
              <legend>Symptoms you may want to track</legend>
              <div className="chip-choices">{symptomOptions.map((item) => <ChoiceButton key={item} label={item} selected={profile.symptoms.includes(item)} onClick={() => toggle("symptoms", item)} />)}</div>
            </fieldset>
            <fieldset className="onboarding-group">
              <legend>What would make food planning easier?</legend>
              <div className="chip-choices">{foodOptions.map((item) => <ChoiceButton key={item} label={item} selected={profile.foodNeeds.includes(item)} onClick={() => toggle("foodNeeds", item)} />)}</div>
            </fieldset>
          </OnboardingStep>
        )}

        {step === 4 && (
          <OnboardingStep
            eyebrow="One last optional detail"
            title="Do you have an appointment coming up?"
            description="Add a date if you want Sanelle to help you prepare. No appointment is required."
            onBack={() => setStep(3)}
            onNext={() => onComplete({ ...profile, name: profile.name.trim() || "You" })}
            nextLabel="Finish and open Sanelle"
          >
            <label className="date-field"><span>Appointment date <small>Optional</small></span><input type="date" value={profile.appointmentDate} onChange={(e) => setProfile({ ...profile, appointmentDate: e.target.value })} /></label>
            <section className="setup-summary">
              <p className="eyebrow">Your setup</p>
              <h2>Sanelle will start with</h2>
              <ul>
                <li><Icon name="check" /> {profile.priorities.length ? profile.priorities.join(", ") : "A flexible overview you can explore"}</li>
                <li><Icon name="check" /> {profile.fibroidCount || profile.largestSize ? "The diagnosis details you recorded" : "A place to add diagnosis details later"}</li>
                <li><Icon name="check" /> Food guidance that clearly separates evidence from advice</li>
              </ul>
            </section>
            <p className="consent-note"><strong>Important:</strong> Sanelle supports organisation and understanding. It does not diagnose, prescribe treatment, or replace your healthcare professional.</p>
          </OnboardingStep>
        )}
      </main>
    </div>
  );
}

function ChoiceButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <button type="button" className={selected ? "selected" : ""} onClick={onClick}>{selected && <Icon name="check" size={17} />}<span>{label}</span></button>;
}

function OnboardingStep({
  eyebrow, title, description, children, onBack, onNext, nextLabel = "Continue",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <section className="onboarding-step">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="step-description">{description}</p>
      <div className="step-body">{children}</div>
      <div className="step-actions">
        <button className="back-button" onClick={onBack}>Back</button>
        <button className="primary" onClick={onNext}>{nextLabel} <Icon name="arrow" /></button>
      </div>
    </section>
  );
}

function Today({
  showIntent,
  onCloseIntent,
  go,
  chooseIntent,
  openLog,
  openClaim,
  recentAction,
  profile,
  latestCheckIn,
  onViewSymptoms,
  savedReport,
  appointmentDate,
  hasMealPlan,
  openReport,
}: {
  showIntent: boolean;
  onCloseIntent: () => void;
  go: (screen: Screen) => void;
  chooseIntent: (label: string) => void;
  openLog: () => void;
  openClaim: () => void;
  recentAction: string;
  profile: Profile;
  latestCheckIn: SymptomEntry | null;
  onViewSymptoms: () => void;
  savedReport: SavedReport | null;
  appointmentDate: string;
  hasMealPlan: boolean;
  openReport: () => void;
}) {
  const nextStep = appointmentDate
    ? { eyebrow: "Coming up", title: "Prepare for your appointment", text: `Your appointment is saved for ${appointmentDate}. Review your questions and health summary.`, action: "Review appointment summary", onClick: () => go("visit"), icon: "visit" as IconName }
    : savedReport?.status === "Needs checking"
      ? { eyebrow: "Unfinished report", title: "Finish checking what Sanelle captured", text: `${savedReport.name} is saved, but its extracted details still need your confirmation.`, action: "Check report details", onClick: openReport, icon: "health" as IconName }
      : latestCheckIn
        ? { eyebrow: "Your latest check-in", title: latestCheckIn.symptoms.join(", ") || "Check-in saved", text: `${latestCheckIn.impact}. Add another check-in only if something changed.`, action: "See symptom history", onClick: onViewSymptoms, icon: "health" as IconName }
        : hasMealPlan
          ? { eyebrow: "Your saved meal", title: "Roast veg & herby grain bowls", text: "Your servings, substitutions and shopping list are ready.", action: "Open meal plan", onClick: () => go("food"), icon: "food" as IconName }
          : { eyebrow: "Choose what helps", title: "What would be useful today?", text: "Start with your report, food, symptoms, or an appointment question.", action: "Review my health", onClick: () => go("health"), icon: "home" as IconName };

  return (
    <>
      {showIntent && (
        <section className="intent-panel">
          <button className="icon-button dismiss" onClick={onCloseIntent} aria-label="Skip this question"><Icon name="close" /></button>
          <p className="eyebrow light">New here? Start with one thing</p>
          <h2>What brought you to Sanelle today?</h2>
          <div className="intent-grid">
            {Object.keys(intentMap).map((label, i) => (
              <button onClick={() => chooseIntent(label)} key={label}>
                <span>{i + 1}</span>{label}<Icon name="arrow" />
              </button>
            ))}
          </div>
          <button className="skip-link" onClick={onCloseIntent}>I’d rather look around</button>
        </section>
      )}

      {!showIntent && (
        <section className="today-next">
          <div className="today-next-icon"><Icon name={nextStep.icon} size={24} /></div>
          <div><p className="eyebrow light">{nextStep.eyebrow}</p><h2>{nextStep.title}</h2><p>{nextStep.text}</p><button onClick={nextStep.onClick}>{nextStep.action} <Icon name="arrow" /></button></div>
        </section>
      )}

      {!showIntent && (
        <section className="activity-line">
          <p className="eyebrow">Your recent activity</p>
          <div>
            {latestCheckIn && <span><i></i><b>Check-in saved</b><small>{latestCheckIn.recordedAt}</small></span>}
            {savedReport && <span><i></i><b>{savedReport.name}</b><small>{savedReport.status}</small></span>}
            {hasMealPlan && <span><i></i><b>Meal plan saved</b><small>Shopping list ready</small></span>}
            {!latestCheckIn && !savedReport && !hasMealPlan && <p>Nothing recorded yet. Actions you take will appear here.</p>}
          </div>
        </section>
      )}

      <section className="diagnosis-strip">
        <div className="diagnosis-copy">
          <p className="eyebrow">Your recorded diagnosis</p>
          <h2>{profile.fibroidCount ? `${profile.fibroidCount} fibroids` : "Fibroid diagnosis"} {profile.largestSize && <span>· largest {profile.largestSize} cm</span>}</h2>
          <p><strong>3 details are not recorded yet</strong></p>
        </div>
        <button className="circle-arrow" onClick={() => go("health")} aria-label="Review diagnosis"><Icon name="arrow" /></button>
      </section>

      <div className="section-title">
        <div><p className="eyebrow">Food for real life</p><h2>Cook once, feel sorted</h2></div>
        <button onClick={() => go("food")}>Explore food <Icon name="arrow" /></button>
      </div>
      <article className="meal-feature">
        <img src={mealImage} alt="A colourful bowl of grains and roasted vegetables" />
        <div className="meal-overlay">
          <div className="pill">Easy batch lunch</div>
          <h2>Roast veg & herby grain bowls</h2>
          <div className="meta"><span><Icon name="clock" /> 35 min</span><span><Icon name="people" /> 4 servings</span></div>
          <button onClick={() => go("food")}>See the flexible recipe <Icon name="arrow" /></button>
        </div>
      </article>

      <div className="two-column">
        {latestCheckIn ? (
          <section className="checkin-result">
            <div className="checkin-result-head">
              <div><p className="eyebrow">Today’s check-in</p><h2>Here’s what you recorded</h2></div>
              <span><Icon name="check" size={16} /> Saved</span>
            </div>
            <dl>
              <div><dt>Symptoms</dt><dd>{latestCheckIn.symptoms.length ? latestCheckIn.symptoms.join(", ") : "No symptoms selected"}</dd></div>
              {latestCheckIn.symptoms.includes("Bleeding") && <div><dt>Bleeding</dt><dd>{latestCheckIn.bleeding}</dd></div>}
              <div><dt>Effect on your day</dt><dd>{latestCheckIn.impact}</dd></div>
              <div><dt>Recorded</dt><dd>{latestCheckIn.recordedAt}</dd></div>
            </dl>
            <p className="checkin-destination"><Icon name="visit" size={18} /> This is now in <strong>Symptoms & daily life</strong> and your appointment summary.</p>
            <div className="checkin-actions">
              <button onClick={openLog}>Edit this check-in</button>
              <button onClick={onViewSymptoms}>See symptom history <Icon name="arrow" /></button>
            </div>
          </section>
        ) : (
          <section className="action-block blush">
            <p className="eyebrow">Symptoms & daily life</p>
            <h2>Record what changed today</h2>
            <p>Save symptoms alongside what they stopped, delayed, or changed in your day.</p>
            <button className="text-action" onClick={openLog}>Start a check-in <Icon name="arrow" /></button>
          </section>
        )}
        <section className="action-block apricot">
          <div className="action-icon"><Icon name="info" /></div>
          <p className="eyebrow">Claim check</p>
          <h2>“Can food shrink fibroids?”</h2>
          <p>Separate incidence research, measured growth and treatment claims.</p>
          <button className="text-action" onClick={openClaim}>Read the evidence <Icon name="arrow" /></button>
        </section>
      </div>
    </>
  );
}

function Food({ profile, onClaim, onAdd }: { profile: Profile; onClaim: () => void; onAdd: () => void }) {
  const [servings, setServings] = useState(2);
  const [swap, setSwap] = useState(false);
  const [vegetableChoice, setVegetableChoice] = useState("Roasted seasonal veg");
  const [foodPath, setFoodPath] = useState<"claims" | "meals" | "plan">("meals");
  const [mealStage, setMealStage] = useState<"plan" | "cook">("plan");
  const [shopping, setShopping] = useState([
    { name: "Pearl couscous", checked: false },
    { name: "Seasonal vegetables", checked: false },
    { name: "Fresh herbs", checked: true },
  ]);
  const [newItem, setNewItem] = useState("");
  return (
    <>
      <section className="food-intro">
        <div>
          <p className="eyebrow">A calmer approach</p>
          <h2>No banned lists. Just practical choices.</h2>
          <p>Check confusing advice, find meals you can adapt, or plan what to cook. Food here supports general wellbeing—it is not a fibroid treatment.</p>
        </div>
      </section>

      <section className="food-paths" aria-label="Choose what you want to do with food">
        <button className={foodPath === "claims" ? "selected" : ""} onClick={() => { setFoodPath("claims"); onClaim(); }}>
          <span>01</span><strong>Check food advice</strong><small>See what evidence can tell us</small>
        </button>
        <button className={foodPath === "meals" ? "selected" : ""} onClick={() => setFoodPath("meals")}>
          <span>02</span><strong>Find something to cook</strong><small>Flexible recipes and swaps</small>
        </button>
        <button className={foodPath === "plan" ? "selected" : ""} onClick={() => setFoodPath("plan")}>
          <span>03</span><strong>Plan meals & groceries</strong><small>Servings, ingredients and a list</small>
        </button>
      </section>

      {foodPath === "plan" && <MealPlanner onSave={onAdd} />}

      <section className="planner" id="meal-planner">
        <div className="planner-image"><img src={mealImage} alt="A colourful bowl of grains and roasted vegetables" /></div>
        <div className="planner-content">
          <p className="eyebrow">{foodPath === "plan" ? "Start your meal plan" : "A flexible recipe"}</p>
          <h2>Roast veg & herby grain bowls</h2>
          <p className="muted">A mix-and-match base for lunches, with simple substitutions.</p>
          <div className="selection-reason"><Icon name="check" size={17} /><span>Suggested because you chose <strong>{profile.foodNeeds[0] || "flexible meals"}</strong> and it can be adapted with simple swaps. This is a practical match, not a treatment recommendation.</span></div>
          <div className="meal-stage" aria-label="Meal progress">
            <button className={mealStage === "plan" ? "selected" : ""} onClick={() => setMealStage("plan")}>1. Plan</button>
            <button className={mealStage === "cook" ? "selected" : ""} onClick={() => setMealStage("cook")}>2. Prepare</button>
          </div>
          {mealStage === "cook" && <div className="prep-note"><strong>Ready to prepare?</strong><p>Set aside 35 minutes. Start the vegetables first, then prepare the grain while they roast.</p></div>}
          <div className="serving-row">
            <span>Servings</span>
            <div className="stepper">
              <button onClick={() => setServings(Math.max(1, servings - 1))} aria-label="Fewer servings">−</button>
              <strong>{servings}</strong>
              <button onClick={() => setServings(servings + 1)} aria-label="More servings">+</button>
            </div>
          </div>
          <div className="swap">
            <div><strong>{swap ? "Brown rice" : "Pearl couscous"}</strong><span>cup dry · {servings} serving{servings > 1 ? "s" : ""}</span></div>
            <button onClick={() => setSwap(!swap)}>Swap for {swap ? "couscous" : "brown rice"}</button>
          </div>
          <div className="swap">
            <div><strong>{vegetableChoice}</strong><span>{servings * 1.5} cups</span></div>
            <button onClick={() => setVegetableChoice(vegetableChoice === "Roasted seasonal veg" ? "Broccoli, peppers & carrots" : "Roasted seasonal veg")}>Change vegetables</button>
          </div>
          {mealStage === "plan" && <button className="primary wide" onClick={onAdd}><Icon name="cart" /> Save this meal and shopping list</button>}
          <details className="evidence-disclosure">
            <summary>Why this meal appears here</summary>
            <p>Selection uses your saved practical preferences, preparation time, servings, and substitutions. It does not use a claim that this recipe changes fibroids.</p>
            <span>No claim that this meal treats fibroids is used in the selection.</span>
          </details>
        </div>
      </section>

      <section className="shopping-section">
        <div className="section-title"><div><p className="eyebrow">Editable list</p><h2>Shopping for this meal</h2></div></div>
        <p className="muted">Tick what you already have. The remaining items stay on your list.</p>
        <div className="shopping-list">
          {shopping.map((item, index) => (
            <label key={`${item.name}-${index}`}><input type="checkbox" checked={item.checked} onChange={() => setShopping(shopping.map((current, i) => i === index ? { ...current, checked: !current.checked } : current))} /><span>{item.name}</span><button type="button" onClick={() => setShopping(shopping.filter((_, i) => i !== index))} aria-label={`Remove ${item.name}`}><Icon name="close" size={16} /></button></label>
          ))}
        </div>
        <div className="shopping-add"><input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add another item" /><button onClick={() => { if (newItem.trim()) setShopping([...shopping, { name: newItem.trim(), checked: false }]); setNewItem(""); }}><Icon name="plus" /></button></div>
      </section>

      <section className="meal-alternatives">
        <div className="section-title"><div><p className="eyebrow">Choose by real constraints</p><h2>Other meals that may fit</h2></div></div>
        <div className="meal-alternative-grid">
          <article>
            <img src={quickMealImage} alt="A bowl with rice, beans and colourful vegetables" />
            <div><span>20 min · one bowl</span><h3>Bean, rice & crunchy veg bowl</h3><p>Appears because you selected quick meals. Uses flexible vegetables and pantry staples.</p><button onClick={() => setMealStage("plan")}>Plan this meal</button></div>
          </article>
          <article>
            <img src={pantryMealImage} alt="Vegetable dishes served in bowls" />
            <div><span>Cook once · 4 servings</span><h3>Spiced lentils with roast vegetables</h3><p>Appears because it can be portioned ahead and adapted to available ingredients.</p><button onClick={() => setMealStage("plan")}>Plan this meal</button></div>
          </article>
        </div>
        <p className="photo-credit">Food photography via Unsplash: Joanna Stołowicz and Nathan Dumlao.</p>
      </section>

      <div className="section-title"><div><p className="eyebrow">Saved evidence</p><h2>Claims worth unpacking</h2></div></div>
      <button className="claim-row" onClick={onClaim}>
        <div className="claim-label">Food<br /><span>Growth</span></div>
        <div><strong>Can a specific diet shrink fibroids?</strong><p>No whole-food regimen that removes fibroids was established in this bounded review.</p></div>
        <Icon name="arrow" />
      </button>
    </>
  );
}

function MealPlanner({ onSave }: { onSave: () => void }) {
  const horizons = [
    { label: "3 days", days: 3 },
    { label: "1 week", days: 7 },
    { label: "2 weeks", days: 14 },
    { label: "1 month", days: 30 },
  ];
  const meals = [
    { name: "Roast veg & herby grain bowls", time: "35 min", image: mealImage, note: "Cook 4 servings" },
    { name: "Bean, rice & crunchy veg bowl", time: "20 min", image: quickMealImage, note: "Quick assembly" },
    { name: "Spiced lentils with roast vegetables", time: "40 min", image: pantryMealImage, note: "Good for leftovers" },
  ];
  const [days, setDays] = useState(7);
  const [selectedDay, setSelectedDay] = useState(0);
  const [groceryWeek, setGroceryWeek] = useState(0);
  const [assignments, setAssignments] = useState<(number | null)[]>(Array.from({ length: 30 }, (_, index) => index % 4 === 3 ? null : index % meals.length));
  const [prepared, setPrepared] = useState<number[]>([]);

  function setMeal(day: number, meal: number | null) {
    setAssignments(assignments.map((current, index) => index === day ? meal : current));
  }

  const plannedDays = assignments.slice(0, days).filter((item) => item !== null).length;
  const groceryDays = Math.min(days, 7);
  const groceryStart = groceryWeek * 7;
  const groceryAssignments = assignments.slice(groceryStart, Math.min(groceryStart + groceryDays, days));
  const weekCount = Math.ceil(days / 7);

  return (
    <section className="meal-plan-builder">
      <header className="meal-plan-head">
        <div><p className="eyebrow">Your meal planner</p><h2>Plan enough to make the week easier</h2><p>Choose the time period, then change or clear any day. Monthly plans are organised by week so groceries stay practical.</p></div>
        <div className="plan-count"><strong>{plannedDays}</strong><span>meals planned</span></div>
      </header>

      <div className="horizon-tabs" role="tablist" aria-label="Meal plan duration">
        {horizons.map((horizon) => <button role="tab" aria-selected={days === horizon.days} className={days === horizon.days ? "selected" : ""} key={horizon.days} onClick={() => { setDays(horizon.days); setSelectedDay(0); setGroceryWeek(0); }}>{horizon.label}</button>)}
      </div>

      <div className={`plan-calendar ${days > 7 ? "compact" : ""}`}>
        {Array.from({ length: days }, (_, index) => {
          const mealIndex = assignments[index];
          const meal = mealIndex === null ? null : meals[mealIndex];
          return (
            <button className={`${selectedDay === index ? "selected" : ""} ${prepared.includes(index) ? "prepared" : ""}`} key={index} onClick={() => setSelectedDay(index)}>
              <span>Day {index + 1}</span>
              {meal ? <><img src={meal.image} alt="" /><strong>{meal.name}</strong><small>{meal.time}{prepared.includes(index) ? " · Prep done" : ""}</small></> : <div className="open-day"><Icon name="plus" /><small>No meal planned</small></div>}
            </button>
          );
        })}
      </div>

      <div className="day-editor">
        <div className="day-editor-head"><div><p className="eyebrow">Day {selectedDay + 1}</p><h3>{assignments[selectedDay] === null ? "Choose a meal" : meals[assignments[selectedDay] as number].name}</h3></div>{assignments[selectedDay] !== null && <button onClick={() => setPrepared(prepared.includes(selectedDay) ? prepared.filter((day) => day !== selectedDay) : [...prepared, selectedDay])}>{prepared.includes(selectedDay) ? "Undo prep" : "Mark prep done"}</button>}</div>
        <div className="meal-choice-list">
          {meals.map((meal, index) => <button className={assignments[selectedDay] === index ? "selected" : ""} key={meal.name} onClick={() => setMeal(selectedDay, index)}><img src={meal.image} alt="" /><span><strong>{meal.name}</strong><small>{meal.time} · {meal.note}</small></span>{assignments[selectedDay] === index && <Icon name="check" />}</button>)}
          <button className={assignments[selectedDay] === null ? "selected no-plan" : "no-plan"} onClick={() => setMeal(selectedDay, null)}><span><strong>Leave this day open</strong><small>No meal or grocery items added</small></span></button>
        </div>
      </div>

      <div className="plan-groceries">
        <div><p className="eyebrow">Grocery window</p><h3>{days > 7 ? `Week ${groceryWeek + 1} of your plan` : `Your ${days}-day plan`}</h3><p>For longer plans, create one list at a time rather than buying a month of fresh ingredients.</p>
          {weekCount > 1 && <div className="grocery-weeks">{Array.from({ length: weekCount }, (_, index) => <button className={groceryWeek === index ? "selected" : ""} key={index} onClick={() => setGroceryWeek(index)}>Week {index + 1}</button>)}</div>}
        </div>
        <ul>
          <li><span>Mixed vegetables</span><strong>{Math.max(0, groceryAssignments.filter((item) => item !== null).length * 2)} portions</strong></li>
          <li><span>Grain or rice base</span><strong>{Math.max(0, groceryAssignments.filter((item) => item !== null).length)} meal packs</strong></li>
          <li><span>Beans or lentils</span><strong>{groceryAssignments.filter((item) => item === 1 || item === 2).length} meals</strong></li>
        </ul>
      </div>
      <button className="primary wide" onClick={onSave}><Icon name="check" /> Save {days === 30 ? "monthly" : `${days}-day`} plan</button>
      <p className="fine-print">Meal plans support preparation and shopping. A planned or prepared meal is not treated as proof that it was eaten or that it affected fibroids.</p>
    </section>
  );
}

function Health({ openLog, onSuggestQuestion, onReviewReport, onScanReport, savedReport, profile, latestCheckIn, checkIns, clinicalResult, setClinicalResult, view, setView }: { openLog: () => void; onSuggestQuestion: (question: string) => void; onReviewReport: () => void; onScanReport: () => void; savedReport: SavedReport | null; profile: Profile; latestCheckIn: SymptomEntry | null; checkIns: SymptomEntry[]; clinicalResult: ClinicalResult | null; setClinicalResult: (result: ClinicalResult) => void; view: "diagnosis" | "symptoms"; setView: (view: "diagnosis" | "symptoms") => void }) {
  const [showTreatmentEvidence, setShowTreatmentEvidence] = useState(false);
  const [showLabForm, setShowLabForm] = useState(false);
  const [labValue, setLabValue] = useState("");
  const [labDate, setLabDate] = useState("");
  const missingDetails = [
    { label: "Location", question: "Where are my fibroids located?", explanation: "Your saved report doesn’t include a location. You can ask your doctor to explain this." },
    { label: "FIGO type", question: "What FIGO type are my fibroids?", explanation: "Your saved report doesn’t include a FIGO type. This classification may not appear on every report." },
    { label: "Cavity involvement", question: "Do either of my fibroids affect the uterine cavity?", explanation: "Your saved report doesn’t say whether either fibroid affects the uterine cavity." },
  ];
  const recordedCount = Math.min(checkIns.length, 30);
  const bleedingAnswers = checkIns.slice(0, 30).filter((entry) => entry.bleeding);
  const heavyCount = bleedingAnswers.filter((entry) => entry.bleeding === "Heavy" || entry.bleeding === "Very heavy").length;
  return (
    <>
      <div className="health-tabs" role="tablist" aria-label="Your health information">
        <button role="tab" aria-selected={view === "diagnosis"} className={view === "diagnosis" ? "selected" : ""} onClick={() => setView("diagnosis")}>Diagnosis details</button>
        <button role="tab" aria-selected={view === "symptoms"} className={view === "symptoms" ? "selected" : ""} onClick={() => setView("symptoms")}>Symptoms & daily life</button>
      </div>

      {view === "diagnosis" ? <>
      <section className="health-summary">
        <div>
          <p className="eyebrow light">Recorded from your scan</p>
          <h2>{profile.fibroidCount ? `${profile.fibroidCount} fibroids` : "Diagnosis saved"}</h2>
          <p>{profile.largestSize ? <>Largest recorded size <strong>{profile.largestSize} cm</strong></> : "No size recorded"}</p>
          <div className="report-actions">
            <button className="light-action" onClick={onScanReport}>{savedReport ? "Add another report" : "Add a scan report"}</button>
            <button className="light-action quiet" onClick={onReviewReport}>Check saved details</button>
          </div>
        </div>
        <div className="report-document" aria-label="Visual preview of saved report fields">
          <span>Ultrasound report</span><i></i><i></i>
          <div><small>Number</small><b>{profile.fibroidCount || "—"}</b></div>
          <div><small>Largest size</small><b>{profile.largestSize ? `${profile.largestSize} cm` : "—"}</b></div>
          <em>3 fields not recorded</em>
        </div>
      </section>

      <section className="report-library">
        <div className="section-title"><div><p className="eyebrow">Your source documents</p><h2>Reports</h2></div><button onClick={onScanReport}><Icon name="plus" /> Add report</button></div>
        {savedReport ? (
          <button className="report-list-item" onClick={onScanReport}>
            <div className="report-page-thumb"><i></i><i></i><b>{savedReport.pages}</b></div>
            <div><strong>{savedReport.name}</strong><span>{savedReport.date} · {savedReport.pages} page{savedReport.pages === 1 ? "" : "s"}</span></div>
            <em className={savedReport.status === "Checked" ? "checked" : ""}>{savedReport.status}</em>
            <Icon name="arrow" />
          </button>
        ) : (
          <div className="report-empty"><strong>No report files saved yet.</strong><p>Take photos, choose images, upload a PDF, or enter details manually.</p><button onClick={onScanReport}>Add your first report</button></div>
        )}
      </section>

      <section className="details-section">
        <div className="section-title"><div><p className="eyebrow">Report wording + explanation</p><h2>Your diagnosis details</h2></div></div>
        <article className="report-detail">
          <div className="report-wording"><span>Report field</span><strong>Number of fibroids</strong><b>{profile.fibroidCount || "Not recorded"}</b></div>
          <details><summary>What does this mean?</summary><p>This is the number recorded in the report details you checked. Sanelle does not add to or reinterpret that number.</p></details>
        </article>
        <article className="report-detail">
          <div className="report-wording"><span>Report field</span><strong>Largest recorded size</strong><b>{profile.largestSize ? `${profile.largestSize} cm` : "Not recorded"}</b></div>
          <details><summary>What does this mean?</summary><p>This preserves the value and unit you confirmed. A clinician can explain what the measurement means in the context of your scan.</p></details>
        </article>
        {missingDetails.map((item) => (
          <article className="report-detail missing-report" key={item.label}>
            <div className="report-wording"><span>Report field</span><strong>{item.label}</strong><b>Not recorded</b></div>
            <p>{item.explanation}</p>
            <button onClick={() => onSuggestQuestion(item.question)}>Add a question for my next doctor’s visit</button>
            <details className="source-details"><summary>Sources and limitations</summary><p>This explanation is supported by reviewed catalog entry EXP-001. It explains missing documentation only and cannot interpret your scan. Source labels are illustrative in this prototype.</p></details>
          </article>
        ))}
        <div className="unknown-note"><Icon name="info" /><p><strong>“Not recorded” does not mean abnormal.</strong> It means this detail is not in the information you added. Sanelle won’t guess.</p></div>
      </section>

      <section className="treatment-section">
        <p className="eyebrow">Preparing for a care discussion</p>
        <h2>Understanding treatment conversations</h2>
        <p>Treatment discussions can include monitoring, medicines, procedures, or surgery. The research library keeps treatments received, people’s preferences, and barriers to care as separate questions rather than treating them as the same outcome.</p>
        <div className="outcome-map" aria-label="Treatment outcomes should be considered separately">
          <div><span>01</span><strong>Symptoms</strong><p>Bleeding, pain, pressure and daily impact</p></div>
          <div><span>02</span><strong>Fibroid measures</strong><p>Volume, number and location</p></div>
          <div><span>03</span><strong>Durability</strong><p>Repeat treatment and follow-up time</p></div>
          <div><span>04</span><strong>Reproduction</strong><p>Pregnancy and fertility questions need their own denominators</p></div>
        </div>
        <div className="boundary-note"><strong>Sanelle does not recommend a treatment or predict fertility outcomes.</strong> Use this area to understand terms and prepare questions for a qualified clinician.</div>
        <button className="text-action" onClick={() => setShowTreatmentEvidence(!showTreatmentEvidence)}>{showTreatmentEvidence ? "Hide" : "Show"} evidence scope <Icon name="arrow" /></button>
        {showTreatmentEvidence && <div className="evidence-scope"><p><strong>Evidence boundary</strong></p><p>This prototype only supports understanding broad categories and preparing questions. It does not compare options for you, recommend a treatment, or predict fertility outcomes.</p></div>}
      </section>
      </> : (
      <section className="timeline">
        <div className="section-title"><div><p className="eyebrow">Symptoms & daily life</p><h2>Notice what changes for you</h2></div><button onClick={openLog}>Log today <Icon name="plus" /></button></div>
        {latestCheckIn ? (
          <article className="history-entry">
            <time>{latestCheckIn.recordedAt}</time>
            <h3>{latestCheckIn.symptoms.includes("Bleeding") ? `${latestCheckIn.bleeding} bleeding` : latestCheckIn.symptoms.length ? latestCheckIn.symptoms.join(" · ") : "No symptoms selected"}</h3>
            <p><strong>Effect on your day:</strong> {latestCheckIn.impact}</p>
            <button onClick={openLog}>Edit check-in</button>
          </article>
        ) : (
          <div className="empty-chart">
            <div><strong>No check-ins yet.</strong><p>Record a symptom when it affects your day. No daily streak required.</p></div>
          </div>
        )}
        <section className="history-window">
          <div className="history-window-head"><div><p className="eyebrow">Your recorded history</p><h3>Current 30-day window</h3></div><strong>{recordedCount}<span> days recorded</span></strong></div>
          <div className="day-dots" aria-label={`${recordedCount} of 30 days have check-ins`}>
            {Array.from({ length: 30 }, (_, index) => {
              const entry = checkIns[29 - index];
              const intensity = entry?.bleeding?.toLowerCase().replace(" ", "-") || "unknown";
              return <i key={index} className={entry ? intensity : "unknown"} title={entry ? `${entry.bleeding} bleeding` : "No entry — unknown"}></i>;
            })}
          </div>
          <div className="dot-key"><span><i className="heavy"></i> Heavy</span><span><i className="moderate"></i> Moderate</span><span><i className="light"></i> Light</span><span><i className="unknown"></i> No entry</span></div>
          <p>Days without a check-in remain unknown. They are not counted as symptom-free days.</p>
        </section>

        <section className="context-learning">
          <div className="section-title"><div><p className="eyebrow">Based on what you record</p><h2>Useful context, not predictions</h2></div></div>
          <div className="learning-scroll">
            <article className="learning-card visual-card">
              <div className="signal-visual"><i></i><i></i><i></i><span>C11</span></div>
              <strong>Size and symptoms answer different questions</strong>
              <p>Bleeding, pain, pressure and daily impact can matter even when a fibroid is small. A check-in does not prove the fibroid caused a symptom.</p>
              <details><summary>Sources and limits</summary><p>G02, G03, R05, R16 and R38 support keeping anatomy and symptom impact separate.</p></details>
            </article>
            <article className="learning-card photo-learning">
              <img src={notesImage} alt="Notebook and pen for preparing a health conversation" />
              <div><strong>Bring the impact, not just a score</strong><p>Preserve what changed in your day so you can decide whether to bring it to an appointment.</p><span>C14 · C15</span></div>
            </article>
            <article className="learning-card">
              <div className="blood-result-visual"><span>Symptoms</span><b>≠</b><span>Lab result</span></div>
              <strong>Heavy bleeding cannot diagnose anemia</strong>
              <p>Fatigue and bleeding history can support a clinical conversation. Anemia and iron deficiency require their own assessment.</p>
              <details><summary>Sources and limits</summary><p>C12 draws on R05 and R56. No diagnosis is calculated from your logs.</p></details>
            </article>
          </div>
        </section>

        <section className="stats-example">
          <div className="stats-head"><div><p className="eyebrow">Your observations</p><h3>30-day summary</h3></div><span>Personal history</span></div>
          <p className="stat-callout">You checked in on <strong>{recordedCount} of 30 days</strong>. Of the {bleedingAnswers.length} check-in{bleedingAnswers.length === 1 ? "" : "s"} with a bleeding answer, <strong>{heavyCount} recorded heavy or very heavy bleeding.</strong></p>
          <div className="coverage-row"><span style={{ width: `${(recordedCount / 30) * 100}%` }}></span></div>
          <p className="coverage-note"><strong>Coverage: {Math.round((recordedCount / 30) * 100)}%</strong> · The other {30 - recordedCount} days are unknown, not symptom-free.</p>
          <details className="evidence-disclosure"><summary>How this statistic is calculated</summary><p>Counts use only saved personal check-ins. Missing days and unanswered fields are excluded and shown separately. Personal history is not combined with research statistics.</p><span>The research library includes a measurement review, but instrument ratings and source gaps remain unresolved. This demo statistic is not a validated clinical score.</span></details>
        </section>
        <section className="clinical-results">
          <div><p className="eyebrow">Clinical results, if you have them</p><h3>Keep symptoms and lab results separate</h3><p>Fatigue or heavy bleeding cannot diagnose anemia. You can save a dated hemoglobin result exactly as reported for your next conversation.</p></div>
          {clinicalResult ? (
            <div className="saved-lab"><span>Hemoglobin</span><strong>{clinicalResult.value} g/dL</strong><small>Reported result · {clinicalResult.date}</small><button onClick={() => setShowLabForm(true)}>Edit result</button></div>
          ) : !showLabForm ? (
            <button className="secondary" onClick={() => setShowLabForm(true)}>Add a reported result</button>
          ) : null}
          {showLabForm && (
            <div className="lab-form">
              <label>Result exactly as reported<div><input inputMode="decimal" value={labValue} onChange={(e) => setLabValue(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="For example 11.2" /><span>g/dL</span></div></label>
              <label>Test date<input type="date" value={labDate} onChange={(e) => setLabDate(e.target.value)} /></label>
              <button disabled={!labValue || !labDate} onClick={() => { setClinicalResult({ value: labValue, date: labDate }); setShowLabForm(false); }}>Save reported result</button>
            </div>
          )}
          <details className="evidence-disclosure"><summary>Why Sanelle keeps this separate</summary><p>Claim C12 distinguishes self-reported fatigue or heavy bleeding from clinical anemia and iron-deficiency assessment. Sanelle records the source, date and unit without interpreting the result.</p></details>
        </section>
        <button className="primary wide" onClick={openLog}><Icon name="plus" /> Log symptoms and their impact</button>
      </section>
      )}
    </>
  );
}

function Visit({
  profile, latestCheckIn, clinicalResult, questions, setQuestions, newQuestion, setNewQuestion, addQuestion, removeQuestion, onCopy,
}: {
  profile: Profile;
  latestCheckIn: SymptomEntry | null;
  clinicalResult: ClinicalResult | null;
  questions: VisitQuestion[];
  setQuestions: (questions: VisitQuestion[]) => void;
  newQuestion: string;
  setNewQuestion: (value: string) => void;
  addQuestion: () => void;
  removeQuestion: (index: number) => void;
  onCopy: () => void;
}) {
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  function saveOutcome(status: "Answered" | "Unresolved") {
    setQuestions(questions.map((question) => question.id === answeringId ? { ...question, status, answer: answer.trim() || undefined, nextStep: nextStep.trim() || undefined, reviewDate: reviewDate || undefined } : question));
    setAnsweringId(null);
    setAnswer("");
    setNextStep("");
    setReviewDate("");
  }

  return (
    <>
      <section className="visit-intro">
        <div><p className="eyebrow light">Your editable brief</p>
          <h2>Walk in with the full picture,<br />not a perfect memory.</h2>
          <p>Sanelle has brought together what you recorded. Review and edit before sharing with a clinician.</p>
        </div>
        <img src={notesImage} alt="A notebook and pen ready for appointment questions" />
      </section>
      <section className="visit-paper">
        <div className="paper-head"><div><p className="eyebrow">Appointment summary</p><h2>{profile.name}’s health notes</h2></div><span>Draft</span></div>
        <div className="paper-section">
          <h3>Recorded diagnosis</h3>
          <p>{profile.fibroidCount ? `${profile.fibroidCount} fibroids` : "Fibroid diagnosis"}{profile.largestSize ? `; largest recorded as ${profile.largestSize} cm.` : "; no size recorded."}</p>
          <div className="missing-inline"><Icon name="info" /><span>Location, FIGO type and cavity involvement are not recorded.</span></div>
        </div>
        <div className="paper-section">
          <h3>Recent symptoms & impact</h3>
          <p>{latestCheckIn ? `${latestCheckIn.symptoms.includes("Bleeding") ? `${latestCheckIn.bleeding} bleeding` : latestCheckIn.symptoms.join(", ") || "No symptoms selected"} · ${latestCheckIn.impact}` : "No symptom check-ins recorded yet."}</p>
          {clinicalResult && <p className="summary-clinical-result"><strong>Reported clinical result:</strong> Hemoglobin {clinicalResult.value} g/dL on {clinicalResult.date}. No interpretation added.</p>}
        </div>
        <div className="paper-section">
          <h3>Questions for my healthcare professional</h3>
          {questions.length === 0 && <div className="question-empty"><strong>No questions saved yet.</strong><p>Add one in your own words, or accept a suggestion from a missing report detail.</p></div>}
          <ol className="questions visit-questions">
            {questions.map((question, index) => (
              <li key={question.id}>
                <span>{index + 1}</span>
                <div>
                  <p>{question.text}</p>
                  <small>{question.source} · <b className={`question-status ${question.status.toLowerCase()}`}>{question.status}</b></small>
                  {question.answer && <div className="saved-answer"><strong>Answer recorded</strong><p>{question.answer}</p>{question.nextStep && <p><b>Next step:</b> {question.nextStep}{question.reviewDate ? ` · Review ${question.reviewDate}` : ""}</p>}</div>}
                  {answeringId === question.id ? (
                    <div className="answer-form">
                      <label>What did your clinician say?<textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Save the answer in your own words" /></label>
                      <label>Agreed next step<input value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="For example: request report copy" /></label>
                      <label>Review or follow-up date<input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} /></label>
                      <div><button onClick={() => saveOutcome("Answered")}>Save answer</button><button onClick={() => saveOutcome("Unresolved")}>Mark unresolved</button></div>
                    </div>
                  ) : (
                    <button className="record-answer" onClick={() => setAnsweringId(question.id)}>{question.status === "Answered" ? "Update answer" : "Record an answer or next step"}</button>
                  )}
                  {question.status === "Unresolved" && <button className="carry-forward" onClick={() => setQuestions(questions.map((item) => item.id === question.id ? { ...item, status: "Open", source: "Carried forward from previous visit" } : item))}>Carry forward to next visit</button>}
                </div>
                <button onClick={() => removeQuestion(index)} aria-label={`Remove question: ${question.text}`}><Icon name="close" size={17} /></button>
              </li>
            ))}
          </ol>
          <div className="question-input">
            <input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addQuestion()}
              placeholder="Type a question you want to remember"
              aria-label="New appointment question"
            />
            <button onClick={addQuestion} aria-label="Add question"><Icon name="plus" /></button>
          </div>
        </div>
        <button className="primary wide" onClick={onCopy}>Copy editable summary</button>
        <p className="fine-print centered">This summary contains only details you entered. Review it with your healthcare professional.</p>
      </section>
    </>
  );
}

function QuestionSuggestion({
  initialQuestion,
  onClose,
  onSave,
}: {
  initialQuestion: string;
  onClose: () => void;
  onSave: (question: string) => void;
}) {
  const [question, setQuestion] = useState(initialQuestion);
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="suggestion-title">
      <button className="backdrop" onClick={onClose} aria-label="Dismiss suggested question"></button>
      <div className="sheet suggestion-sheet">
        <button className="icon-button sheet-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <p className="eyebrow">Suggested from your report</p>
        <h2 id="suggestion-title">Would you like to save this question?</h2>
        <p>Nothing is added automatically. Edit it so it sounds like you, save it, or dismiss it.</p>
        <label className="question-editor">Question<textarea value={question} onChange={(e) => setQuestion(e.target.value)} /></label>
        <button className="primary wide" disabled={!question.trim()} onClick={() => onSave(question.trim())}>Add to my next doctor’s visit</button>
        <button className="dismiss-action" onClick={onClose}>Not now</button>
      </div>
    </div>
  );
}

function ReportScan({ existingReport, onClose, onSave }: { existingReport: SavedReport | null; onClose: () => void; onSave: (report: SavedReport) => void }) {
  const [stage, setStage] = useState<"choose" | "capture" | "review">(existingReport ? "review" : "choose");
  const [sourceName, setSourceName] = useState(existingReport?.name || "Ultrasound report");
  const [pages, setPages] = useState(existingReport?.pages || 1);
  const [originalWording, setOriginalWording] = useState(existingReport?.originalWording || "Two uterine fibroids are visualised. The largest measures 41 × 38 × 35 mm.");
  const [count, setCount] = useState("2");
  const [dimensions, setDimensions] = useState("41 × 38 × 35");
  const [confirmed, setConfirmed] = useState(false);

  function save(status: SavedReport["status"]) {
    onSave({
      id: existingReport?.id || Date.now(),
      name: sourceName || "Ultrasound report",
      date: new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date()),
      pages,
      status,
      originalWording,
    });
  }

  return (
    <div className="report-scan" role="dialog" aria-modal="true" aria-labelledby="scan-title">
      <header className="scan-header"><div><Brand /><span>Add a report</span></div><button className="icon-button" onClick={onClose} aria-label="Close report capture"><Icon name="close" /></button></header>
      <div className="scan-progress"><i className={stage === "choose" ? "active" : "done"}></i><i className={stage === "capture" ? "active" : stage === "review" ? "done" : ""}></i><i className={stage === "review" ? "active" : ""}></i></div>
      <main className="scan-main">
        {stage === "choose" && (
          <section className="scan-step">
            <p className="eyebrow">Add the report you have</p>
            <h1>How would you like to add it?</h1>
            <p>Use clear, complete pages. You’ll check every captured detail against the original before anything is saved.</p>
            <div className="source-options">
              <button onClick={() => setStage("capture")}><Icon name="health" /><div><strong>Take photos</strong><span>Capture one page at a time</span></div><Icon name="arrow" /></button>
              <label><Icon name="plus" /><div><strong>Choose photos or a PDF</strong><span>Select files already on this device</span></div><Icon name="arrow" /><input type="file" accept="image/*,.pdf,application/pdf" multiple onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) { setSourceName(files[0].name); setPages(files.length); setOriginalWording("No text is assumed from this local file in the prototype. Enter or check the original wording below."); setStage("review"); } }} /></label>
              <button onClick={() => { setSourceName("Manually entered report"); setOriginalWording(""); setStage("review"); }}><Icon name="visit" /><div><strong>Enter details manually</strong><span>Useful if the report is not available</span></div><Icon name="arrow" /></button>
            </div>
            <button className="sample-scan" onClick={() => setStage("review")}>Preview with Thandi’s sample report</button>
            <div className="scan-privacy"><Icon name="info" /><p>Your report may contain identifying information. This prototype keeps the captured state in the current browser session.</p></div>
          </section>
        )}

        {stage === "capture" && (
          <section className="scan-step capture-step">
            <p className="eyebrow">Page {pages}</p>
            <h1>Keep the whole page inside the frame</h1>
            <div className="camera-frame">
              <div className="camera-corners"></div>
              <div className="sample-page"><b>ULTRASOUND REPORT</b><i></i><i></i><i></i><span>Two uterine fibroids...</span></div>
            </div>
            <div className="capture-feedback"><Icon name="check" /><span>Page edges are visible and the text looks readable.</span></div>
            <div className="capture-actions"><button onClick={() => setPages(pages + 1)}>Add another page</button><button className="primary" onClick={() => setStage("review")}>Use {pages} page{pages === 1 ? "" : "s"}</button></div>
          </section>
        )}

        {stage === "review" && (
          <section className="scan-step review-step">
            <p className="eyebrow">Check before saving</p>
            <h1 id="scan-title">Compare what was captured with your report</h1>
            <p>You are checking the transcription—not confirming a medical interpretation.</p>
            <div className="original-wording">
              <div><span>Original report wording</span><small>Source page 1</small></div>
              <textarea value={originalWording} onChange={(e) => setOriginalWording(e.target.value)} placeholder="Enter the wording exactly as it appears" />
            </div>
            <div className="captured-fields">
              <label><span>Number of fibroids</span><input value={count} onChange={(e) => setCount(e.target.value)} /><small>Needs checking</small></label>
              <label><span>Largest recorded dimensions</span><div><input value={dimensions} onChange={(e) => setDimensions(e.target.value)} /><b>mm</b></div><small>Unit preserved from report</small></label>
              {["Location", "FIGO type", "Cavity involvement"].map((field) => <label className="missing-field" key={field}><span>{field}</span><strong>Not recorded in this report</strong><small>No value inferred</small></label>)}
            </div>
            <label className="confirm-check"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /><span>I compared these fields with the report and corrected any transcription errors.</span></label>
            <div className="review-actions"><button onClick={() => save("Needs checking")}>Save and finish later</button><button className="primary" disabled={!confirmed} onClick={() => save("Checked")}>Save checked details</button></div>
          </section>
        )}
      </main>
    </div>
  );
}

function ReportReview({ profile, onClose, onSave }: { profile: Profile; onClose: () => void; onSave: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="report-review-title">
      <button className="backdrop" onClick={onClose} aria-label="Close report review"></button>
      <div className="sheet report-review-sheet">
        <button className="icon-button sheet-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <p className="eyebrow">Before these details are saved</p>
        <h2 id="report-review-title">Check what was captured</h2>
        <p>Compare these fields with the original report. Sanelle has not inferred missing details or changed the measurement unit.</p>
        <div className="extraction-review">
          <div><span>Number of fibroids</span><strong>{profile.fibroidCount || "Not recorded"}</strong></div>
          <div><span>Largest recorded size</span><strong>{profile.largestSize ? `${profile.largestSize} cm` : "Not recorded"}</strong></div>
          <div><span>Location</span><strong>Not recorded</strong></div>
          <div><span>FIGO type</span><strong>Not recorded</strong></div>
          <div><span>Cavity involvement</span><strong>Not recorded</strong></div>
        </div>
        <label className="confirm-check"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} /><span>I checked these details against the report I have.</span></label>
        <button className="primary wide" disabled={!confirmed} onClick={onSave}>Save checked details</button>
        <button className="dismiss-action" onClick={onClose}>Go back without saving</button>
      </div>
    </div>
  );
}

function DesignComparison({ onExit }: { onExit: () => void }) {
  const [preferred, setPreferred] = useState<"current" | "off-white" | null>(null);
  return (
    <div className="comparison-shell">
      <header className="comparison-header">
        <div><Brand /><span>Design comparison</span></div>
        <button onClick={onExit}>Return to Sanelle</button>
      </header>
      <main className="comparison-main">
        <div className="comparison-intro">
          <p className="eyebrow">Same product, two surface directions</p>
          <h1>Warmer cream or quieter off-white?</h1>
          <p>Both preserve Sanelle’s berry, blush, apricot, Fredoka headings, navigation, and core interactions. Direction B adds a little more photography and image-like information without turning every section into a picture.</p>
          <span className="swipe-note">Swipe horizontally to compare A and B</span>
        </div>
        <div className="comparison-grid">
          <section className={`design-option option-current ${preferred === "current" ? "preferred" : ""}`}>
            <div className="option-label"><div><span>Direction A</span><strong>Current warm cream</strong></div><button onClick={() => setPreferred("current")}>{preferred === "current" ? "Selected" : "Prefer this"}</button></div>
            <div className="mini-app cream-preview">
              <div className="mini-nav"><Brand /><span>T</span></div>
              <div className="mini-copy"><p>Good morning, Thandi</p><h2>One helpful next step is enough.</h2></div>
              <div className="mini-diagnosis"><div><small>Your recorded diagnosis</small><strong>2 fibroids · largest 4.1 cm</strong><span>3 details are not recorded yet</span></div><Icon name="arrow" /></div>
              <div className="mini-image"><img src={mealImage} alt="A colourful grain and roasted vegetable bowl" /><span>Cook once, feel sorted</span></div>
              <div className="mini-checkin"><small>Symptoms & daily life</small><h3>Record what changed today</h3><p>Save symptoms alongside what they changed in your day.</p><button>Start a check-in</button></div>
            </div>
            <ul className="option-notes"><li>Soft and emotionally warm</li><li>Food remains the main visual anchor</li><li>More cream across large surfaces</li></ul>
          </section>

          <section className={`design-option option-white ${preferred === "off-white" ? "preferred" : ""}`}>
            <div className="option-label"><div><span>Direction B</span><strong>Editorial off-white</strong></div><button onClick={() => setPreferred("off-white")}>{preferred === "off-white" ? "Selected" : "Prefer this"}</button></div>
            <div className="mini-app white-preview">
              <div className="mini-nav"><Brand /><span>T</span></div>
              <div className="editorial-hero">
                <div><small>Thursday, 12 October</small><h2>Good morning,<br />Thandi.</h2><p>Your report, meals and questions—together when you need them.</p></div>
                <img src={cookingImage} alt="A woman chopping vegetables in her home kitchen" />
              </div>
              <div className="visual-report">
                <div><small>From your saved report</small><strong>2 fibroids</strong><span>Largest recorded size</span></div>
                <div className="size-visual" aria-label="Largest recorded size is 4.1 centimetres"><i></i><b>4.1<small> cm</small></b></div>
                <button>Review what’s missing <Icon name="arrow" size={15} /></button>
              </div>
              <div className="editorial-split">
                <article><img src={notesImage} alt="A notebook and pen for appointment questions" /><div><small>Next appointment</small><strong>2 questions saved</strong></div></article>
                <article className="coverage-visual"><small>Check-in coverage</small><strong>12 <span>of 30 days</span></strong><div><i></i></div><p>18 days remain unknown</p></article>
              </div>
              <div className="ingredient-strip"><img src={groceriesImage} alt="Fresh vegetables arranged on a kitchen table" /><div><small>Meal planning</small><strong>Use what you already have</strong><p>3 ingredients on your list</p></div></div>
            </div>
            <ul className="option-notes"><li>White and warm off-white surfaces</li><li>Photography marks food, preparation, and appointment moments</li><li>Report and symptom data become image-like visual summaries</li></ul>
          </section>
        </div>
        <div className="comparison-decision">
          <strong>{preferred ? `You selected Direction ${preferred === "current" ? "A — Current warm cream" : "B — Editorial off-white"}.` : "Choose a direction to compare the decision clearly."}</strong>
          <p>No product screens have been replaced. This is a separate concept view only.</p>
        </div>
        <p className="comparison-credits">Photography via Unsplash: Ella Olsson, Douglas Fehr, Justin Morgan and Ahmet Koç.</p>
      </main>
    </div>
  );
}

function EvidenceCatalog({ entries, onExit }: { entries: EvidenceEntry[]; onExit: () => void }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All topics");
  const [status, setStatus] = useState("All statuses");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = entries.find((entry) => entry.id === selectedId);
  const topics = ["All topics", ...Array.from(new Set(entries.map((entry) => entry.topic)))];
  const statuses = ["All statuses", "Draft", "In review", "Published", "Withdrawn"];
  const filtered = entries.filter((entry) =>
    (topic === "All topics" || entry.topic === topic) &&
    (status === "All statuses" || entry.status === status) &&
    `${entry.title} ${entry.id} ${entry.explanation}`.toLowerCase().includes(query.toLowerCase()),
  );

  if (selected) {
    return (
      <div className="catalog-shell">
        <header className="catalog-header"><div><span>Internal workspace</span><strong>Sanelle evidence catalog</strong></div><button onClick={onExit}>Return to patient app</button></header>
        <main className="catalog-main">
          <button className="catalog-back" onClick={() => setSelectedId(null)}>← All evidence entries</button>
          <div className="catalog-detail-head">
            <div><div className="catalog-meta"><span>{selected.id}</span><span className={`catalog-status ${selected.status.toLowerCase().replace(" ", "-")}`}>{selected.status}</span></div><h1>{selected.title}</h1><p>{selected.explanation}</p></div>
          </div>
          {selected.status !== "Published" && <div className="internal-warning"><Icon name="info" /><p><strong>Not available in the patient experience.</strong> {selected.status === "Withdrawn" ? "This entry remains here for audit history only." : "It must complete review before its explanation can be published."}</p></div>}
          <div className="catalog-detail-grid">
            <section>
              <h2>Evidence appraisal</h2>
              <dl className="catalog-fields">
                <div><dt>Relevant study population</dt><dd>{selected.population}</dd></div>
                <div><dt>Specific outcome addressed</dt><dd>{selected.outcome}</dd></div>
                <div><dt>Findings</dt><dd>{selected.findings}</dd></div>
                <div><dt>Limitations and uncertainty</dt><dd>{selected.limitations}</dd></div>
              </dl>
              <h2>Linked sources</h2>
              <ul className="citation-list">{selected.citations.map((citation) => <li key={citation}><span>Source</span>{citation}<small>Illustrative citation metadata</small></li>)}</ul>
            </section>
            <aside>
              <section className="catalog-side-section"><h3>Review record</h3><dl><div><dt>Reviewer</dt><dd>{selected.reviewer}</dd></div><div><dt>Review date</dt><dd>{selected.reviewDate}</dd></div><div><dt>Content version</dt><dd>{selected.version}</dd></div><div><dt>Research cutoff</dt><dd>{selected.cutoff}</dd></div></dl></section>
              <section className="catalog-side-section impact-listing"><h3>Used by</h3><p>An update would affect:</p>{selected.usedBy.map((feature) => <span key={feature}>{feature}</span>)}</section>
              <section className="catalog-side-section"><h3>Review history</h3><ol>{selected.history.map((item) => <li key={item}>{item}</li>)}</ol></section>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="catalog-shell">
      <header className="catalog-header"><div><span>Internal workspace</span><strong>Sanelle evidence catalog</strong></div><button onClick={onExit}>Return to patient app</button></header>
      <main className="catalog-main">
        <div className="catalog-title"><div><p className="eyebrow">Medical explanation governance</p><h1>Evidence entries</h1><p>Maintain the reviewed explanations used across Sanelle. This is a published-research workspace, not user data or an exhaustive clinical review.</p></div><button className="catalog-new" onClick={() => setSelectedId("BIO-003")}>Open draft example <Icon name="arrow" /></button></div>
        <section className="library-scope">
          <div className="library-scope-copy">
            <p className="eyebrow">Research library snapshot · 6 October 2026</p>
            <h2>Substantial reading, with the gaps kept visible</h2>
            <p>The source library tracks publications, reading depth, claim mappings, and unresolved verification work. Counts are publications—not independent studies—and the wider review remains in progress.</p>
          </div>
          <div className="scope-visual" aria-label="Research library coverage summary">
            <div><span style={{ width: "81%" }}></span><b>63</b><p>full main-text result or review readings</p></div>
            <div><span style={{ width: "72%" }}></span><b>56</b><p>original full-text inclusions</p></div>
            <div><span style={{ width: "56%" }}></span><b>44</b><p>claim-to-evidence rows across 14 topics</p></div>
            <div className="scope-total"><strong>78</strong><p>publications in the reading ledger, with mixed reading depths</p></div>
          </div>
          <div className="scope-cautions">
            <span><b>12</b> selected originals remain incomplete</span>
            <span><b>14</b> report groups carry metadata warnings</span>
            <span><b>1</b> analyst; no independent adjudication claimed</span>
          </div>
        </section>
        <p className="prototype-entry-note"><Icon name="info" size={17} /> The entries below are illustrative product records showing how the wider library could be governed. They are not the full 44-claim map.</p>
        <div className="catalog-summary"><div><strong>{entries.length}</strong><span>Total entries</span></div><div><strong>{entries.filter((entry) => entry.status === "Published").length}</strong><span>Published</span></div><div><strong>{entries.filter((entry) => entry.status === "In review").length}</strong><span>In review</span></div><div><strong>{entries.filter((entry) => entry.status === "Withdrawn").length}</strong><span>Withdrawn</span></div></div>
        <div className="catalog-tools">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, ID, or explanation" aria-label="Search evidence entries" />
          <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Filter by topic">{topics.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">{statuses.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div className="catalog-table">
          <div className="catalog-row catalog-columns"><span>Entry</span><span>Topic</span><span>Status</span><span>Version</span><span>Used by</span></div>
          {filtered.map((entry) => (
            <button className="catalog-row" key={entry.id} onClick={() => setSelectedId(entry.id)}>
              <span><b>{entry.title}</b><small>{entry.id}</small></span><span>{entry.topic}</span><span><i className={`catalog-status ${entry.status.toLowerCase().replace(" ", "-")}`}>{entry.status}</i></span><span>{entry.version}</span><span>{entry.usedBy.length} feature{entry.usedBy.length === 1 ? "" : "s"} <Icon name="arrow" size={16} /></span>
            </button>
          ))}
          {filtered.length === 0 && <div className="catalog-empty"><strong>No entries match these filters.</strong><p>Clear a filter or try a different search term.</p></div>}
        </div>
      </main>
    </div>
  );
}

function SymptomSheet({
  symptoms, setSymptoms, impact, setImpact, bleeding, setBleeding, onClose, onSave,
}: {
  symptoms: string[];
  setSymptoms: (items: string[]) => void;
  impact: string;
  setImpact: (value: string) => void;
  bleeding: string;
  setBleeding: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const choices = ["Bleeding", "Pelvic pressure", "Pain", "Low energy"];
  const bleedingLevels = ["None", "Light", "Moderate", "Heavy", "Very heavy"];
  const impacts = ["No change", "Slowed me down", "Changed my plans", "Couldn’t do usual activities"];
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="log-title">
      <button className="backdrop" onClick={onClose} aria-label="Close symptom log"></button>
      <div className="sheet">
        <div className="sheet-handle"></div>
        <button className="icon-button sheet-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <p className="eyebrow">A quick check-in</p>
        <h2 id="log-title">What showed up today?</h2>
        <p>Select anything you noticed. This isn’t a test and you can leave things blank.</p>
        <div className="choice-grid">
          {choices.map((choice) => (
            <button
              key={choice}
              className={symptoms.includes(choice) ? "selected" : ""}
              onClick={() => setSymptoms(symptoms.includes(choice) ? symptoms.filter((s) => s !== choice) : [...symptoms, choice])}
            >
              {symptoms.includes(choice) && <Icon name="check" size={17} />}{choice}
            </button>
          ))}
        </div>
        {symptoms.includes("Bleeding") && (
          <>
            <label className="field-label">How would you describe the bleeding?</label>
            <div className="bleeding-scale">
              {bleedingLevels.map((level) => <button key={level} className={bleeding === level ? "selected" : ""} onClick={() => setBleeding(level)}><i></i><span>{level}</span></button>)}
            </div>
            <p className="scale-note">These are your own categories. Sanelle does not convert them into millilitres or a diagnosis.</p>
          </>
        )}
        <label className="field-label">How did it affect your day?</label>
        <div className="impact-list">
          {impacts.map((item) => <button key={item} className={impact === item ? "selected" : ""} onClick={() => setImpact(item)}><i></i>{item}</button>)}
        </div>
        <button className="primary wide" onClick={onSave}>Save today’s check-in</button>
      </div>
    </div>
  );
}

function ResearchLibrary({
  papers,
  setPapers,
  onClose,
}: {
  papers: { name: string; size: number }[];
  setPapers: (papers: { name: string; size: number }[]) => void;
  onClose: () => void;
}) {
  const [topic, setTopic] = useState("All topics");
  const topics = ["All topics", "Food & nutrition", "Symptoms", "Treatment", "Fertility", "Quality of life"];
  return (
    <div className="research-modal" role="dialog" aria-modal="true" aria-labelledby="research-title">
      <header className="research-header">
        <div>
          <p className="eyebrow light">Your source workspace</p>
          <h2 id="research-title">Fibroid research library</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close research library"><Icon name="close" /></button>
      </header>
      <div className="research-body">
        <section className="research-intro">
          <div>
            <h1>See the evidence landscape,<br />not just a headline.</h1>
            <p>Add the papers you have collected. Sanelle keeps source material, extracted findings, and practical guidance visibly separate.</p>
          </div>
          <label className="upload-button">
            <Icon name="plus" /> Add PDF papers
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files || []).map((file) => ({ name: file.name, size: file.size }));
                setPapers([...papers, ...files.filter((file) => !papers.some((paper) => paper.name === file.name))]);
                event.target.value = "";
              }}
            />
          </label>
        </section>

        <div className="research-disclaimer"><Icon name="info" /><p><strong>Uploads are not interpreted as medical fact.</strong> Each finding needs source verification and clinical review before it appears in guidance.</p></div>

        <section className="evidence-map">
          <div className="section-title"><div><p className="eyebrow">Collection overview</p><h2>Evidence map</h2></div></div>
          <div className="evidence-stats">
            <div><strong>{papers.length}</strong><span>Papers added</span></div>
            <div><strong>0</strong><span>Findings verified</span></div>
            <div><strong>{papers.length}</strong><span>Awaiting review</span></div>
          </div>
          <div className="review-bar" aria-label={`${papers.length} papers awaiting review`}>
            {papers.length > 0 ? <i style={{ width: "100%" }} /> : <span>Add papers to begin mapping the evidence</span>}
          </div>
          <div className="map-key"><span><i></i> Awaiting review</span><span><i></i> Clinically reviewed</span></div>
        </section>

        <section className="paper-collection">
          <div className="paper-toolbar">
            <div><p className="eyebrow">Source papers</p><h2>{papers.length ? `${papers.length} paper${papers.length === 1 ? "" : "s"}` : "No papers added yet"}</h2></div>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Filter papers by topic">
              {topics.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          {papers.length === 0 ? (
            <div className="research-empty">
              <div><Icon name="visit" size={28} /></div>
              <h3>Bring your research together</h3>
              <p>Add PDFs to create a source list. Paper titles and findings will remain unclassified until they are reviewed—Sanelle will not guess from a filename.</p>
            </div>
          ) : (
            <div className="paper-list">
              {papers.map((paper, index) => (
                <article className="paper-card" key={`${paper.name}-${index}`}>
                  <div className="pdf-badge">PDF</div>
                  <div className="paper-info">
                    <span className="review-status">Awaiting review</span>
                    <h3>{paper.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ")}</h3>
                    <p>{(paper.size / 1024 / 1024).toFixed(1)} MB · Topic not classified · Study type not recorded</p>
                    <div className="paper-fields">
                      <span><b>Finding</b> Not extracted</span>
                      <span><b>Limitations</b> Not reviewed</span>
                    </div>
                  </div>
                  <button className="icon-button" onClick={() => setPapers(papers.filter((_, i) => i !== index))} aria-label={`Remove ${paper.name}`}><Icon name="close" size={18} /></button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ClaimSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="claim-title">
      <button className="backdrop" onClick={onClose} aria-label="Close evidence view"></button>
      <div className="sheet claim-sheet">
        <div className="sheet-handle"></div>
        <button className="icon-button sheet-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <p className="eyebrow">Evidence, made readable</p>
        <h2 id="claim-title">Can a specific diet shrink fibroids?</h2>
        <p className="fine-print">Illustrative patient explanation from the published catalog. The catalog is not an exhaustive or clinically approved review.</p>
        <div className="evidence-answer">
          <span>Short answer</span>
          <strong>No reliably established whole-food regimen that removes fibroids was demonstrated in this bounded review.</strong>
        </div>
        <h3>What we can say</h3>
        <p>Studies about who is diagnosed with fibroids, studies measuring fibroid growth, and trials of supplements answer different questions. An association with incidence does not show that a food shrinks an existing fibroid.</p>
        <h3>Where the evidence falls short</h3>
        <p>Confounding, detection differences and how diet is measured limit observational studies. Supplement trials do not test the same exposure as ordinary meals, and the nutrition literature has not been comprehensively screened.</p>
        <details className="evidence-disclosure">
          <summary>Sources and limitations</summary>
          <p>Catalog claim C17 links this explanation to R19, R09, R10, R41, R42, R51 and the FRIEND protocol T02. These sources cover different exposures and outcomes and should not be pooled into a single “diet works” vote.</p>
          <span>This bounded conclusion is not proof that no future dietary effect exists.</span>
        </details>
        <details className="evidence-disclosure research-method">
          <summary>How Sanelle handles research</summary>
          <p>The research library contains 78 publications at mixed reading depths and 44 claim-to-evidence rows across 14 topics. It records uncertainty, disagreements, incomplete readings, and source-family overlap rather than treating every search result as evidence.</p>
          <span>Library snapshot: 6 October 2026. The wider review is still in progress and is not an exhaustive or clinically approved review.</span>
        </details>
        <h3>A practical take</h3>
        <p>Use meals for practical nourishment, preference and convenience—not as a promised fibroid treatment. Discuss supplement use or individual dietary concerns with a qualified clinician or dietitian.</p>
        <button className="primary wide" onClick={onClose}>Done reading</button>
      </div>
    </div>
  );
}
