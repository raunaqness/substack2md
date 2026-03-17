import { NextRequest, NextResponse } from "next/server";
import { parseSubstackUrl, fetchSubstackPost } from "@/lib/substack";
import { convertToMarkdown, slugify } from "@/lib/converter";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required." }, { status: 400 });
    }

    if (!parseSubstackUrl(url)) {
      return NextResponse.json(
        {
          error:
            "Invalid URL. Please enter a Substack article URL like https://example.substack.com/p/article-slug",
        },
        { status: 400 }
      );
    }

    const post = await fetchSubstackPost(url);
    const markdown = convertToMarkdown(post);
    const filename = `${slugify(post.title)}.md`;

    return NextResponse.json({ markdown, filename, title: post.title });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
