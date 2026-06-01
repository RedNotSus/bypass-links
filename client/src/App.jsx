import {
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Clipboard,
  ExternalLink,
  HeartPulse,
  Link as LinkIcon,
  LogOut,
  Menu,
  Moon,
  Sparkles,
  Sun,
  UserRound,
  X,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { bypassLink, getCurrentUser, logout } from "./api.js";

const supportedSites = [
  "Linkvertise",
  "bstlar.com",
  "Cutty",
  "shrinkme.click",
  "Lootlinks",
  "AdFoc.us",
  "Boost.ink",
  "BoostFusedGT",
  "leasurepartment.xyz",
  "LetsBoost",
  "mboost.me",
  "Rekonise",
  "shorte.st",
  "Sub2Unlock.com",
  "Sub2Unlock.net",
  "v.gd",
  "dragonslayer",
  "egirls.wtf",
  "tinyurl.com",
  "bit.ly",
  "is.gd",
  "rebrand.ly",
  "empebau.eu",
  "socialwolvez.com",
  "sub1s.com",
  "tinylink.onl",
  "google-url",
  "Justpaste.it Redirect",
  "SubFinal",
  "Location Redirect",
  "Ad-Maven",
  "BaseResolver",
  "ParamsResolver"
];

const faqItems = [
  {
    question: "What Ad-Link sites are supported ?",
    answer: [
      "We support many different Sites",
      "Including, linkvertise",
      "... but also many others, like: Ad-Maven, adf.ly, AdFoc.us, AdShrink.it, boost.ink, BoostFusedGT, leasurepartment.xyz, LetsBoost MediaBooster, Rekonise, shorte.st/sh.st, Social Unlocks, Sub2Get, Sub2Unlock.com, Sub2Unlock.net and many more. Every ad-link site under the sun is probably supported and can be bypassed."
    ]
  },
  {
    question: "Are bypasses restricted ?",
    answer: [
      "No they are not!",
      "We do not restrict any bypasses. You can bypass as many links as you want without any restrictions."
    ]
  },
  {
    question: "How does it work ?",
    answer: [
      "Bypass linkvertise in just a few clicks. Insert your link and enjoy the result. No endless and annoying steps to get to your destination."
    ]
  },
  {
    question: "Do we support Pastes ?",
    answer: [
      "Yes we do. For linkvertise or other sites we will show you the paste content after the link has been bypassed."
    ]
  },
  {
    question: "What if I get an error ?",
    answer: [
      "If you get an error, try again. If it persists, check if the entered link is correct and supported."
    ]
  },
  {
    question: "Do we show ads ?",
    answer: [
      "We keep the clone free of third-party ad scripts. The original site shows ads to help with server costs."
    ]
  },
  {
    question: "How can I help ?",
    answer: [
      "Share the site with friends, keep useful links handy, and sign in with Hack Club to use the bypasser."
    ]
  }
];

const navItems = [
  ["Join Discord", "8471 /103000 online", "discord"],
  ["Donate", "Crypto donations", "donate"],
  ["Get UserScript", "Bypass Linkvertise Faster", "script"],
  ["Fill out Survey", "Help us to improve our service", "survey"],
  ["Review us on Trustpilot", "Write us a review on Trustpilot", "review"],
  ["Supported Bypasses", "Find out which sites are supported!", "supported"],
  ["About Us", "who owns this!?", "about"],
  ["Privacy Policy", "", "privacy"],
  ["Terms of Service", "", "terms"]
];

function signIn() {
  window.location.href = "/auth/hackclub";
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [autoRedirect, setAutoRedirect] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [acceptedCookies, setAcceptedCookies] = useState(() => localStorage.getItem("cookie-consent") === "yes");

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
        }
      })
      .finally(() => {
        if (active) {
          setAuthLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const displayName = useMemo(() => user?.name || user?.email || "Hack Club user", [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) {
      signIn();
      return;
    }

    setStatus({ type: "loading", message: "Bypassing link..." });

    try {
      const result = await bypassLink({ url, autoRedirect });
      setStatus({ type: "success", message: result });
      if (autoRedirect && /^https?:\/\//i.test(result)) {
        window.location.assign(result);
      }
    } catch (error) {
      const code = error.response?.data?.error;
      setStatus({
        type: "error",
        message: code === "invalid_url" ? "Enter a valid http or https link." : "That link could not be bypassed."
      });
    }
  }

  async function handleClipboard() {
    if (!navigator.clipboard?.readText) {
      setStatus({ type: "error", message: "Clipboard access is not available in this browser." });
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
    } catch {
      setStatus({ type: "error", message: "Clipboard permission was denied." });
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setStatus({ type: "idle", message: "" });
  }

  function acceptCookies() {
    localStorage.setItem("cookie-consent", "yes");
    setAcceptedCookies(true);
  }

  return (
    <div className="app-shell">
      <Header
        authLoading={authLoading}
        displayName={displayName}
        menuOpen={menuOpen}
        onLogout={handleLogout}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        user={user}
      />
      <SideNav open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="page-main">
        <section className="hero-section">
          <div className="hero-glow" />
          <h1>
            Bypass <span>Linkvertise</span>
          </h1>
          <form className="bypass-form" onSubmit={handleSubmit}>
            <input
              aria-label="Link to bypass"
              onChange={(event) => setUrl(event.target.value)}
              placeholder="enter a link to get started"
              type="url"
              value={url}
            />
            <button className="primary-action" disabled={status.type === "loading"} type="submit">
              {user ? "Bypass Link !" : "Sign in with Hack Club"}
            </button>
          </form>
          <div className="hero-controls">
            <button className="text-action" onClick={handleClipboard} type="button">
              <Clipboard size={16} />
              From Clipboard
            </button>
            <label className="toggle-row">
              <input
                checked={autoRedirect}
                onChange={(event) => setAutoRedirect(event.target.checked)}
                type="checkbox"
              />
              <span className="toggle-track" />
              Auto-Redirect
            </label>
          </div>
          <button
            className="example-card"
            onClick={() => setUrl("https://linkvertise.com/48193/example")}
            type="button"
          >
            <Sparkles size={16} />
            <span>
              <strong>Try an example link!</strong>
              <small>We can bypass links most other bypasses can't.</small>
              <small>Try the Example!</small>
            </span>
          </button>
          {status.message ? <Result status={status} /> : null}
        </section>

        <section className="feature-grid" id="supported">
          <SupportedCard />
          <InfoCard
            icon={<HeartPulse size={42} />}
            title="Instant Response"
            text="bypass.city is a fast and responsive service that will get you the link you need in no time! The bypass is instant and the link is ready to be used."
          />
          <InfoCard
            icon={<BadgeCheck size={42} />}
            title="Quick and Easy"
            text="bypass.city is a simple and easy to use service that will bypass supported link shorteners in no time!"
          />
        </section>

        <Faq />
      </main>

      {!acceptedCookies ? <CookieNotice onAccept={acceptCookies} /> : null}
    </div>
  );
}

function Header({ authLoading, displayName, menuOpen, onLogout, onMenuToggle, user }) {
  return (
    <header className="top-header">
      <a className="brand" href="/" aria-label="bypass.city home">
        <img className="brand-logo" src="/images/logo-long.svg" alt="bypass.city" />
      </a>
      <div className="header-actions">
        {user ? (
          <div className="user-chip" title={displayName}>
            <UserRound size={15} />
            <span>{displayName}</span>
            <button aria-label="Log out" onClick={onLogout} type="button">
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button className="signin-icon" disabled={authLoading} onClick={signIn} title="Sign in with Hack Club" type="button">
            <UserRound size={18} />
          </button>
        )}
        <button className="green-icon" title="Ads Enabled" type="button">
          <span>AD</span>
        </button>
        <button className="yellow-icon" title="Theme" type="button">
          <Sun size={17} />
        </button>
        <a className="discord-icon" href="https://discord.gg" aria-label="Join Discord">
          <Zap size={16} />
        </a>
        <button className="menu-button" onClick={onMenuToggle} aria-label="Open navigation" type="button">
          {menuOpen ? <X size={31} /> : <Menu size={31} />}
        </button>
      </div>
    </header>
  );
}

function SideNav({ open, onClose }) {
  return (
    <>
      <div className={open ? "nav-scrim open" : "nav-scrim"} onClick={onClose} />
      <aside className={open ? "side-nav open" : "side-nav"} aria-hidden={!open}>
        {navItems.map(([label, description, kind]) => (
          <a className={`nav-card ${kind}`} href={`#${kind}`} key={label} onClick={onClose}>
            <Moon size={17} />
            <span>
              <strong>{label}</strong>
              {description ? <small>{description}</small> : null}
            </span>
          </a>
        ))}
      </aside>
    </>
  );
}

function Result({ status }) {
  return (
    <div className={`result-card ${status.type}`}>
      <strong>{status.type === "success" ? "Result" : status.type === "error" ? "Error" : "Working"}</strong>
      {status.type === "success" && /^https?:\/\//i.test(status.message) ? (
        <a href={status.message}>{status.message}</a>
      ) : (
        <span>{status.message}</span>
      )}
    </div>
  );
}

function SupportedCard() {
  return (
    <article className="feature-card supported-card">
      <div className="card-heading">
        <LinkIcon size={42} />
        <a href="#supported">
          Supported Websites
          <ExternalLink size={14} />
        </a>
      </div>
      <div className="blue-rule" />
      <ul>
        {supportedSites.map((site) => (
          <li key={site}>
            <BadgeCheck size={20} />
            <span>{site}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <article className="feature-card info-card">
      <div className="info-icon">{icon}</div>
      <h2>{title}</h2>
      <div className="blue-rule" />
      <p>{text}</p>
    </article>
  );
}

function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq-section">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqItems.map((item, index) => (
          <div className="faq-item" key={item.question}>
            <button onClick={() => setOpenIndex(openIndex === index ? -1 : index)} type="button">
              <span>{item.question}</span>
              {openIndex === index ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {openIndex === index ? (
              <div className="faq-answer">
                {item.answer.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function CookieNotice({ onAccept }) {
  return (
    <aside className="cookie-notice">
      <p>
        By using this website you agree to the use of 3rd-party cookies and our <a href="#terms">Terms of Service</a>.
        Find out more at our <a href="#privacy">Privacy Policy</a>.
      </p>
      <button onClick={onAccept} type="button">Okay</button>
    </aside>
  );
}
