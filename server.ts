import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { generateTrendingVideos } from "./serverTrends";

// Load environment variables
dotenv.config();

export const app = express();
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
    try {
      console.warn("Attempting demo fallback trends due to Gemini API failure...");
      const cat = req.body.category || "household";
      const catKo = req.body.categoryKo || "생활용품";
      const fallbackResults = generateDemoFallbackTrends(cat, catKo);
      res.json({
        results: fallbackResults,
        isDemoFallback: true,
        fallbackReason: error.message || "Quota Exceeded"
      });
    } catch (fallbackErr) {
      res.status(500).json({ error: error.message || "Failed to discover real-time trends" });
    }
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
    try {
      console.warn("Attempting demo fallback script due to Gemini API failure...");
      const { url, description, tone, duration, category } = req.body;
      const parsedDuration = parseInt(duration, 10) || 30;
      const fallbackScript = generateDemoFallbackScript(
        url || "",
        description || "",
        tone || "",
        parsedDuration,
        category || "household"
      );
      res.json(fallbackScript);
    } catch (fallbackErr) {
      res.status(500).json({ error: error.message || "Failed to analyze product and generate script" });
    }
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
// Demo Fallback Generators for Quota Exceeded (429) & Off-line Robustness
// -------------------------------------------------------------------------
function generateDemoFallbackTrends(category: string, categoryKo: string) {
  const mockTrendsByCategory: Record<string, any[]> = {
    household: [
      {
        name: "원터치 강력 자석 도어스톱",
        reason: "허리를 굽힐 필요 없이 발가락 터치 한 번으로 문을 안전하게 고정하고 벽 흠집을 예방하여 완벽한 삶의 질 향상을 선사함",
        hook: "아직도 도어스톱 고정할 때 허리 굽히세요? 이제 발끝 하나로 신세계 경험해보세요!",
        score: 95,
        query: "자석 도어스톱 원터치"
      },
      {
        name: "접이식 틈새 문걸이 옷걸이 행거",
        reason: "문고리에 1초 만에 간편히 거치하여 공간 활용도를 극대화하고, 미사용 시 자석 밀착으로 깔끔히 접어 보이지 않게 보관 가능",
        hook: "문 뒤 틈새 공간 200% 활용하기! 1초 설치 끝판왕 미니 접이식 행거!",
        score: 91,
        query: "접이식 문걸이 행거"
      },
      {
        name: "미세먼지 완벽차단 창문 필터 방충망",
        reason: "자연환기는 원하면서 유해물질이나 미세먼지는 걸러주는 특허 나노 필터로 현대 자취생 필수 아이템",
        hook: "방 안 먼지 쌓이는 거 지겨우시죠? 미세먼지만 걸러내는 신기한 필터망!",
        score: 88,
        query: "창문 먼지 필터 방충망"
      }
    ],
    kitchen: [
      {
        name: "실리콘 문어발 싱크대 물막이 워터가드",
        reason: "설거지 시 허리나 배 부분에 물이 사방으로 튀는 것을 원천 가드하며, 고온 열탕 소독으로 매일 새것처럼 위생적 사용 가능",
        hook: "설거지 끝나면 항상 배 부분이 젖어있나요? 이거 하나면 물 튐 스트레스 끝!",
        score: 94,
        query: "실리콘 싱크대 물막이"
      },
      {
        name: "3초 완성 드럼 회전식 만능 슬라이서 채칼",
        reason: "손가락 벨 일 전혀 없는 안전 커버 형태에 칼질 필요 없이 손잡이 회전만으로 순식간에 대량 채썰기와 얇은 슬라이스 완성",
        hook: "양파나 마늘 채썰다 손 벨까 봐 무서우셨죠? 3초 만에 썰리는 드럼 채칼!",
        score: 92,
        query: "회전식 만능 슬라이서 채칼"
      },
      {
        name: "기름 때 철벽 방어 오일 가드 가림막",
        reason: "고기 구울 때 사방으로 기름 튀는 가스레인지 벽면과 타일을 스테인리스 삼면 가드로 깔끔하게 보호",
        hook: "삼겹살 굽고 주방 청소하는 거 질리시죠? 기름 튐 완벽 방패 가림막!",
        score: 89,
        query: "가스레인지 기름 가림막"
      }
    ],
    toys: [
      {
        name: "인공지능 비행 플라이 스피너 부메랑 볼",
        reason: "손에서 던지면 공중에서 신기하게 회전하며 부메랑처럼 스스로 돌아오는 LED 비행 장난감으로 어린이 및 성인 숏폼 대유행",
        hook: "던지면 알아서 되돌아오는 마법의 공? 요즘 인싸들 필수 비행 볼!",
        score: 96,
        query: "LED 플라이 스피너 볼"
      },
      {
        name: "스마트 감성 픽셀 아트 블루투스 스피커",
        reason: "레트로 오락실 풍 고품질 스피커에 자신이 직접 그린 픽셀 애니메이션을 시각화해 인테리어 감성 소품으로 극찬",
        hook: "데스크테리어의 끝판왕! 내 맘대로 픽셀 아트를 넣는 감성 스피커!",
        score: 90,
        query: "픽셀 아트 블루투스 스피커"
      }
    ],
    car: [
      {
        name: "차량용 2in1 초강력 무선 송풍 에어건 청소기",
        reason: "시트 틈새 먼지 강력 흡입은 기본, 세차 후 구석의 물기를 쏴주는 강력한 송풍 블로워 기능까지 탑재된 만능 세차 아이템",
        hook: "세차장 동전 낭비 끝! 먼지 흡입과 바람 불어내기를 동시에 하는 세차 에어건!",
        score: 93,
        query: "차량용 무선 에어건 청소기"
      }
    ]
  };

  const defaultTrends = [
    {
      name: `대세 숏폼 추천 ${categoryKo} 아이템`,
      reason: `최근 숏폼 플랫폼 상위권 조회수를 기록하며 직관적 비주얼과 극강의 편의성으로 구매 전환율이 높은 트렌드`,
      hook: `🚨 이거 요즘 SNS에서 진짜 난리 났는데 이유가 다 있었습니다!`,
      score: 90,
      query: `${categoryKo} 숏폼 꿀템`
    }
  ];

  return mockTrendsByCategory[category] || defaultTrends;
}

function generateDemoFallbackScript(
  url: string,
  description: string,
  tone: string,
  duration: number,
  category: string
) {
  let prodName = "트렌드 숏폼 추천 상품";
  if (description && description.trim().length > 0) {
    const lines = description.split("\n");
    if (lines[0].length < 30) {
      prodName = lines[0].trim();
    } else {
      prodName = description.substring(0, 20).trim() + "...";
    }
  } else if (url) {
    try {
      const u = new URL(url);
      prodName = u.hostname.replace("www.", "") + " 추천 상품";
    } catch {
      prodName = "링크 입력 상품";
    }
  }

  let keySellingPoints = [
    "비주얼과 실용성을 극대화한 SNS 대란 꿀템",
    "번거로운 과정 없이 1초 만에 조작 가능한 편리성",
    "독보적인 내구성과 깔끔한 일체형 디자인"
  ];
  if (description) {
    const words = description.split(/\s+/).filter(w => w.length >= 2);
    if (words.length >= 3) {
      keySellingPoints = [
        `초고속 숏폼 트렌드 반영: ${words[0] || "상품"} 중심의 최적 설계`,
        `실제 구매 리뷰가 증명하는 뛰어난 압도적 편의성`,
        `인테리어를 해치지 않는 깔끔하고 심플한 디자인`
      ];
    }
  }

  const targetAudience = "실용적이고 세련된 아이템을 좋아하는 2030 주부 및 1인 가구, 직장인";

  const hooks = [
    `🚨 이거 아직도 모르는 사람 없게 해주세요... 삶의 질 수직 상승템!`,
    `🤫 SNS에서 왜 난리인지 드디어 알아냈습니다. 이거 진짜 대박이에요.`,
    `💸 돈 낭비 그만하시고, 이거 하나로 매일 아침 스트레스 끝내세요!`,
    `🤔 남들은 다 편하게 살고 있는데, 나만 몰랐던 역대급 꿀템은?`
  ];

  const scripts = [
    {
      title: `${duration}초 직관소구형 대본 (핵심 중심)`,
      duration: `${duration}초`,
      scenes: [
        {
          sceneNumber: 1,
          visual: `${prodName}을 클로즈업하며 실제 작동하는 손동작을 빠르게 줌인 연출`,
          narration: `와, 이거 진짜 요물입니다! 아직도 이거 안 쓰는 분들 계신가요?`,
          durationSec: Math.max(3, Math.floor(duration * 0.15))
        },
        {
          sceneNumber: 2,
          visual: "사용하기 전의 답답하고 지저분한 비포(Before) 상황을 흑백으로 짧게 대조 연출",
          narration: `매일 이거 때문에 허리 굽히고 스트레스 받으셨던 분들 주목하세요!`,
          durationSec: Math.max(3, Math.floor(duration * 0.2))
        },
        {
          sceneNumber: 3,
          visual: "제품을 가볍게 조작하여 한 번에 완벽히 해결되는 애프터(After) 모습을 슬로우 모션으로 강조",
          narration: `이제는 그냥 한 번만 툭 대주면 끝입니다. 진짜 너무 간편하죠?`,
          durationSec: Math.max(4, Math.floor(duration * 0.25))
        },
        {
          sceneNumber: 4,
          visual: "제품의 견고한 마감이나 세련된 디자인을 자연스러운 햇살 아래에서 다각도로 노출",
          narration: `공간도 덜 차지하고 깔끔한 디자인이라 인테리어도 전혀 안 해쳐요!`,
          durationSec: Math.max(4, Math.floor(duration * 0.25))
        },
        {
          sceneNumber: 5,
          visual: "화면에 추천 검색 키워드 자막을 크게 띄우며 구독/좋아요 유도용 엔딩 카드 삽입",
          narration: `고민은 배송만 늦출 뿐! 댓글 창의 링크에서 최저가로 득템해보세요!`,
          durationSec: Math.max(3, Math.floor(duration * 0.15))
        }
      ]
    },
    {
      title: `${duration}초 문제해결/반전형 대본 (스토리 중심)`,
      duration: `${duration}초`,
      scenes: [
        {
          sceneNumber: 1,
          visual: "한숨을 푹 쉬며 이마를 짚는 불편한 일상 연출, 빨간색 엑스(X) 자막 강렬히 깜빡임",
          narration: `혹시 일상에서 매일 반복되는 이 귀찮음 때문에 지치진 않으셨나요?`,
          durationSec: Math.max(3, Math.floor(duration * 0.15))
        },
        {
          sceneNumber: 2,
          visual: "불편함을 참다 참다 폭발하는 유머러스한 비주얼 연출",
          narration: `저도 매번 참아가며 썼었는데, 결국 참다 못해 알아낸 역대급 해결책!`,
          durationSec: Math.max(4, Math.floor(duration * 0.2))
        },
        {
          sceneNumber: 3,
          visual: "후광 효과 그래픽과 함께 비밀 무기처럼 제품을 멋지게 꺼내 드는 연출",
          narration: `바로 이 ${prodName} 하나로 모든 스트레스가 싹 날아갔습니다!`,
          durationSec: Math.max(4, Math.floor(duration * 0.25))
        },
        {
          sceneNumber: 4,
          visual: "누구나 1초 만에 따라할 수 있는 간편하고 직관적인 설치/조작 장면을 2배속 재생",
          narration: `설치나 작동법도 너무 간단해서 누구나 바로 대만족하며 쓸 수 있어요.`,
          durationSec: Math.max(4, Math.floor(duration * 0.25))
        },
        {
          sceneNumber: 5,
          visual: "엄지손가락을 치켜세우는 리액션과 함께 숏폼 채널 구독 유도 비주얼 템플릿",
          narration: `더 늦기 전에 검색해보고 내 소중한 시간과 노동력을 아껴보세요!`,
          durationSec: Math.max(3, Math.floor(duration * 0.15))
        }
      ]
    },
    {
      title: `${duration}초 리뷰/스토리형 대본 (소비자 관점)`,
      duration: `${duration}초`,
      scenes: [
        {
          sceneNumber: 1,
          visual: "택배 상자를 신나게 뜯으며 제품의 날것 그대로의 실물 디자인을 빠르게 보여줌",
          narration: `내돈내산 찐후기! 광고에 하도 속아서 직접 사봤는데 진짜 물건입니다.`,
          durationSec: Math.max(3, Math.floor(duration * 0.15))
        },
        {
          sceneNumber: 2,
          visual: "실제 생활 속에서 자연스럽게 닳도록 사용하는 찐생활 밀착형 구도",
          narration: `처음엔 긴가민가했거든요? 근데 며칠 써보니까 왜 이제 샀나 후회만 됩니다.`,
          durationSec: Math.max(4, Math.floor(duration * 0.2))
        },
        {
          sceneNumber: 3,
          visual: "가장 만족스러운 특정 핵심 기능을 근접 접사로 선명하게 촬영하여 디테일 노출",
          narration: `특히 이 부분이 진짜 튼튼하고 부드럽게 작동해서 만족감이 최고예요!`,
          durationSec: Math.max(4, Math.floor(duration * 0.25))
        },
        {
          sceneNumber: 4,
          visual: "제품을 만족스럽게 닦거나 소중하게 보관하며 웃음 짓는 힐링 감성의 오버레이 자막",
          narration: `주변 소중한 지인들에게 선물용으로 돌려도 다들 극찬할 퀄리티입니다.`,
          durationSec: Math.max(4, Math.floor(duration * 0.25))
        },
        {
          sceneNumber: 5,
          visual: "댓글 링크 주소 가리키는 고정 그래픽과 스마일 이모티콘 팝업",
          narration: `자세한 최저가 정보는 지금 바로 고정 댓글에서 확인하실 수 있습니다!`,
          durationSec: Math.max(3, Math.floor(duration * 0.15))
        }
      ]
    }
  ];

  scripts.forEach((script) => {
    let sum = script.scenes.reduce((acc, scene) => acc + scene.durationSec, 0);
    const diff = duration - sum;
    if (diff !== 0) {
      script.scenes[2].durationSec += diff;
    }
  });

  const tips = [
    "⚡ 초반 3초 후킹 시점에 속도감 있는 트랜지션(빠른 화면 전환)을 사용하여 이탈율을 최소화하세요.",
    "🎵 배경음악(BGM)은 너무 무겁지 않은, 경쾌하고 현대적인 Lo-Fi 비트나 업템포 팝송을 추천합니다.",
    "💬 자막은 검은색 테두리에 노란색/흰색 볼드 고대비를 주어 한눈에 읽히도록 배치하세요."
  ];

  return {
    productName: prodName,
    keySellingPoints,
    targetAudience,
    hooks,
    scripts,
    tips,
    isDemoFallback: true
  };
}

// -------------------------------------------------------------------------
// Serve Static Assets & SPA Handling (Local or container environments only)
// -------------------------------------------------------------------------
if (!process.env.NETLIFY) {
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
}
