import { useState } from "react";
import { useTranslation } from "./TranslationContext.jsx";
import "./LanguageSelector.css";

const LANGUAGES = [
  { code: "it", label: "Italian" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "fr-BE", label: "Belgian" },
  { code: "nl", label: "Dutch" },
  { code: "de", label: "German" },
  { code: "da", label: "Danish" },
  { code: "sr", label: "Serbian" },
];

export default function LanguageSelector() {
  const { setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="language-selector">
      <button className="burger" onClick={() => setOpen(true)} aria-label="select language">
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
