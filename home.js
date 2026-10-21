"use strict";

const originalText = new Map(
  Array.from(document.querySelectorAll("[data-i18n]"), (element) => [element, element.textContent])
);
const languageToggle = document.querySelector("#language-toggle");

languageToggle.addEventListener("click", () => {
  applyHomeLanguage(document.documentElement.lang === "id" ? "en" : "id");
});

function applyHomeLanguage(language) {
  document.documentElement.lang = language;
  const translations = language === "en"
    ? window.LokaTranslations.english
    : window.LokaTranslations.indonesian;

  for (const [element, original] of originalText) {
    element.textContent = translations[element.dataset.i18n] ?? original;
  }

  languageToggle.textContent = language === "en" ? "ID" : "EN";
  languageToggle.setAttribute(
    "aria-label",
    language === "en" ? "Switch to Indonesian" : "Switch to English"
  );
  document.querySelector(".top-links").setAttribute(
    "aria-label",
    language === "en" ? "Site navigation" : "Navigasi situs"
  );
  document.querySelector(".hero-stickers").setAttribute(
    "aria-label",
    language === "en" ? "Highlights" : "Keunggulan"
  );
}

applyHomeLanguage("en");
