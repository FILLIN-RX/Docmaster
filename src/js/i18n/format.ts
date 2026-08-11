const INTL_LOCALES: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar",
};

export const intlLocale = (lang: string) => INTL_LOCALES[lang] || "fr-FR";

export const fmtDate = (lang: string, v?: string | null) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(intlLocale(lang), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return v;
  }
};

export const fmtDateTime = (lang: string, v?: string | null) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(intlLocale(lang), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return v;
  }
};

export const fmtTime = (lang: string, v?: string | null) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleTimeString(intlLocale(lang), {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return v;
  }
};

export const fmtLongDate = (lang: string, v?: string | null) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString(intlLocale(lang), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return v;
  }
};

export const fmtNumber = (lang: string, v?: number | string | null) => {
  if (v === null || v === undefined || v === "") return "—";
  try {
    return Number(v).toLocaleString(intlLocale(lang));
  } catch {
    return String(v);
  }
};

export const fmtMoney = (lang: string, v?: number | string | null, currency = "FCFA") => {
  return `${fmtNumber(lang, v)} ${currency}`;
};
