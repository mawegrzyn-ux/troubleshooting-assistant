import { createContext, useContext, useRef, useState } from "react";

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const cacheRef = useRef({});

  const translate = async (text, target = language) => {
    if (!text) return "";
    if (target === "en") return text;
    const key = `${target}|${text}`;
    if (cacheRef.current[key]) return cacheRef.current[key];
    try {
      const res = await fetch(`/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: target }),
      });
      if (!res.ok) {
        throw new Error(`Translation request failed: ${res.status}`);
      }
      const data = await res.json();
      if (!data?.text) {
        throw new Error("Invalid translation response");
      }
      cacheRef.current[key] = data.text;
      return data.text;
    } catch (err) {
      console.error("Translation failed:", err);
      if (typeof window !== "undefined" && window.alert) {
        window.alert("Translation failed");
      }
      return text;
    }
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </TranslationContext.Provider>
  );
}

  // eslint-disable-next-line react-refresh/only-export-components
  export const useTranslation = () => useContext(TranslationContext);
