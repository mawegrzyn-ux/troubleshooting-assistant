import { useState } from "react";
import { useTranslation } from "./TranslationContext.jsx";
import "./LanguageSelector.css";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "it", label: "Italian" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "fr-BE", label: "Belgian" },
  { code: "nl", label: "Dutch" },
  { code: "de", label: "German" },
  { code: "da", label: "Danish" },
  { code: "sr", label: "Serbian" },
];

const FLAGS = {
  en: "🇺🇸",
  it: "🇮🇹",
  es: "🇪🇸",
  fr: "🇫🇷",
  "fr-BE": "🇧🇪",
  nl: "🇳🇱",
  de: "🇩🇪",
  da: "🇩🇰",
  sr: "🇷🇸",
};

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const currentFlag = FLAGS[language] || "🏳️";

  return (
    <div className="language-selector">
      <button className="burger" onClick={() => setOpen(true)} aria-label="select language">
        <span className="flag">{currentFlag}</span>
        ☰
      </button>
      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setOpen(false)}>
              ×
            </button>
            <ul>
              {LANGUAGES.map((lang) => (
                <li key={lang.code}>
                  <button
                    onClick={() => {
                      setLanguage(lang.code);
                      setOpen(false);
                    }}
                  >
                    {lang.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
