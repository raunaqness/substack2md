import * as cheerio from "cheerio";

export interface SubstackPost {
  title: string;
  subtitle?: string;
  authorName?: string;
  publishDate?: string;
  canonicalUrl?: string;
  bodyHtml: string;
}

export function parseSubstackUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    // Must be *.substack.com/p/<slug>
    return (
      parsed.hostname.endsWith(".substack.com") &&
      /^\/p\/[^/?#]+/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

export async function fetchSubstackPost(url: string): Promise<SubstackPost> {
  const res = await fetch(url.trim(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch article (HTTP ${res.status}).`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Title
  const title =
    $("h1.post-title").first().text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled";

  // Subtitle
  const subtitle = $("h3.subtitle").first().text().trim() || undefined;

  // Author — from the byline or JSON-LD
  const authorName =
    $(".byline-names .name").first().text().trim() ||
    $('[data-testid="post-author-name"]').first().text().trim() ||
    undefined;

  // Date — from JSON-LD is most reliable
  let publishDate: string | undefined;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() ?? "");
      if (data.datePublished) {
        publishDate = data.datePublished;
        return false; // break
      }
    } catch {
      // ignore malformed JSON-LD
    }
  });

  // Canonical URL
  const canonicalUrl = $('link[rel="canonical"]').attr("href") || url;

  // Body — div.available-content holds the article prose
  const bodyEl = $("div.available-content");
  if (!bodyEl.length) {
    // Paywall or unexpected layout
    const isPaywalled = $(".paywall-title, .locked-content").length > 0;
    if (isPaywalled) {
      throw new Error(
        "This article is behind a paywall. Only free articles are supported."
      );
    }
    throw new Error(
      "Could not extract article content. The page layout may have changed."
    );
  }

  // Remove Substack UI noise from inside the content
  bodyEl.find(".subscription-widget-wrap").remove();
  bodyEl.find(".subscribe-widget").remove();
  bodyEl.find(".post-ufi").remove();
  bodyEl.find(".share-dialog").remove();
  bodyEl.find("button").remove();

  const bodyHtml = bodyEl.html() ?? "";

  return { title, subtitle, authorName, publishDate, canonicalUrl, bodyHtml };
}
