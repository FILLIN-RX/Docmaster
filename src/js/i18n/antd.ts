import frFR from "antd/locale/fr_FR";
import enUS from "antd/locale/en_US";
import arEG from "antd/locale/ar_EG";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import "dayjs/locale/en";
import "dayjs/locale/ar";

export const ANTD_LOCALES: Record<string, any> = {
  fr: frFR,
  en: enUS,
  ar: arEG,
};

export const getAntdLocale = (lang: string) => ANTD_LOCALES[lang] || frFR;

export const applyDayjsLocale = (lang: string) => {
  const locale = lang === "fr" ? "fr" : lang === "ar" ? "ar" : "en";
  dayjs.locale(locale);
};

export const isRtl = (lang: string) => lang === "ar";
