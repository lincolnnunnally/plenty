"use client";

import { useEffect, useState } from "react";
import { readLang, type Lang } from "@/lib/i18n";

export function LangToggle() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("plenty_lang="))?.split("=")[1];
    setLang(readLang(cookie || localStorage.getItem("plenty_lang")));
  }, []);

  function choose(next: Lang) {
    setLang(next);
    localStorage.setItem("plenty_lang", next);
    document.cookie = `plenty_lang=${next};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = next;
    window.dispatchEvent(new Event("plenty-lang"));
  }

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button type="button" className={lang === "en" ? "chip active" : "chip"} onClick={() => choose("en")}>
        EN
      </button>
      <button type="button" className={lang === "es" ? "chip active" : "chip"} onClick={() => choose("es")}>
        ES
      </button>
    </div>
  );
}
