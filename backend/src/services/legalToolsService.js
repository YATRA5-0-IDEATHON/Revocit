const adbs = require("ad-bs-converter");

function formatDocument(text) {
  const cleaned = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    originalLength: text.length,
    formattedLength: cleaned.length,
    formattedText: cleaned
  };
}

function convertDate(mode, value) {
  const normalized = String(value || "").replace(/-/g, "/");
  if (mode === "ad-to-bs") {
    const converted = adbs.ad2bs(normalized);
    return {
      mode,
      input: value,
      result: `${converted.ne.year}-${converted.ne.month}-${converted.ne.day}`
    };
  }

  const converted = adbs.bs2ad(normalized);
  return {
    mode,
    input: value,
    result: `${converted.year}-${converted.month}-${converted.day}`
  };
}

function buildCaseDraft({ claimant, respondent, summary, lang = "en" }) {
  if (lang === "ne") {
    return {
      title: `${respondent} विरुद्ध मुद्दा मस्यौदा`,
      sections: [
        { heading: "पक्षकार", body: `${claimant} विरुद्ध ${respondent}` },
        { heading: "घटनाको सार", body: summary },
        { heading: "प्रमाण सूची", body: "साक्षी, समयरेखा, सन्देश/कागजात, फोटो/रिकर्ड।" },
        { heading: "माग दाबी", body: "कानुनी कारबाही, संरक्षण आदेश तथा आवश्यक राहतको माग।" }
      ]
    };
  }

  return {
    title: `Case Draft: ${claimant} vs ${respondent}`,
    sections: [
      { heading: "Parties", body: `${claimant} vs ${respondent}` },
      { heading: "Incident Summary", body: summary },
      { heading: "Evidence Checklist", body: "Witnesses, timeline, records, messages, photos, and authority references." },
      { heading: "Relief Sought", body: "Investigation, legal action, protective measures, and applicable remedies." }
    ]
  };
}

module.exports = {
  formatDocument,
  convertDate,
  buildCaseDraft
};