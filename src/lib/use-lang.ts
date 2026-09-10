"use client";

import { useEffect, useState } from "react";
import { MESSAGES, readLang, t, type Lang, type MsgKey } from "@/lib/i18n";

export function useLang() {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("plenty_lang="))?.split("=")[1];
    setLang(readLang(cookie || localStorage.getItem("plenty_lang")));
    const onChange = () => {
      const c = document.cookie.split("; ").find((x) => x.startsWith("plenty_lang="))?.split("=")[1];
      setLang(readLang(c || localStorage.getItem("plenty_lang")));
    };
    window.addEventListener("plenty-lang", onChange);
    return () => window.removeEventListener("plenty-lang", onChange);
  }, []);
  return { lang, t: (key: MsgKey) => t(lang, key), messages: MESSAGES[lang] };
}
