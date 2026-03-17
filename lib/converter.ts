import TurndownService from "turndown";
import type { SubstackPost } from "./substack";

function buildTurndownService(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    hr: "---",
  });

  // Remove basic tags
  td.remove(["button", "script", "style"]);

  // Remove Substack UI chrome by class — subscribe widgets, share buttons, etc.
  td.addRule("removeSubstackChrome", {
    filter: (node) => {
      const cls = (node as HTMLElement).className ?? "";
      return (
        cls.includes("subscription-widget") ||
        cls.includes("subscribe-widget") ||
        cls.includes("share-dialog") ||
        cls.includes("post-ufi") ||
        cls.includes("post-footer")
      );
    },
    replacement: () => "",
  });

  // Captioned images: extract the <img> and its figcaption cleanly
  td.addRule("captionedImage", {
    filter: "figure",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const img = el.querySelector("img");
      const caption = el.querySelector("figcaption");

      if (!img) return _content;

      const src = img.getAttribute("src") ?? "";
      const alt = img.getAttribute("alt") ?? "";
      const captionText = caption?.textContent?.trim() ?? "";

      const imgMd = `![${alt}](${src})`;
      return captionText ? `\n\n${imgMd}\n*${captionText}*\n\n` : `\n\n${imgMd}\n\n`;
    },
  });

  return td;
}

function formatFrontmatter(post: SubstackPost): string {
  const lines = ["---"];
  lines.push(`title: "${post.title.replace(/"/g, '\\"')}"`);
  if (post.subtitle) lines.push(`subtitle: "${post.subtitle.replace(/"/g, '\\"')}"`);
  if (post.authorName) lines.push(`author: "${post.authorName}"`);
  if (post.publishDate) {
    const date = new Date(post.publishDate).toISOString().split("T")[0];
    lines.push(`date: "${date}"`);
  }
  if (post.canonicalUrl) lines.push(`url: "${post.canonicalUrl}"`);
  lines.push("---");
  return lines.join("\n");
}

export function convertToMarkdown(post: SubstackPost): string {
  const td = buildTurndownService();
  const body = td.turndown(post.bodyHtml);
  const frontmatter = formatFrontmatter(post);
  return `${frontmatter}\n\n# ${post.title}\n\n${body}`;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
