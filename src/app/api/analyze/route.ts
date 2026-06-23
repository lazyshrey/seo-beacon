import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import Groq from "groq-sdk";

// Simple in-memory cache to prevent duplicate Groq API calls and escape rate limits
const analysisCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache

function calculateSeoScores(data: {
  url: string;
  statusCode: number;
  responseTime: number;
  fileSizeKb: number;
  wordCount: number;
  robotsTxtExists: boolean;
  sitemapXmlExists: boolean;
  isBoilerplateTitle: boolean;
  isBoilerplateDesc: boolean;
  hasLogo: boolean;
  hasViewport: boolean;
  hasSemanticTags: boolean;
  isHttps: boolean;
  securityHeaders: { hsts: boolean; csp: boolean; xContentTypeOptions: boolean; xFrameOptions: boolean };
  serverHeaderDisclosure: boolean;
  title: { exists: boolean; length: number; content: string | null };
  description: { exists: boolean; length: number };
  canonical: { exists: boolean };
  headings: {
    count: { h1: number; h2: number; h3: number };
    sequence: { tag: string; text: string; length: number }[];
    emptyHeadingsCount: number;
  };
  images: { total: number; missingAlt: number };
  links: { total: number; internal: number; external: number; emptyOrBroken: number; missingRelSecurity: number; genericAnchorsCount: number; socialLinksCount: number; hasSharingButtons: boolean };
  openGraph: { title: string | null; description: string | null; image: string | null };
  twitter: { title: string | null; description: string | null; image: string | null };
  semanticStructure: { header: boolean; footer: boolean; nav: boolean; main: boolean; section: boolean };
}) {
  const isLocal = data.url.includes("localhost") || data.url.includes("127.0.0.1");

  // 1. Meta Data Score (Start 100, deduction-based)
  let metaData = 100;
  if (!data.title.exists) metaData -= 40;
  else if (data.title.length < 30 || data.title.length > 60) metaData -= 20;
  
  if (!data.description.exists) metaData -= 35;
  else if (data.description.length < 110 || data.description.length > 160) metaData -= 20;
  
  if (!data.canonical.exists) metaData -= 20;
  if (!data.robotsTxtExists) metaData -= 20;
  if (!data.sitemapXmlExists) metaData -= 20;
  
  if (data.isBoilerplateTitle) metaData -= 50;
  if (data.isBoilerplateDesc) metaData -= 50;
  
  metaData = Math.max(10, Math.min(100, metaData));

  // 2. Page Quality Score (Start 100, deduction-based)
  let pageQuality = 100;
  if (data.wordCount < 100) pageQuality -= 50;
  else if (data.wordCount < 300) pageQuality -= 30;
  else if (data.wordCount < 600) pageQuality -= 15;
  
  if (data.images.total > 0) {
    const altRatio = data.images.missingAlt / data.images.total;
    pageQuality -= Math.round(altRatio * 40);
    if (data.images.missingAlt > 0) {
      pageQuality -= 5; // Flat penalty if any image Alt text is missing
    }
  } else {
    pageQuality -= 15; // penalize for lack of rich visual content
  }
  
  if (!data.hasLogo) pageQuality -= 25;
  if (!data.hasViewport) pageQuality -= 40;
  
  pageQuality = Math.max(10, Math.min(100, pageQuality));

  // 3. Page Structure Score (Start 100, deduction-based)
  let pageStructure = 100;
  
  // H1 checks
  if (data.headings.count.h1 === 0) pageStructure -= 50;
  else if (data.headings.count.h1 > 1) pageStructure -= 25;
  
  // Heading presence checks
  if (data.headings.count.h2 === 0) pageStructure -= 20;
  if (data.headings.count.h3 === 0) pageStructure -= 10;
  
  // Heading hierarchy jumps checks
  let skipsLevels = false;
  let lastLevel = 0;
  for (const h of data.headings.sequence) {
    const currentLevel = parseInt(h.tag.substring(1));
    if (lastLevel > 0 && currentLevel > lastLevel + 1) {
      skipsLevels = true;
    }
    lastLevel = currentLevel;
  }
  if (skipsLevels) pageStructure -= 20;

  // Heading length audits
  let hasTooLongHeadings = false;
  for (const h of data.headings.sequence) {
    if (h.tag === "h1" && h.length > 70) hasTooLongHeadings = true;
    if (h.tag === "h2" && h.length > 100) hasTooLongHeadings = true;
  }
  if (hasTooLongHeadings) pageStructure -= 15;

  // Empty headings audit
  if (data.headings.emptyHeadingsCount > 0) {
    pageStructure -= Math.min(25, data.headings.emptyHeadingsCount * 5);
  }

  // Title - H1 overlap
  if (data.title.exists && data.headings.count.h1 > 0) {
    const mainH1 = data.headings.sequence.find(h => h.tag === "h1");
    if (mainH1 && mainH1.text === data.title.content) {
      pageStructure -= 15;
    }
  }

  // HTML5 Semantic structure audit
  if (!data.semanticStructure.header) pageStructure -= 2;
  if (!data.semanticStructure.footer) pageStructure -= 2;
  if (!data.semanticStructure.main) pageStructure -= 2;
  if (!data.semanticStructure.nav) pageStructure -= 2;
  if (!data.hasSemanticTags) pageStructure -= 5;

  pageStructure = Math.max(10, Math.min(100, pageStructure));

  // 4. Links Score (Start 100, deduction-based)
  let links = 100;
  if (data.links.total === 0) {
    links -= 50;
  } else {
    if (data.links.internal === 0) links -= 20;
    if (data.links.external === 0) links -= 20;
    
    if (data.links.emptyOrBroken > 0) {
      const brokenRatio = data.links.emptyOrBroken / data.links.total;
      links -= Math.round(brokenRatio * 50) + 15;
    }

    // Generic link terms audit
    if (data.links.genericAnchorsCount > 0) {
      const genericRatio = data.links.genericAnchorsCount / data.links.total;
      links -= Math.round(genericRatio * 30);
    }

    // Security attributes missing
    if (data.links.external > 0 && data.links.missingRelSecurity > 0) {
      const missingSecurityRatio = data.links.missingRelSecurity / data.links.external;
      links -= Math.round(missingSecurityRatio * 20);
    }

    // Over-linking check
    if (data.links.total > 100) {
      links -= 15;
    } else if (data.links.total > 200) {
      links -= 30;
    }
  }
  
  links = Math.max(10, Math.min(100, links));

  // 5. Server Score (Start 100, deduction-based)
  let server = 100;
  if (data.statusCode !== 200) server -= 60;
  if (data.responseTime >= 1.2) server -= 40;
  else if (data.responseTime >= 0.5) server -= 20;
  else if (data.responseTime >= 0.25) server -= 10;
  
  if (data.fileSizeKb >= 120) server -= 30;
  else if (data.fileSizeKb >= 80) server -= 15;

  // SSL/HTTPS Check
  if (!data.isHttps) {
    server -= 40; // Severe deduction for unsecure HTTP
  }

  // Security Headers Audit
  let missingHeadersCount = 0;
  if (!data.securityHeaders.hsts) missingHeadersCount++;
  if (!data.securityHeaders.csp) missingHeadersCount++;
  if (!data.securityHeaders.xContentTypeOptions) missingHeadersCount++;
  if (!data.securityHeaders.xFrameOptions) missingHeadersCount++;
  server -= (missingHeadersCount * 2); // up to 8 points

  // Software version leakage
  if (data.serverHeaderDisclosure) {
    server -= 2;
  }
  
  // Cap unencrypted server scores at 40
  if (!data.isHttps && !isLocal) {
    server = Math.min(40, server);
  }
  
  server = Math.max(10, Math.min(100, server));

  // 6. External Score / Social Media Signals Audit
  let external = 100;
  const hasOg = !!(data.openGraph.title || data.openGraph.description);
  const hasTw = !!(data.twitter.title || data.twitter.description);
  if (!hasOg) external -= 40;
  if (!hasTw) external -= 30;
  
  // Image metadata tag presence
  if (!data.openGraph.image) external -= 15;
  if (!data.twitter.image) external -= 15;

  // Social profile links presence
  if (data.links.socialLinksCount === 0) {
    external -= 35;
  } else if (data.links.socialLinksCount < 2) {
    external -= 15;
  }

  // Social sharing intent widgets presence
  if (!data.links.hasSharingButtons) {
    external -= 45; // Seobility warning for "few social sharing options"
  }

  external = Math.max(10, Math.min(100, external));

  // Overall Score (Weighted Average)
  let overallScore = Math.round(
    metaData * 0.25 +
    pageQuality * 0.20 +
    pageStructure * 0.15 +
    links * 0.15 +
    server * 0.15 +
    external * 0.10
  );

  // Foundational penalties (robots, sitemap, canonical) - Critical constraints
  let missingFoundationalCount = 0;
  if (!data.robotsTxtExists) missingFoundationalCount++;
  if (!data.sitemapXmlExists) missingFoundationalCount++;
  if (!data.canonical.exists) missingFoundationalCount++;

  if (missingFoundationalCount === 3) {
    overallScore = Math.min(25, overallScore);
  } else if (missingFoundationalCount === 2) {
    overallScore = Math.min(40, overallScore);
  } else if (missingFoundationalCount === 1) {
    overallScore = Math.min(55, overallScore);
  }

  // Boilerplate starter hard caps
  if (data.isBoilerplateTitle || data.isBoilerplateDesc) {
    overallScore = Math.min(20, overallScore);
  }

  // HTTP unsecure connection hard cap
  if (!data.isHttps && !isLocal) {
    overallScore = Math.min(45, overallScore);
  }

  return {
    score: overallScore,
    onPageScores: {
      metaData,
      pageQuality,
      pageStructure,
      links,
      server,
      external
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Parse & normalize URL
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Check cache to escape rate limits for repeated scans
    const cacheKey = normalizedUrl.toLowerCase();
    const cached = analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.response);
    }

    // Retrieve Groq API Key strictly from server environment
    const groqApiKey = process.env.GROQ_API_KEY;

    // Fetch Target Website HTML and record stats
    let html = "";
    let statusCode = 200;
    const startTime = performance.now();
    let isHttps = normalizedUrl.toLowerCase().startsWith("https://");
    let hasHsts = false;
    let hasCsp = false;
    let hasXContentTypeOptions = false;
    let hasXFrameOptions = false;
    let serverHeader: string | null = null;
    let xPoweredBy: string | null = null;
    
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 0 }, // Do not cache SEO results
      });

      statusCode = response.status;
      html = await response.text();
      
      const finalUrl = response.url || normalizedUrl;
      isHttps = finalUrl.toLowerCase().startsWith("https://");
      
      hasHsts = response.headers.has("strict-transport-security");
      hasCsp = response.headers.has("content-security-policy") || response.headers.has("x-webkit-csp") || response.headers.has("content-security-policy-report-only");
      hasXContentTypeOptions = response.headers.has("x-content-type-options");
      hasXFrameOptions = response.headers.has("x-frame-options");
      serverHeader = response.headers.get("server");
      xPoweredBy = response.headers.get("x-powered-by");
    } catch (fetchError: any) {
      return NextResponse.json(
        { error: `Failed to fetch website: ${fetchError.message || fetchError}` },
        { status: 422 }
      );
    }

    const endTime = performance.now();
    const responseTime = parseFloat(((endTime - startTime) / 1000).toFixed(2));
    const fileSizeKb = parseFloat((Buffer.byteLength(html, "utf-8") / 1024).toFixed(1));

    // Scrape SEO Data using Cheerio
    const $ = cheerio.load(html);

    // Title tag
    const titleElement = $("title");
    const titleText = titleElement.text()?.trim() || null;
    const titleInfo = {
      content: titleText,
      length: titleText ? titleText.length : 0,
      exists: !!titleText,
    };

    // Meta Description tag
    const metaDescription = $('meta[name="description"]').attr("content")?.trim() || null;
    const descriptionInfo = {
      content: metaDescription,
      length: metaDescription ? metaDescription.length : 0,
      exists: !!metaDescription,
    };

    // Canonical link tag
    const canonicalLink = $('link[rel="canonical"]').attr("href")?.trim() || null;
    const canonicalInfo = {
      content: canonicalLink,
      exists: !!canonicalLink,
    };

    // Headings H1, H2, H3
    const h1s: string[] = [];
    $("h1").each((_, el) => {
      const text = $(el).text()?.trim();
      if (text) h1s.push(text);
    });

    const h2s: string[] = [];
    $("h2").each((_, el) => {
      const text = $(el).text()?.trim();
      if (text) h2s.push(text);
    });

    const h3s: string[] = [];
    $("h3").each((_, el) => {
      const text = $(el).text()?.trim();
      if (text) h3s.push(text);
    });

    const headingsSequence: { tag: string; text: string; length: number }[] = [];
    let emptyHeadingsCount = 0;
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const text = $(el).text()?.trim() || "";
      if (text === "") {
        emptyHeadingsCount++;
      }
      headingsSequence.push({
        tag: el.tagName.toLowerCase(),
        text,
        length: text.length,
      });
    });

    const headingsInfo = {
      h1: h1s,
      h2: h2s.slice(0, 15), // Cap for JSON transfer size
      h3: h3s.slice(0, 15),
      count: {
        h1: h1s.length,
        h2: h2s.length,
        h3: h3s.length,
      },
      sequence: headingsSequence,
      emptyHeadingsCount,
    };

    // Image alt attributes
    let totalImages = 0;
    let missingAltCount = 0;
    const imagesList: { src: string; alt: string | null }[] = [];

    $("img").each((_, el) => {
      totalImages++;
      const src = $(el).attr("src") || "";
      const alt = $(el).attr("alt");
      const isMissingAlt = !alt || alt.trim() === "";

      if (isMissingAlt) {
        missingAltCount++;
      }

      if (imagesList.length < 10) {
        imagesList.push({
          src,
          alt: isMissingAlt ? null : alt.trim(),
        });
      }
    });

    const imagesInfo = {
      total: totalImages,
      missingAlt: missingAltCount,
      sample: imagesList,
    };

    // OpenGraph Tags
    const openGraphInfo = {
      title: $('meta[property="og:title"]').attr("content")?.trim() || null,
      description: $('meta[property="og:description"]').attr("content")?.trim() || null,
      image: $('meta[property="og:image"]').attr("content")?.trim() || null,
      url: $('meta[property="og:url"]').attr("content")?.trim() || null,
      type: $('meta[property="og:type"]').attr("content")?.trim() || null,
    };

    // Twitter Tags
    const twitterInfo = {
      card: $('meta[name="twitter:card"]').attr("content")?.trim() || null,
      title: $('meta[name="twitter:title"]').attr("content")?.trim() || null,
      description: $('meta[name="twitter:description"]').attr("content")?.trim() || null,
      image: $('meta[name="twitter:image"]').attr("content")?.trim() || null,
    };

    // Links: Internal and External
    let totalLinks = 0;
    let internalLinks = 0;
    let externalLinks = 0;
    let emptyLinks = 0;
    let missingRelSecurity = 0;
    let genericAnchorsCount = 0;
    let socialLinksCount = 0;
    let hasSharingButtons = false;

    const genericTerms = [
      "click here", "click", "here", "read more", "read", "more", 
      "learn more", "learn", "website", "link", "this page", "page",
      "go", "view", "details", "info", "source", "url", "press here",
      "button", "image", "logo", "icon"
    ];

    const hostname = parsedUrl.hostname;

    $("a").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      const rel = $(el).attr("rel")?.toLowerCase() || "";
      const text = $(el).text()?.trim().toLowerCase() || "";

      if (!text || genericTerms.includes(text) || text.length <= 2) {
        genericAnchorsCount++;
      }

      if (href) {
        const hrefLower = href.toLowerCase();
        if (
          hrefLower.includes("facebook.com") ||
          hrefLower.includes("twitter.com") ||
          hrefLower.includes("x.com") ||
          hrefLower.includes("linkedin.com") ||
          hrefLower.includes("instagram.com") ||
          hrefLower.includes("youtube.com") ||
          hrefLower.includes("pinterest.com") ||
          hrefLower.includes("github.com")
        ) {
          socialLinksCount++;
          // Check if it is a sharing dialog / intent link
          if (
            hrefLower.includes("share") ||
            hrefLower.includes("intent/tweet") ||
            hrefLower.includes("sharer") ||
            hrefLower.includes("pin/create")
          ) {
            hasSharingButtons = true;
          }
        }
      }

      if (!href) {
        emptyLinks++;
        totalLinks++;
        return;
      }

      totalLinks++;

      // Check if internal or external
      const isInternal = href.startsWith("/") || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:");
      if (isInternal) {
        internalLinks++;
      } else {
        try {
          const tempUrl = new URL(href, normalizedUrl);
          if (tempUrl.hostname === hostname) {
            internalLinks++;
          } else {
            externalLinks++;
            // Check target="_blank" security attributes
            const target = $(el).attr("target")?.toLowerCase();
            if (target === "_blank") {
              if (!rel.includes("noopener") && !rel.includes("noreferrer")) {
                missingRelSecurity++;
              }
            }
          }
        } catch {
          emptyLinks++; // invalid href format
        }
      }
    });

    const linksInfo = {
      total: totalLinks,
      internal: internalLinks,
      external: externalLinks,
      emptyOrBroken: emptyLinks,
      missingRelSecurity,
      genericAnchorsCount,
      socialLinksCount,
      hasSharingButtons,
    };

    // Word Count estimation
    const bodyText = $("body").text() || "";
    const cleanText = bodyText.replace(/\s+/g, " ").trim();
    const wordCount = cleanText ? cleanText.split(" ").length : 0;
    const language = $("html").attr("lang")?.trim() || "en";

    // 1. Programmatic Robots.txt & Sitemap.xml queries
    let robotsTxtExists = false;
    let sitemapXmlExists = false;

    try {
      const robotsUrl = new URL("/robots.txt", normalizedUrl).toString();
      const robotsRes = await fetch(robotsUrl, { method: "GET", next: { revalidate: 0 } });
      robotsTxtExists = robotsRes.status === 200;
    } catch {}

    try {
      const sitemapUrl = new URL("/sitemap.xml", normalizedUrl).toString();
      const sitemapRes = await fetch(sitemapUrl, { method: "GET", next: { revalidate: 0 } });
      sitemapXmlExists = sitemapRes.status === 200;
    } catch {}

    // 2. Boilerplate Detection
    const titleTextLower = titleText?.toLowerCase() || "";
    const isBoilerplateTitle = 
      titleTextLower.includes("create next app") || 
      titleTextLower.includes("vite + react") || 
      titleTextLower.includes("webpack app") || 
      titleTextLower.includes("react app") || 
      titleTextLower.includes("next.js starter") ||
      titleTextLower.includes("gatsby starter") ||
      titleTextLower.includes("tailwind starter");

    const descTextLower = metaDescription?.toLowerCase() || "";
    const isBoilerplateDesc = 
      descTextLower.includes("generated by create next app") || 
      descTextLower.includes("generated by vite") ||
      descTextLower.includes("web site created using create-react-app") ||
      descTextLower.includes("bootstrap starter");

    // 3. Logo Presence Detection
    let hasLogo = false;
    $("img, svg, div, a").each((_, el) => {
      const alt = $(el).attr("alt")?.toLowerCase() || "";
      const className = $(el).attr("class")?.toLowerCase() || "";
      const id = $(el).attr("id")?.toLowerCase() || "";
      if (
        alt.includes("logo") || 
        className.includes("logo") || 
        id.includes("logo") || 
        className.includes("brand") ||
        id.includes("brand")
      ) {
        hasLogo = true;
        return false; // Break loop
      }
    });

    // 4. Viewport & Semantic Elements Audit (High Value)
    const hasViewport = $('meta[name="viewport"]').length > 0;
    const hasSemanticTags = $("header, footer, nav, main, section").length > 0;
    const semanticStructure = {
      header: $("header").length > 0,
      footer: $("footer").length > 0,
      nav: $("nav").length > 0,
      main: $("main").length > 0 || $('div[role="main"]').length > 0,
      section: $("section").length > 0,
      allSemantic: hasSemanticTags,
    };

    const scrapedData = {
      url: normalizedUrl,
      statusCode,
      responseTime,
      fileSizeKb,
      wordCount,
      language,
      robotsTxtExists,
      sitemapXmlExists,
      isBoilerplateTitle,
      isBoilerplateDesc,
      hasLogo,
      hasViewport,
      hasSemanticTags,
      isHttps,
      securityHeaders: {
        hsts: hasHsts,
        csp: hasCsp,
        xContentTypeOptions: hasXContentTypeOptions,
        xFrameOptions: hasXFrameOptions,
      },
      serverHeaderDisclosure: !!(serverHeader || xPoweredBy),
      title: titleInfo,
      description: descriptionInfo,
      canonical: canonicalInfo,
      headings: headingsInfo,
      images: imagesInfo,
      openGraph: openGraphInfo,
      twitter: twitterInfo,
      links: linksInfo,
      semanticStructure,
    };

    // 5. Objective Mathematical Score Calculations
    const calculatedMetrics = calculateSeoScores(scrapedData);

    // If Groq key is NOT provided, fail immediately
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Groq API Key is not configured on the server. Please set GROQ_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    // Call Groq completions with JSON mode
    const groq = new Groq({ apiKey: groqApiKey });
    const prompt = `You are an expert SEO Audit Specialist. Perform an in-depth, professional SEO audit matching the standard metrics of major SEO grader tools (like Seobility) on the scraped data below.
Website URL: ${normalizedUrl}

Scraped SEO Data:
${JSON.stringify(scrapedData, null, 2)}

PRE-CALCULATED MATHEMATICAL AUDIT GRADES:
- Overall SEO Score: ${calculatedMetrics.score}/100
- Metadata Category Score: ${calculatedMetrics.onPageScores.metaData}/100
- Page Quality Category Score: ${calculatedMetrics.onPageScores.pageQuality}/100
- Page Structure Category Score: ${calculatedMetrics.onPageScores.pageStructure}/100
- Link Structure Category Score: ${calculatedMetrics.onPageScores.links}/100
- Server Configuration Category Score: ${calculatedMetrics.onPageScores.server}/100
- External Factors Category Score: ${calculatedMetrics.onPageScores.external}/100

CRITICAL GRADING CONSTRAINTS:
1. YOU MUST USE THE PRE-CALCULATED MATHEMATICAL GRADES ABOVE. DO NOT CALCULATE YOUR OWN SCORES.
2. Structure your checklists, explanations, warnings, and errors to explain why the site received these pre-calculated scores.
3. For example, explain that missing sitemaps, boilerplate starter text, missing logos, zero viewport tags, or empty headings will drop the scores significantly.
4. YOU MUST GENERATE A DETAILED TO-DO ITEM IN "criticalFixes" FOR EVERY CHECKPOINT THAT HAS A STATUS OF "warning" OR "error" IN YOUR DETAILED TABS. Be extremely comprehensive: if 5 checkpoints are warnings/errors, there must be exactly 5 corresponding entries in criticalFixes. Output as many items as necessary so that the to-do list contains all failed or warning elements.
5. In each item within "criticalFixes", include an "importance" key whose value must match the importance level of the corresponding checkpoint in the tabs (e.g. "Very important" for errors/critical items, "Important" for warnings, or "Optional" for minor issues).

Provide your response strictly in JSON format. The JSON object must contain the following keys exactly:
{
  "summary": "Short 1-2 sentence overall summary of the SEO status explaining why it scored what it did.",
  "criticalFixes": [
    {
      "title": "Brief title of recommended action",
      "description": "Short explanation of the issue & fix",
      "type": "error" or "warning",
      "category": "Meta data" or "Page quality" or "Page structure" or "Link structure" or "Server configuration" or "External factors",
      "importance": "Very important" or "Important" or "Optional"
    }
  ],
  "metaDataTab": [
    {
      "name": "Title Tag",
      "status": "pass" or "warning" or "error",
      "score": "3/3" or "1/2" or "0/1" etc.,
      "importance": "Very important" or "Important" or "Optional",
      "value": "Current title content or 'Missing'",
      "checks": [
        "Checklist point 1 (e.g. 'The length of the page title is perfect (53 characters).')",
        "Checklist point 2 (e.g. 'There are no duplicate words.')",
        "Checklist point 3 (e.g. 'CRITICAL: Page uses default Next.js boilerplate title.')"
      ],
      "tip": "Tip: Each page should have a unique meta title between 30 and 60 characters."
    },
    {
      "name": "Meta Description",
      "status": "pass" or "warning" or "error",
      "score": "2/2" or "1/2" etc.,
      "importance": "Very important" or "Important" or "Optional",
      "value": "Current description content or 'Missing'",
      "checks": ["Specific check on description length, keywords, presence, or boilerplate warning"],
      "tip": "Tip: A meta description should summarize the page and be between 110 and 160 characters."
    },
    {
      "name": "Crawlability",
      "status": "pass" or "warning" or "error",
      "score": "1/1",
      "importance": "Very important",
      "value": "robots index tags status",
      "checks": ["Crawlability status check", "Robots.txt references"],
      "tip": "Tip: Ensure search engines are not blocked from indexing the page by noindex meta tags."
    },
    {
      "name": "Sitemap XML",
      "status": "pass" or "warning" or "error",
      "score": "1/1" or "0/1",
      "importance": "Important",
      "value": "Sitemap link presence",
      "checks": ["Verify if sitemap.xml exists on server root"],
      "tip": "Tip: Sitemaps help search engines find and index all pages on your site."
    },
    {
      "name": "Robots.txt file",
      "status": "pass" or "warning" or "error",
      "score": "1/1" or "0/1",
      "importance": "Important",
      "value": "Robots.txt file status",
      "checks": ["Verify if robots.txt exists on server root to instruct crawlers"],
      "tip": "Tip: Robots.txt tells crawlers which directories or pages they can request."
    },
    {
      "name": "Canonical Link",
      "status": "pass" or "warning" or "error",
      "score": "1/1" or "0/1",
      "importance": "Important",
      "value": "Canonical URL or 'Missing'",
      "checks": ["Check if canonical URL matches current page, is absolute, exists"],
      "tip": "Tip: Canonical tags prevent duplicate content penalties from search engines."
    }
  ],
  "pageQualityTab": [
    {
      "name": "Word Count",
      "status": "pass" or "warning" or "error",
      "score": "2/2" or "1/2" or "0/2",
      "importance": "Important",
      "value": "Word count value",
      "checks": ["Detailed check on whether the word count is sufficient (at least 300 words recommended)."],
      "tip": "Tip: Search engines prefer pages with substantial, high-quality content."
    },
    {
      "name": "Image Alt Tags",
      "status": "pass" or "warning" or "error",
      "score": "3/3" or "2/3" etc.,
      "importance": "Important",
      "value": "Image alt tags status",
      "checks": ["Audit of images and details of missing alt tags"],
      "tip": "Tip: Image alt tags help search engine crawlers understand what the image displays."
    },
    {
      "name": "Logo Check",
      "status": "pass" or "warning" or "error",
      "score": "1/1" or "0/1",
      "importance": "Important",
      "value": "Logo / Brand image element status",
      "checks": ["Verify if a branding logo image or SVG is present on the page"],
      "tip": "Tip: A distinct logo helps establish trust and brand identity for crawlers and readers."
    },
    {
      "name": "Mobile Responsiveness (Viewport)",
      "status": "pass" or "warning" or "error",
      "score": "1/1" or "0/1",
      "importance": "Very important",
      "value": "Viewport tag presence",
      "checks": ["Verify presence of meta name=viewport tag for mobile SEO responsiveness"],
      "tip": "Tip: Mobile responsiveness is a primary search index ranking factor."
    },
    {
      "name": "Content Quality & Density",
      "status": "pass" or "warning" or "error",
      "score": "1/1",
      "importance": "Important",
      "value": "General text content analysis",
      "checks": ["Keyword occurrence checks", "Layout readability"],
      "tip": "Tip: Write content primarily for human readers, using keyword synonyms naturally."
    }
  ],
  "pageStructureTab": [
    {
      "name": "H1 Heading",
      "status": "pass" or "warning" or "error",
      "score": "1/1" or "0/1",
      "importance": "Very important",
      "value": "H1 outline status",
      "checks": ["Check if exactly one H1 exists, matches user intent"],
      "tip": "Tip: The H1 tag represents the main headline of the page and there should only be one."
    },
    {
      "name": "Heading Outline Hierarchy",
      "status": "pass" or "warning" or "error",
      "score": "2/2" or "1/2",
      "importance": "Important",
      "value": "H2/H3 outline hierarchy",
      "checks": ["Analysis of sequence logic, H2s followed by H3s, outline sizes"],
      "tip": "Tip: Headings should form a logical, hierarchical table of contents (H1 -> H2 -> H3)."
    },
    {
      "name": "Semantic HTML structure",
      "status": "pass" or "warning" or "error",
      "score": "1/1",
      "importance": "Optional",
      "value": "HTML tags used",
      "checks": ["Audit of header, nav, main, footer, article tags"],
      "tip": "Tip: Semantic HTML tags help search engines understand the outline sections of the document."
    }
  ],
  "linksTab": [
    {
      "name": "Link Count & Structure",
      "status": "pass" or "warning" or "error",
      "score": "2/2",
      "importance": "Important",
      "value": "Link density status",
      "checks": ["Internal vs external links distribution", "Total links count density"],
      "tip": "Tip: Ensure you link to other high-quality internal page targets to distribute link authority."
    },
    {
      "name": "Empty or Broken Links",
      "status": "pass" or "warning" or "error",
      "score": "1/1" or "0/1",
      "importance": "Very important",
      "value": "Broken links status",
      "checks": ["Empty anchors '#', invalid URIs, placeholder triggers"],
      "tip": "Tip: Remove or fix empty or broken links to prevent degrading the user crawl experience."
    }
  ],
  "serverTab": [
    {
      "name": "HTTP Response Status",
      "status": "pass" or "warning" or "error",
      "score": "1/1",
      "importance": "Very important",
      "value": "HTTP Status Code (e.g. 200 OK)",
      "checks": ["Server response verification", "Redirect status"],
      "tip": "Tip: Search crawlers require pages to successfully return a 200 OK status code."
    },
    {
      "name": "Page Speed & Response Time",
      "status": "pass" or "warning" or "error",
      "score": "1/1",
      "importance": "Important",
      "value": "Response speed",
      "checks": ["Server latency evaluation", "Connection handshake speed"],
      "tip": "Tip: Fast loading times improve search rankings and lower user bounce rates."
    },
    {
      "name": "File Size & Compression",
      "status": "pass" or "warning" or "error",
      "score": "1/1",
      "importance": "Important",
      "value": "File size",
      "checks": ["HTML file size limits checks (recommend keeping under 100KB)"],
      "tip": "Tip: Compress HTML, styles, and scripts to keep the page payloads as lightweight as possible."
    }
  ],
  "externalTab": [
    {
      "name": "Backlink Opportunities",
      "status": "pass" or "warning" or "error",
      "score": "1/1",
      "importance": "Important",
      "value": "Off-page backlink profile recommendation",
      "checks": ["Strategic backlinks advice", "Link building action items"],
      "tip": "Tip: Backlinks are links from other sites pointing to your site, serving as a vote of trust."
    },
    {
      "name": "Social Signals Presence",
      "status": "pass" or "warning" or "error",
      "score": "1/1",
      "importance": "Important",
      "value": "Facebook OpenGraph and Twitter cards presence",
      "checks": ["Verification of social preview tags completeness"],
      "tip": "Tip: Social preview cards improve CTR when links are shared on networks."
    }
  ]
}

Make sure every check item in each Tab array includes "name", "status", "score", "importance", "value", "checks" (array of strings), and "tip" (string).
Analyze the scraping data rigorously and fill in realistic, highly accurate points.
Only return the raw JSON object. Do not include markdown codeblocks or extra text.`;

    // Fetch from Groq with retry logic for rate limit escaping (429 handling)
    let chatCompletion;
    let retries = 3;
    let delay = 1500; // Start with 1.5s delay
    
    while (retries > 0) {
      try {
        chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are a professional SEO and web design auditor. You analyze crawled data and output strictly formatted JSON responses.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.1,
        });
        break; // Success, break loop
      } catch (err: any) {
        if (err.status === 429 && retries > 1) {
          console.warn(`Groq API rate limit hit (429). Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retries--;
          delay *= 2.5; // Exponential backoff
        } else {
          throw err;
        }
      }
    }

    const responseContent = chatCompletion?.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Empty response from Groq API");
    }

    const aiAnalysis = JSON.parse(responseContent);
    
    // Inject programmatic scores to prevent AI hallucinations and override/enforce exact math
    const finalResponse = {
      success: true,
      scrapedData,
      aiAnalysis: {
        ...aiAnalysis,
        score: calculatedMetrics.score,
        onPageScores: calculatedMetrics.onPageScores
      }
    };

    // Cache the successful response
    analysisCache.set(cacheKey, {
      response: finalResponse,
      timestamp: Date.now(),
    });

    return NextResponse.json(finalResponse);
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during analysis" },
      { status: 500 }
    );
  }
}
