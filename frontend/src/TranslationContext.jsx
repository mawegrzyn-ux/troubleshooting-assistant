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
    const res = await fetch(`/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang: target }),
    });
    const data = await res.json();
    cacheRef.current[key] = data.text;
    return data.text;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </TranslationContext.Provider>
  );
}

  // eslint-disable-next-line react-refresh/only-export-components
  export const useTranslation = () => useContext(TranslationContext);
