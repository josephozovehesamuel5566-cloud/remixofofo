import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Initialize Gemini Client with designated telemetry headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    if (!action) {
      return NextResponse.json({ error: "No action provided" }, { status: 400 });
    }

    if (action === "headline-gen") {
      const { content, tone = "professional" } = payload;
      const prompt = `Based on the following article content, generate 5 premium, catchy high-CTR headlines suitable for a prestige publication. Format each on a new line starting with a number. Tone specified: ${tone}.

Content:
${content.substring(0, 5000)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const headlines = (response.text || "")
        .split("\n")
        .map(line => line.replace(/^\d+[\.\-\s]*/, "").trim())
        .filter(line => line.length > 0);

      return NextResponse.json({ headlines });
    }

    if (action === "summary-gen") {
      const { content } = payload;
      const prompt = `Read this article and write a high-fidelity, elegant 2-sentence editorial summary suitable for a front-page card. No hype, just clear informative journalism.

Content:
${content.substring(0, 5000)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return NextResponse.json({ summary: response.text?.trim() || "" });
    }

    if (action === "seo-suggestions") {
      const { title, content } = payload;
      const prompt = `Act as an expert SEO Specialist for Ofofo.ng. Analyze the article title and content below.
Generate:
1. A highly optimized SEO Title (under 60 characters)
2. An engaging Meta Description (under 155 characters) that encourages clicks.

Format the output strictly as a JSON object matching this schema:
{
  "seoTitle": "suggested title",
  "seoDescription": "suggested description"
}

Article Title: ${title}
Content:
${content.substring(0, 3000)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              seoTitle: { type: Type.STRING },
              seoDescription: { type: Type.STRING }
            },
            required: ["seoTitle", "seoDescription"]
          }
        }
      });

      const data = JSON.parse(response.text?.trim() || "{}");
      return NextResponse.json(data);
    }

    if (action === "content-improvements") {
      const { title, content } = payload;
      const prompt = `Act as an expert Editorial Coach the calibre of The Economist and Medium. Review the following article titled "${title}".
Provide critical, objective, constructive feedback under these headings:
1. Clarity & Rhythm
2. Structural Flow
3. Missing Context
4. Bullet point of direct correction actionables.

Content:
${content.substring(0, 4000)}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      return NextResponse.json({ feedback: response.text || "" });
    }

    if (action === "ai-search") {
      const { query } = payload;
      const articles = db.getArticles("Published");
      const articleCorpus = articles.map(a => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        tags: a.tags
      }));

      const prompt = `You are the Natural Language AI Search Engine for Ofofo.ng.
A recipient is searching the site for: "${query}".
Here is the available catalog of articles:
${JSON.stringify(articleCorpus, null, 2)}

Instructions:
1. Determine which articles are relevant to the query.
2. Return a list of matches. For each match, provide a 1-sentence analytical reason why this article was matched.
3. Order them by semantic fit (strongest match first).
4. Extract if any categories/topics or tags are highly relevant and list them.

Format the response strictly as a JSON object matching this exact schema:
{
  "matchedArticleIds": ["id-1", "id-2"],
  "explanations": {
    "id-1": "This article discusses the venture capital models in Lagos, matching your interest in startup funding",
    "id-2": "This is related because..."
  },
  "recommendedTags": ["tag1", "tag2"]
}

If absolutely zero matches are close, return empty arrays.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchedArticleIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              explanations: {
                type: Type.OBJECT,
                description: "Map of article ID to matching analytical reason"
              },
              recommendedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["matchedArticleIds", "explanations", "recommendedTags"]
          }
        }
      });

      const parsedResult = JSON.parse(response.text?.trim() || "{}");
      return NextResponse.json(parsedResult);
    }

    if (action === "generate-live-news") {
      const prompt = `Use Google Search grounding to scan the web and find the absolute latest real-life, physical, actual high-profile news events, updates, startups funding, tech releases or policy announcements from Nigeria and West Africa (preferably from 2026 or very recently).
Choose 3 distinct, authentic, high-impact news stories covering categories such as Tech & Innovation, Business & Markets, or Politics & Society.
For each of these 3 news stories, generate a premium, high-integrity editorial news article.

Format each article exactly matching files in ofofo.ng with the following JSON schema:
List of objects:
{
  "title": "A precise, catchy, high-CTR headline suited for a premium publication (e.g. 'Airtel Launches Advanced 5G Node across Enugu to Elevate Local Industrial Operations')",
  "summary": "An informative 2-sentence summary outlining who, what, when, and the overall macroeconomic or cultural impact.",
  "content": "A comprehensive, high-fidelity editorial article written in professional, deep, objective journalism style. Must contain Markdown formatting, sections (e.g. ## Secondary Heading), a quote block (> 'Our direct consensus...'), and a detailed table or a sample TypeScript/code block if technical. Ensure it is at least 400 words long and contains actual real-life details fetched from your search grounding.",
  "categoryId": "Select exactly one of 'cat-1' (Tech & Innovation), 'cat-2' (Business & Markets), 'cat-3' (Politics & Society), 'cat-4' (Entertainment & Culture), or 'cat-5' (Education & Science) based on the story focus.",
  "authorId": "Select exactly one of 'user-chioma', 'user-tarik', 'user-tolani' based on whose editorial focus fits the article topic.",
  "tags": ["A list of 3 to 5 highly relevant SEO indexing tags, e.g. ['5G', 'Airtel', 'Enugu', 'Telecomm', 'Nigeria']"]
}

Return strictly a JSON array of 3 articles. Do not include any other markdown wrapper outside of valid JSON itself. Let the articles refer to completely real, true, online information with actual people, companies, and dates.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                content: { type: Type.STRING },
                categoryId: { type: Type.STRING },
                authorId: { type: Type.STRING },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["title", "summary", "content", "categoryId", "authorId", "tags"]
            }
          }
        }
      });

      const responseText = response.text?.trim() || "[]";
      let parsedArticles = [];
      try {
        parsedArticles = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse generated articles JSON:", responseText, e);
        return NextResponse.json({ error: "Failed to parse AI response into structured articles." }, { status: 500 });
      }

      // Now, save each of these articles into the local DB state!
      const currentDB = db.getArticles();
      const newSavedArticles = [];

      for (const item of parsedArticles) {
        // Quick duplicates check by title similarity/slug
        const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const exists = currentDB.some(art => art.slug === slug || art.title.toLowerCase() === item.title.toLowerCase());
        
        if (!exists) {
          const created = db.createArticle({
            title: item.title,
            slug,
            summary: item.summary,
            content: item.content,
            featuredImage: `https://picsum.photos/seed/${Math.random().toString(36).substring(7)}/1200/630`,
            status: "Published",
            authorId: item.authorId,
            categoryId: item.categoryId,
            tags: item.tags,
            seoTitle: `${item.title} | Ofofo.ng`,
            seoDescription: item.summary.substring(0, 150),
            sponsored: false,
            premiumOnly: Math.random() > 0.7,
            publishedAt: new Date().toISOString(),
          });
          newSavedArticles.push(created);
        }
      }

      return NextResponse.json({ 
        success: true, 
        addedCount: newSavedArticles.length, 
        addedArticles: newSavedArticles
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Gemini route failure:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during Gemini processing" },
      { status: 500 }
    );
  }
}
