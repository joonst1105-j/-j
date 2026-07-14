import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { generateTrendingVideos } from "./serverTrends";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers (large limit for image uploads)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initialize Gemini client to avoid crashes if API key is loaded late
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set!");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Robust fallback function to survive model 503/429 errors
async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errMsg = String(error.message || error).toUpperCase();
    const isRetryable =
      error.status === 503 ||
      error.status === 429 ||
      errMsg.includes("503") ||
      errMsg.includes("429") ||
      errMsg.includes("UNAVAILABLE") ||
      errMsg.includes("RESOURCE_EXHAUSTED") ||
      errMsg.includes("OVERLOADED") ||
      errMsg.includes("BUSY") ||
      errMsg.includes("LIMIT");

    if (retries > 0 && isRetryable) {
      console.warn(`[Gemini API] Transient error (${error.message || error}). Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

async function generateContentWithRobustFallback({
  model,
  contents,
  config
}: {
  model: string;
  contents: any;
  config?: any;
}) {
  const ai = getAiClient();
  
  // Tier 1: Try requested model and config with exponential backoff retry
  try {
    console.log(`[Gemini API] Attempting model ${model} with retry...`);
    const response = await callWithRetry(() => ai.models.generateContent({ model, contents, config }));
    if (response && response.text) {
      return response;
    }
  } catch (err: any) {
    console.error(`[Gemini API] Tier 1 model ${model} failed after retries:`, err.message || err);
  }

  // Tier 2: Try requested model without Google Search tools (if it was requested and failed)
  if (config && config.tools) {
    try {
      console.log(`[Gemini API] Attempting model ${model} without Google Search tool with retry...`);
      const { tools, ...configWithoutTools } = config;
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model,
          contents,
          config: configWithoutTools,
        })
      );
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.error(`[Gemini API] Tier 2 model ${model} (no-tools) failed after retries:`, err.message || err);
    }
  }

  // Tier 3: Try gemini-flash-latest (highly available, fast fallback)
  if (model !== "gemini-flash-latest") {
    try {
      console.log(`[Gemini API] Attempting fallback model gemini-flash-latest with retry...`);
      let finalConfig = config;
      if (config && config.tools) {
        const { tools, ...rest } = config;
        finalConfig = rest;
      }
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: "gemini-flash-latest",
          contents,
          config: finalConfig,
        })
      );
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.error(`[Gemini API] Tier 3 fallback gemini-flash-latest failed:`, err.message || err);
    }
  }

  // Tier 4: Try gemini-3.1-flash-lite as the ultimate lightweight backup
  if (model !== "gemini-3.1-flash-lite") {
    try {
      console.log(`[Gemini API] Attempting fallback model gemini-3.1-flash-lite with retry...`);
      let finalConfig = config;
      if (config && config.tools) {
        const { tools, ...rest } = config;
        finalConfig = rest;
      }
      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents,
          config: finalConfig,
        })
      );
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.error(`[Gemini API] Tier 4 fallback gemini-3.1-flash-lite failed:`, err.message || err);
      throw err;
    }
  }

  throw new Error("All generative model tiers failed to produce a response due to upstream API unavailability.");
}

// -------------------------------------------------------------------------
// Mock Database: Popular Shopping Shorts/Reels/TikTok Videos
// -------------------------------------------------------------------------
// Replaced with dynamic procedural trend generator from ./serverTrends

// 1. Get Curated Video Trends
app.get("/api/trends", (req, res) => {
  const category = (req.query.category as string) || "household";
  const platform = (req.query.platform as string) || "All";
  const period = (req.query.period as string) || "realtime";
  const seed = parseInt(req.query.seed as string, 10) || 0;

  const list = generateTrendingVideos(category, platform, period, seed);
  
  res.json({
    trends: {
      [category]: list
    }
  });
});

// 2. Real-time Trend Discovery using Google Search Grounding with Gemini 3.5 Flash
app.post("/api/trends/discover", async (req, res) => {
  try {
    const { category, categoryKo } = req.body;
    if (!category || !categoryKo) {
      return res.status(400).json({ error: "Category is required" });
    }

    const ai = getAiClient();
    const prompt = `유튜브 쇼츠, 인스타그램 릴스, 틱톡 등 숏폼 플랫폼에서 최근 조회수가 대폭 터지고 있는 "${categoryKo}" 분야의 실제 최신 트렌드 상품 5가지를 추천해줘.
실제 존재하는 신박하고 반응 좋은 라이프스타일/쇼핑 아이템이어야 해.
다음 내용들을 분석해줘:
1. 상품명 (구체적이고 명확한 쇼핑 검색이 가능한 이름)
2. 트렌드 포인트 및 조회수 대박 원인 (왜 숏폼에서 조회수가 터지는지, 자극적이거나 시선을 끄는 포인트가 무엇인지)
3. 쇼츠 초반 3초 추천 후킹 멘트 (시청자의 이탈을 막을 한국어 자극적 멘트)
4. 예상 대박 지수 (Virality Score, 1-100)
5. 추천 쿠팡/네이버쇼핑 검색 키워드

결과는 반드시 한국어로 작성하고, JSON 형식으로만 응답해줘. 
정확히 아래 JSON 구조의 스키마와 동일해야 해:
[
  {
    "name": "상품명",
    "reason": "조회수가 잘 나오는 이유와 특징 설명",
    "hook": "추천 초반 3초 후킹 멘트",
    "score": 92,
    "query": "검색 키워드"
  }
]`;

    const response = await generateContentWithRobustFallback({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Search grounding for fresh web results
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsedData = JSON.parse(text.trim());
    res.json({ results: parsedData });
  } catch (error: any) {
    console.error("AI Trend discovery error:", error);
    res.status(500).json({ error: error.message || "Failed to discover real-time trends" });
  }
});

// 3. Analyze Product and Generate Video Script (Supporting Text/URL and/or base64 Product Image)
app.post("/api/analyze", async (req, res) => {
  try {
    const { url, description, category, tone, duration, imageBase64, imageMimeType, voice, speed } = req.body;

    if (!url && !description && !imageBase64) {
      return res.status(400).json({ error: "상품 링크, 설명 또는 이미지를 하나 이상 입력해주세요." });
    }

    const targetDuration = parseInt(duration, 10) || 30;

    const ai = getAiClient();
    const parts: any[] = [];

    // Construct detailed instruction prompt
    let userPromptText = `당신은 유튜브 쇼핑 쇼츠, 인스타그램 릴스, 틱톡을 전문으로 기획하는 '숏폼 커머스 디렉터'입니다.
제시된 상품 정보를 완벽하게 분석하여 숏폼 조회수를 폭발시킬 수 있는 '쇼츠 제작 플랜 및 대본 세트'를 생성해주세요.

[상품 입력 정보]
${url ? `- 상품 판매 주소/링크: ${url}` : ""}
${description ? `- 상품 설명 및 특징: ${description}` : ""}
${category ? `- 카테고리: ${category}` : ""}
${tone ? `- 추천 나레이션 톤앤매너: ${tone}` : "톡톡 튀고 구매욕구를 자극하는 유쾌한 톤"}
- 사용자가 요청한 각 대본의 목표 재생 시간: **${targetDuration}초** (모든 대본의 씬 총합 시간이 약 ${targetDuration}초가 되어야 합니다)
`;

    if (voice && speed) {
      const voiceLabels: Record<string, string> = {
        eunhee: "은희 (기본 여성, 친근한 대화)",
        junwoo: "준우 (기본 남성, 차분한 정보)",
        seoyeon: "서연 (부드러운 여성, 감성 힐링)",
        minji: "민지 (통통 튀는 여성, 극강 하이텐션)",
        jinwoo: "진우 (중후한 남성, 뉴스 리포터)",
        haeun: "하은 (맑고 귀여운 여성, 아동 보이스)"
      };
      const voiceLabel = voiceLabels[voice] || voice;
      userPromptText += `
[특별 지정 성우 및 속도 옵션]
- 성우 목소리 모델: ${voiceLabel}
- 나레이션 재생 속도: ${speed}배속
- 성우 모델의 고유 캐릭터(성향, 성별, 분위기)와 속도에 알맞게 나레이션 대사를 커스터마이징하고 대사의 글자 수와 템포를 조절하여 대본을 작성해 주세요. 예를 들어 아동 보이스 성우(하은)라면 더 아기자기하고 귀여운 구어체로, 빠른 배속이라면 빠르고 힘있게 구성해 주세요.
`;
    }

    userPromptText += `
[필수 요구사항]
1. 상품 분석: 소구점 3가지와 타겟 구매자 분석.
2. 초반 3초 후킹 멘트: 시청자를 강하게 흡입하는 후킹 멘트 4가지 추천 (의문형, 비판형, 1인칭 후기형 등 다양한 포맷으로).
3. 쇼츠 대본 3세트 구성:
   - 모든 대본은 각각의 씬(Scene) 재생 예상 시간(durationSec)의 총합이 **정확히 ${targetDuration}초 내외**가 되도록 구성되어야 합니다.
   - **대본 1 (직관소구형)**: 짧고 강렬하게 상품 특징을 바로 보여주는 대본 (목표 재생시간: ${targetDuration}초 내외).
   - **대본 2 (반전/문제해결형)**: 일상의 불편함을 꼬집은 뒤 해결책으로 제품을 자연스럽게 노출하는 대본 (목표 재생시간: ${targetDuration}초 내외).
   - **대본 3 (리뷰/스토리형)**: 내돈내산 찐후기 스타일 또는 흥미진진한 썰로 시작하여 추천하는 스토리텔링 대본 (목표 재생시간: ${targetDuration}초 내외).
4. 모든 대본은 각 씬(Scene)마다 '추천 화면 연출 및 액션(visual)'과 더불어 나레이션 성우가 읽을 '나레이션 멘트(narration)'를 포함해야 합니다. 나레이션 멘트는 자연스러운 입말체(한국어 구어체)여야 하며, 자막으로 넣어도 손색이 없어야 합니다.
5. 영상 제작 및 편집 연출 팁 제공.

반드시 지정된 JSON 스키마 구조로 응답해주세요.`;

    // Multimodal input handling
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
      userPromptText += `\n\n[첨부 상품 이미지 분석 요청] 업로드된 상품의 사진을 면밀히 관찰하여, 디자인적 강점이나 사용 시의 직관적인 비주얼을 대본 연출(visual) 및 상품 분석에 적극 반영해주세요.`;
    }

    parts.push({ text: userPromptText });

    const response = await generateContentWithRobustFallback({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING, description: "분석된 상품의 한국어 이름" },
            keySellingPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "상품의 강력한 소구점 (최대 3개)",
            },
            targetAudience: { type: Type.STRING, description: "가장 구매율이 높을 타겟 고객 세그먼트" },
            hooks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "초반 이탈을 차단할 뇌리에 꽂히는 3초 후킹 문구 (최대 4개)",
            },
            scripts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "대본의 컨셉 유형 (예: 15초 직관소구형, 30초 문제해결형, 50초 찐후기 리뷰형)" },
                  duration: { type: Type.STRING, description: "전체 예상 재생 시간" },
                  scenes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        sceneNumber: { type: Type.INTEGER, description: "일련 번호" },
                        visual: { type: Type.STRING, description: "추천 화면 액션 및 카메라 연출" },
                        narration: { type: Type.STRING, description: "나레이션 성우 대사 및 화면 자막 자막용 멘트" },
                        durationSec: { type: Type.INTEGER, description: "해당 씬 재생 예상 시간(초)" },
                      },
                      required: ["sceneNumber", "visual", "narration", "durationSec"],
                    },
                  },
                },
                required: ["title", "duration", "scenes"],
              },
              description: "다양한 매력의 숏폼 대본 3개 세트",
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "배경음악(BGM) 추천, 음향 효과(SFX), 텍스트 애니메이션 기법 등 가이드라인 및 편집 조언",
            },
          },
          required: ["productName", "keySellingPoints", "targetAudience", "hooks", "scripts", "tips"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Failed to generate report from Gemini");
    }

    res.json(JSON.parse(text.trim()));
  } catch (error: any) {
    console.error("AI Script generation error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze product and generate script" });
  }
});

// 4. Free TTS API Proxy with Chunking and Stitching to Support Unlimited Korean Characters
app.get("/api/tts", async (req, res) => {
  try {
    const text = req.query.text as string;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required for TTS" });
    }

    // Clean text: remove punctuation or brackets that mess up speech
    const cleanText = text
      .replace(/[\n\r]/g, " ")
      .replace(/\[.*?\]/g, "") // Remove bracket instructions
      .replace(/\s+/g, " ")
      .trim();

    // Google Translate TTS has a length limit of ~150-200 chars.
    // We split the script into smaller natural sentences using punctuation delimiters.
    const sentences = cleanText
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0);

    const buffers: Buffer[] = [];
    const maxLength = 130;

    for (const sentence of sentences) {
      let index = 0;
      while (index < sentence.length) {
        const chunk = sentence.substring(index, index + maxLength);
        index += maxLength;

        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(chunk)}`;
        
        try {
          const ttsResponse = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
              "Referer": "https://translate.google.com/"
            },
          });

          if (ttsResponse.ok) {
            const arrayBuffer = await ttsResponse.arrayBuffer();
            buffers.push(Buffer.from(arrayBuffer));
          } else {
            console.error(`Failed to fetch TTS chunk from Google. Status: ${ttsResponse.status}`);
          }
        } catch (err) {
          console.error("Error fetching TTS chunk:", err);
        }
      }
    }

    if (buffers.length === 0) {
      return res.status(500).json({ error: "음성 파일 생성에 실패했습니다." });
    }

    // Combine all generated MP3 chunks into one unified buffer
    const combinedBuffer = Buffer.concat(buffers);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "attachment; filename=shorts_audio.mp3");
    res.send(combinedBuffer);
  } catch (error: any) {
    console.error("TTS Server Proxy Error:", error);
    res.status(500).json({ error: "TTS generation encountered an unexpected error." });
  }
});

// -------------------------------------------------------------------------
// Serve Static Assets & SPA Handling
// -------------------------------------------------------------------------
if (process.env.NODE_ENV !== "production") {
  const startDevVite = async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development Server running on http://localhost:${PORT}`);
    });
  };
  startDevVite();
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production Server running on port ${PORT}`);
  });
}
