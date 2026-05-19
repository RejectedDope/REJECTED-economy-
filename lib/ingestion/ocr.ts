// OCR extraction for listing screenshots.
// Browser-only — Tesseract.js runs client-side via WebAssembly.
// No external APIs. No server calls.

import type { ExtractedListingFields } from "./screenshot-parser";

// ─── Price extraction ─────────────────────────────────────────────────────────

function extractPrice(text: string): string | undefined {
  // Match $XX, $XX.XX, $X,XXX patterns
  const match = text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
  if (match) return match[1].replace(/,/g, "");
  // Match bare number followed by currency keywords
  const bare = text.match(/(?:price|listing|buy)[\s:]+\$?([\d,]+(?:\.\d{1,2})?)/i);
  if (bare) return bare[1].replace(/,/g, "");
  return undefined;
}

// ─── Platform detection ────────────────────────────────────────────────────────

const PLATFORM_KEYWORDS: Array<[RegExp, string]> = [
  [/ebay/i, "eBay"],
  [/poshmark/i, "Poshmark"],
  [/mercari/i, "Mercari"],
  [/depop/i, "Depop"],
  [/facebook\s+marketplace|fb\s+marketplace|fbmp/i, "Facebook Marketplace"],
  [/stockx/i, "StockX"],
  [/goat/i, "GOAT"],
  [/whatnot/i, "Whatnot"],
  [/grailed/i, "Grailed"],
];

function detectPlatform(text: string): string | undefined {
  for (const [pattern, name] of PLATFORM_KEYWORDS) {
    if (pattern.test(text)) return name;
  }
  return undefined;
}

// ─── Days listed extraction ────────────────────────────────────────────────────

function extractDaysListed(text: string): string | undefined {
  // "Listed X days ago" / "X days" / "Xd"
  const patterns = [
    /(\d+)\s+days?\s+ago/i,
    /listed\s+(\d+)\s+days?/i,
    /age[:\s]+(\d+)/i,
    /(\d+)d\s+ago/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1];
  }
  return undefined;
}

// ─── Engagement metrics extraction ────────────────────────────────────────────

function extractMetric(text: string, keywords: string[]): string | undefined {
  for (const kw of keywords) {
    const pat = new RegExp(`(\\d+)\\s*${kw}|${kw}\\s*[:\\s]\\s*(\\d+)`, "i");
    const m = text.match(pat);
    if (m) return m[1] ?? m[2];
  }
  return undefined;
}

// ─── Title extraction ──────────────────────────────────────────────────────────
// Heuristic: longest line that isn't a URL or pure number, in the upper 40% of text.

function extractTitle(lines: string[]): string | undefined {
  const candidates = lines
    .map((l) => l.trim())
    .filter((l) =>
      l.length > 15 &&
      l.length < 120 &&
      !/^[\d$,.\s]+$/.test(l) &&
      !l.startsWith("http") &&
      !/^\d+$/.test(l)
    );

  if (candidates.length === 0) return undefined;
  // Prefer lines in the first half (title is usually near top)
  return candidates[0];
}

// ─── Confidence scoring ────────────────────────────────────────────────────────

function scoreConfidence(fields: Omit<ExtractedListingFields, "confidence" | "extractionMethod">): ExtractedListingFields["confidence"] {
  const filled = [fields.title, fields.price, fields.platform].filter(Boolean).length;
  if (filled === 3) return "high";
  if (filled >= 2) return "medium";
  if (filled >= 1) return "low";
  return "none";
}

// ─── Main OCR extraction ───────────────────────────────────────────────────────

export async function extractFromScreenshot(
  imageFile: File
): Promise<ExtractedListingFields> {
  try {
    // Dynamic import — Tesseract.js is large, only load when needed
    const Tesseract = await import("tesseract.js");

    const result = await Tesseract.recognize(imageFile, "eng", {
      // Minimal logging — suppress worker chatter
      logger: () => {},
    });

    const rawText = result.data.text;
    const lines = rawText.split("\n").filter((l) => l.trim().length > 0);

    const fields = {
      title: extractTitle(lines),
      price: extractPrice(rawText),
      platform: detectPlatform(rawText),
      days_listed: extractDaysListed(rawText),
      views: extractMetric(rawText, ["views", "page views"]),
      watchers: extractMetric(rawText, ["watchers", "watching"]),
    };

    return {
      ...fields,
      confidence: scoreConfidence(fields),
      extractionMethod: "ocr",
    };
  } catch {
    return {
      confidence: "none",
      extractionMethod: "none",
    };
  }
}
