import React, { useState, useEffect, useRef } from "react";
import { 
  ScriptSet, 
  AnalysisResult 
} from "../types";
import { 
  Sparkles, 
  Upload, 
  Link, 
  FileText, 
  Volume2, 
  VolumeX, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Pause, 
  RotateCcw, 
  Tag, 
  Target, 
  Info, 
  CheckCircle,
  HelpCircle,
  Video,
  Clapperboard,
  Tv,
  ArrowRight,
  Music,
  UserCheck,
  Zap,
  Image as ImageIcon,
  Loader2,
  Trash2
} from "lucide-react";

interface ScriptTabProps {
  preFilledName: string;
  preFilledDescription: string;
  onClearPreFilled: () => void;
}

const vrewVoices = [
  { id: "eunhee", label: "은희 (기본 여성, 친근한 대화)", gender: "female", pitch: 1.0, rateModifier: 1.0 },
  { id: "junwoo", label: "준우 (기본 남성, 차분한 정보)", gender: "male", pitch: 1.0, rateModifier: 1.0 },
  { id: "seoyeon", label: "서연 (부드러운 여성, 감성 힐링)", gender: "female", pitch: 0.95, rateModifier: 0.9 },
  { id: "minji", label: "민지 (통통 튀는 여성, 극강 하이텐션)", gender: "female", pitch: 1.15, rateModifier: 1.15 },
  { id: "jinwoo", label: "진우 (중후한 남성, 뉴스 리포터)", gender: "male", pitch: 0.85, rateModifier: 0.95 },
  { id: "haeun", label: "하은 (맑고 귀여운 여성, 아동 보이스)", gender: "female", pitch: 1.3, rateModifier: 1.05 }
];

export default function ScriptTab({ preFilledName, preFilledDescription, onClearPreFilled }: ScriptTabProps) {
  // Form states
  const [productNameInput, setProductNameInput] = useState<string>("");
  const [productUrl, setProductUrl] = useState<string>("");
  const [productDesc, setProductDesc] = useState<string>("");
  const [category, setCategory] = useState<string>("household");
  const [tone, setTone] = useState<string>("excited");
  const [scriptDuration, setScriptDuration] = useState<number>(30); // 10s - 60s
  const [selectedVoice, setSelectedVoice] = useState<string>("eunhee");
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0); // 1.0x - 2.0x
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);

  // Multimodal image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parent prefill hook
  useEffect(() => {
    if (preFilledName) {
      setProductNameInput(preFilledName);
      setProductDesc(preFilledDescription);
      onClearPreFilled(); // clear to let user edit freely
    }
  }, [preFilledName, preFilledDescription, onClearPreFilled]);

  // Loading/Generating states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const loadingSteps = [
    imageFile 
      ? "1. 첨부된 이미지 및 제품 소구점 정밀 분석 중..." 
      : "1. 입력한 정보 및 제품 소구점 정밀 분석 중...",
    "2. 경쟁 숏폼 동영상의 바이럴 성공 공식 결합 중...",
    "3. 이탈율 0%를 목표로 초반 3초 후킹 멘트 정밀 설계 중...",
    "4. 15초 직관형, 30초 문제해결형, 50초 찐후기 스토리 대본 창작 중...",
    "5. 영상 배경음악(BGM) 및 효과음 매칭 조언 작성 중..."
  ];

  // Analysis result states
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number>(0);

  // Copy states
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // TTS audio player states
  const [audioLoading, setAudioLoading] = useState<Record<string, boolean>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // Trigger loading step simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handle image drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const processImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Copy text helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 1500);
  };

  // Convert File to base64 helper
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle Form Submission / Analyze product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productNameInput.trim() && !productDesc.trim() && !imageFile) {
      alert("상품명, 설명 또는 이미지 중 하나 이상을 입력해주세요.");
      return;
    }

    try {
      setIsGenerating(true);
      setResult(null);
      setGenerationError(null);
      setIsQuotaExceeded(false);
      // Stop any playing audio
      stopAllAudio();
      setAudioUrls({});

      let imageBase64 = "";
      let imageMimeType = "";

      if (imageFile) {
        imageBase64 = await getBase64(imageFile);
        imageMimeType = imageFile.type;
      }

      // Format clean payload description
      const finalDesc = `${productNameInput ? `[상품명: ${productNameInput}] ` : ""}${productDesc}`;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: productUrl,
          description: finalDesc,
          category,
          tone,
          duration: scriptDuration,
          imageBase64,
          imageMimeType,
          voice: selectedVoice,
          speed: ttsSpeed
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setSelectedScriptIndex(0);
        setGenerationError(null);
        setIsQuotaExceeded(false);
      } else {
        const errData = await res.json();
        const errMsg = errData.error || "서버 통신에 실패했습니다.";
        const isQuota = errMsg.includes("429") || 
                        errMsg.toUpperCase().includes("QUOTA") || 
                        errMsg.toUpperCase().includes("RESOURCE_EXHAUSTED") || 
                        errMsg.toUpperCase().includes("LIMIT");
        setIsQuotaExceeded(isQuota);
        setGenerationError(errMsg);
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError("네트워크 통신 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Free TTS integration helper supporting Browser SpeechSynthesis and server-side fallback
  const handleTTSPlay = async (text: string, id: string) => {
    // If already playing this, toggle pause/play
    if (playingAudioId === id) {
      if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setPlayingAudioId(id);
        } else {
          window.speechSynthesis.pause();
          setPlayingAudioId(null);
        }
        return;
      }

      const currentAudio = audioRefs.current[id];
      if (currentAudio) {
        if (currentAudio.paused) {
          currentAudio.playbackRate = ttsSpeed;
          currentAudio.play();
          setPlayingAudioId(id);
        } else {
          currentAudio.pause();
          setPlayingAudioId(null);
        }
      }
      return;
    }

    // Stop any other currently playing audio
    stopAllAudio();

    const voiceConfig = vrewVoices.find((v) => v.id === selectedVoice) || vrewVoices[0];

    // Dual Engine Option 1: Browser SpeechSynthesis for dynamic custom pitch, speed, and real-time responsiveness
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        const cleanText = text
          .replace(/\[.*?\]/g, "") // Remove bracket instructions
          .replace(/[\n\r]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const koVoices = voices.filter((v) => v.lang.startsWith("ko") || v.lang.startsWith("KO"));

        let chosenVoice = koVoices[0] || null;
        if (koVoices.length > 0) {
          // Attempt to find a Korean voice closest to requested gender
          const genderVoice = koVoices.find((v) => {
            const name = v.name.toLowerCase();
            if (voiceConfig.gender === "male") {
              return name.includes("male") || name.includes("man") || name.includes("gildong") || name.includes("heami") === false;
            } else {
              return name.includes("female") || name.includes("woman") || name.includes("yuna") || name.includes("heami");
            }
          });
          if (genderVoice) chosenVoice = genderVoice;
        }

        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }

        // Apply Vrew emulation pitch & speed rate
        utterance.rate = ttsSpeed * voiceConfig.rateModifier;
        utterance.pitch = voiceConfig.pitch;

        utterance.onend = () => {
          setPlayingAudioId(null);
        };

        utterance.onerror = () => {
          setPlayingAudioId(null);
        };

        setPlayingAudioId(id);
        window.speechSynthesis.speak(utterance);
        return;
      } catch (speechErr) {
        console.warn("SpeechSynthesis failed, falling back to server TTS:", speechErr);
      }
    }

    // Dual Engine Option 2: Fallback server-side Google TTS with native HTML5 speed regulation
    if (audioUrls[id]) {
      const existingAudio = audioRefs.current[id];
      if (existingAudio) {
        existingAudio.playbackRate = ttsSpeed;
        existingAudio.currentTime = 0;
        existingAudio.play();
        setPlayingAudioId(id);
        return;
      }
    }

    // Otherwise, fetch TTS from Express server proxy
    try {
      setAudioLoading((prev) => ({ ...prev, [id]: true }));
      const cleanText = text
        .replace(/\[.*?\]/g, "") // Remove visual/narration bracket instructions
        .trim();

      const res = await fetch(`/api/tts?text=${encodeURIComponent(cleanText)}`);
      if (!res.ok) throw new Error("Failed to generate audio");

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      setAudioUrls((prev) => ({ ...prev, [id]: blobUrl }));

      const audio = new Audio(blobUrl);
      audioRefs.current[id] = audio;
      audio.playbackRate = ttsSpeed;

      audio.onended = () => {
        setPlayingAudioId(null);
      };

      audio.play();
      setPlayingAudioId(id);
    } catch (err) {
      console.error("TTS generation error:", err);
      alert("무료 TTS 오디오를 받아오는 도중 오류가 발생했습니다.");
    } finally {
      setAudioLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const stopAllAudio = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    Object.keys(audioRefs.current).forEach((key) => {
      const audio = audioRefs.current[key];
      if (audio) {
        audio.pause();
      }
    });
    setPlayingAudioId(null);
  };

  // Trigger browser download of TTS MP3
  const handleTTSDownload = async (text: string, title: string) => {
    try {
      const cleanText = text.replace(/\[.*?\]/g, "").trim();
      const downloadUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${title.replace(/\s+/g, "_")}_더빙.mp3`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("MP3 음성파일 다운로드에 실패했습니다.");
    }
  };

  // Combine full narration sentences for a script
  const getFullScriptText = (script: ScriptSet) => {
    return script.scenes.map((s) => s.narration).join(" ");
  };

  // Clean layout helper
  const categoriesList = [
    { id: "household", label: "🏠 생활용품" },
    { id: "kitchen", label: "🍳 주방용품" },
    { id: "toys", label: "🎮 장난감/취미" },
    { id: "car", label: "🚗 차량용품" },
    { id: "electronics", label: "🔌 생활가전/IT" },
    { id: "beauty", label: "💅 화장품/뷰티" }
  ];

  const tonesList = [
    { id: "excited", label: "🔥 톡톡 튀고 신나는 하이텐션 톤" },
    { id: "professional", label: "👩‍💼 전문적이고 신뢰감 높은 리뷰 톤" },
    { id: "humorous", label: "🤪 병맛 가득하고 재미있는 유머 톤" },
    { id: "calm", label: "🍃 차분하고 나긋나긋한 힐링 감성 톤" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT COLUMN: Input Form (lg:span-5) */}
      <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-150">
          <Sparkles className="w-5 h-5 text-rose-500" />
          <h3 className="font-black text-slate-950 text-base">
            AI 쇼츠 대본 크리에이터
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 font-sans">
          {/* Product Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span>상품명 <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-slate-400 font-medium">정확할수록 좋습니다.</span>
            </label>
            <input
              type="text"
              value={productNameInput}
              onChange={(e) => setProductNameInput(e.target.value)}
              placeholder="예: 실리콘 싱크대 물막이, 차량용 무선 에어건"
              className="w-full px-4 py-3 text-sm bg-slate-50 border-none rounded-2xl outline-none ring-2 ring-transparent focus:ring-rose-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          {/* Product URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Link className="w-3 h-3 text-slate-400" />
                <span>상품 상세 주소 (URL)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">선택 사항</span>
            </label>
            <input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="쿠팡, 네이버 스마트스토어, 알리 등 링크를 복사해 넣으세요."
              className="w-full px-4 py-3 text-sm bg-slate-50 border-none rounded-2xl outline-none ring-2 ring-transparent focus:ring-rose-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          {/* Product Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>상품 특징 및 핵심 소구점</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">상세할수록 고품질 대본 생성</span>
            </label>
            <textarea
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              rows={4}
              placeholder="제품의 강점, 사용 시의 편리함, 가격, 타겟층 등을 편하게 작성해주세요. 공란인 경우, 상품명 기반으로 AI가 가상으로 기획합니다."
              className="w-full px-4 py-3 text-sm bg-slate-50 border-none rounded-2xl outline-none ring-2 ring-transparent focus:ring-rose-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 resize-y font-medium"
            ></textarea>
          </div>

          {/* Category selection selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700">카테고리 분류</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {categoriesList.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                    category === cat.id
                      ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Tone and Manner Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700">더빙 및 대본 나레이션 톤</label>
            <div className="space-y-2 text-xs">
              {tonesList.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`w-full p-3 rounded-xl border text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                    tone === t.id
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-200"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{t.label}</span>
                  {tone === t.id && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </button>
              ))}
            </div>
          </div>

          {/* Multimodal Image Drag & Drop file uploader */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span>상품 실물/웹 캡쳐 이미지 업로드</span>
              <span className="text-[10px] text-slate-400 font-medium">선택 사항</span>
            </label>
            
            {imagePreview ? (
              <div className="relative border border-slate-200 rounded-2xl p-2.5 bg-slate-50 flex items-center gap-3">
                <img 
                  src={imagePreview} 
                  alt="Product preview" 
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">{imageFile?.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{(imageFile?.size ? imageFile.size / 1024 : 0).toFixed(1)} KB / 이미지 첨부 완료</p>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                  title="이미지 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? "border-rose-500 bg-rose-50/40" 
                    : "border-slate-250 bg-slate-50/50 hover:bg-rose-50/10 hover:border-rose-400"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <Upload className="w-6 h-6 mx-auto text-rose-400 mb-2" />
                <p className="text-xs font-black text-slate-700">상품 사진을 드래그하거나 클릭하여 추가</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">AI가 이미지를 시각적으로 파악하여 디테일한 비주얼 연출을 추천합니다.</p>
              </div>
            )}
          </div>

          {/* Script Duration Slider */}
          <div className="space-y-2 bg-slate-50 border border-slate-200/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>희망 대본 목표 길이 (재생 시간)</span>
              </label>
              <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                {scriptDuration}초 내외
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={scriptDuration}
              onChange={(e) => setScriptDuration(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold px-0.5">
              <span>10초 (단축형)</span>
              <span>30초 (표준형)</span>
              <span>60초 (스토리형)</span>
            </div>
          </div>

          {/* Form Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-4 px-6 rounded-2xl text-white font-black bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-rose-200 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>AI 맞춤형 쇼츠 기획 및 대본 작성</span>
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: Loading or Output Results (lg:span-7) */}
      <div className="lg:col-span-7 space-y-6">
        
        {generationError && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-3xl p-5 shadow-xs space-y-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-rose-500 text-white rounded-xl shrink-0 shadow-sm shadow-rose-200">
                <VolumeX className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-rose-950 text-sm">AI 생성 및 분석에 실패했습니다</h4>
                <p className="text-[10px] text-rose-700 font-bold mt-0.5">
                  {isQuotaExceeded ? "무료 AI 하루 할당량(20회) 한도 초과" : "네트워크 또는 서버 일시적 오류"}
                </p>
              </div>
            </div>
            
            <div className="text-xs text-rose-800 leading-relaxed font-medium space-y-2">
              {isQuotaExceeded ? (
                <>
                  <p>
                    구글 Gemini API의 무료 일일 한도를 초과했습니다. AI Studio의 무료 요금제는 하루 최대 20개의 요청만 가능합니다.
                  </p>
                  <p className="bg-white/80 p-3 rounded-xl border border-rose-100 text-[11px] text-slate-700">
                    💡 <strong>해결 방법:</strong> 우측 상단의 <strong>Settings &gt; Secrets</strong> 메뉴에서 전용 <code>GEMINI_API_KEY</code>를 발급받아 등록하거나, 구글 클라우드 빌링을 등록해 한도를 늘릴 수 있습니다.
                  </p>
                </>
              ) : (
                <p>{generationError}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleSubmit(new Event("submit") as any)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-rose-200 transition-all hover:scale-[1.01]"
              >
                다시 시도하기
              </button>
            </div>
          </div>
        )}

        {/* Scenario 1: Initial Empty Welcome State */}
        {!isGenerating && !result && (
          <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-5 py-16 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto text-rose-500 border border-rose-100 shadow-sm shadow-rose-100">
              <Clapperboard className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-lg">대본이 아직 생성되지 않았습니다</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                좌측 폼에 상품 정보를 입력하시거나, &apos;인기 트렌드 분석&apos; 탭에서 관심 있는 상품을 선택하여 즉시 쇼츠 기획안을 만들어보세요.
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 text-left space-y-3 max-w-md mx-auto">
              <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-rose-500" />
                <span>제작 도우미 꿀팁 가이드</span>
              </h5>
              <div className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed font-medium">
                <p>💡 실물 사진이나 캡쳐 이미지를 같이 업로드하면, AI가 제품 디자인을 완벽히 인식하여 극적인 연출 가이드를 묘사해 줍니다.</p>
                <p>🔊 무료 TTS 음성이 한 번에 생성되며, 완성된 음성 파일은 **MP3 형식으로 개별/전체 다운로드**가 가능합니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* Scenario 2: Processing / Generating State */}
        {isGenerating && (
          <div className="bg-white text-slate-800 border border-slate-100 rounded-3xl p-8 py-16 text-center space-y-6 shadow-xl">
            <div className="relative flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-rose-50">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-lg text-slate-950">AI 쇼츠 기획 대본 세트 작성 중</h4>
              <p className="text-xs text-rose-600 font-bold h-5 animate-pulse">
                {loadingSteps[loadingStep]}
              </p>
            </div>

            <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-5 border border-slate-200/60 text-left space-y-2.5">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block">💡 쇼츠 바이럴 상식</span>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                유튜브 쇼츠에서 시청자가 이탈하는 가장 핵심 구간은 **최초 1.5초 ~ 3초** 사이입니다. AI는 이 구간의 시청 유지를 위해 자극적인 의문을 제기하는 후킹 설계를 자동으로 기획하고 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* Scenario 3: Completed Script Dashboard Results */}
        {!isGenerating && result && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header info / analysis card */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-black uppercase tracking-wider block w-max mb-1">
                    AI 분석 결과
                  </span>
                  <h3 className="font-black text-slate-950 text-xl tracking-tight">
                    {result.productName}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-100">
                  <Target className="w-4 h-4 text-rose-500" />
                  <span>핵심 타겟: </span>
                  <span className="font-black">{result.targetAudience}</span>
                </div>
              </div>

              {/* Selling points tag list */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-800 block">🎯 세일즈 강점 (소구점)</span>
                <div className="flex flex-wrap gap-2">
                  {result.keySellingPoints.map((point, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100"
                    >
                      <Tag className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{point}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Hook recommendation phrases */}
            <div className="bg-rose-50 text-slate-800 rounded-3xl p-5 border border-rose-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-current" />
                <h4 className="font-black text-sm text-rose-800">초반 이탈 방지! 추천 3초 후킹 멘트</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.hooks.map((hook, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white border border-rose-150 rounded-2xl p-3.5 relative flex items-start justify-between gap-3 group hover:border-rose-400 transition-all shadow-xs"
                  >
                    <div className="space-y-1 pr-6">
                      <span className="text-[9px] font-mono font-black text-amber-600 block">TYPE 0{idx + 1}</span>
                      <p className="text-xs font-black text-slate-800 leading-relaxed">&quot;{hook}&quot;</p>
                    </div>
                    
                    <button
                      onClick={() => handleCopy(hook, `hook-${idx}`)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors shrink-0 absolute top-2.5 right-2.5 cursor-pointer"
                      title="멘트 복사"
                    >
                      {copiedTextId === `hook-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Script variations sub tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-slate-900">🎬 완성된 쇼츠 기획 대본</h4>
                <span className="text-xs text-slate-500 font-medium">각 컨셉에 맞추어 씬별로 편집 방향을 제시합니다.</span>
              </div>

              {/* Variation Selectors */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
                {result.scripts.map((script, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      stopAllAudio();
                      setSelectedScriptIndex(idx);
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      selectedScriptIndex === idx
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    {script.title} ({script.duration})
                  </button>
                ))}
              </div>

              {/* Active Script Panel */}
              {result.scripts[selectedScriptIndex] && (
                <div className="space-y-4">
                  {/* TTS Voice & Speed Configuration Panel */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Voice Model Selector */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-rose-500" />
                          <span>Vrew 무료 성우 모델 선택</span>
                        </label>
                        <select
                          value={selectedVoice}
                          onChange={(e) => {
                            stopAllAudio();
                            setSelectedVoice(e.target.value);
                          }}
                          className="w-full px-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-700 font-bold"
                        >
                          {vrewVoices.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Speed Selector */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                            <span>TTS 말하는 속도 조절</span>
                          </label>
                          <span className="text-[11px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {ttsSpeed.toFixed(1)}배속
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1.0"
                          max="2.0"
                          step="0.1"
                          value={ttsSpeed}
                          onChange={(e) => {
                            const speed = parseFloat(e.target.value);
                            setTtsSpeed(speed);
                            // Dynamically apply speed to currently playing audio if any
                            if (playingAudioId) {
                              const audio = audioRefs.current[playingAudioId];
                              if (audio) {
                                audio.playbackRate = speed;
                              }
                            }
                          }}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                        />
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                          <span>1.0x (일반 배속)</span>
                          <span>1.5x (빠른 배속)</span>
                          <span>2.0x (2배속)</span>
                        </div>
                      </div>
                    </div>

                    {/* Regenerate Button based on the chosen voice and speed (Requirement 1) */}
                    <div className="pt-3 border-t border-slate-200/50">
                      <button
                        onClick={(e) => handleSubmit(e)}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-black text-xs rounded-xl cursor-pointer shadow-md shadow-rose-200 transition-all hover:scale-[1.01]"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>대본 새로 생성하는 중...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                            <span>지정 성우/속도로 대본 새로 생성하기</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* TTS & Copy panel for active script */}
                  <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-rose-500 text-white rounded-xl shrink-0 shadow-sm shadow-rose-200">
                        <Volume2 className="w-5 h-5" />
                      </span>
                      <div>
                        <p className="text-xs font-black text-rose-950">성우 오디오 파일 한 번에 생성하기</p>
                        <p className="text-[10px] text-rose-700/80 font-bold font-sans">대본 전체 나레이션을 선택한 성우의 목소리로 한눈에 모니터링 하세요.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                      {/* 1. 생성된 더빙 듣기 버튼 (Requirement 2) */}
                      <button
                        onClick={() => {
                          const id = `full-${selectedScriptIndex}`;
                          const text = getFullScriptText(result.scripts[selectedScriptIndex]);
                          handleTTSPlay(text, id);
                        }}
                        disabled={audioLoading[`full-${selectedScriptIndex}`]}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          playingAudioId === `full-${selectedScriptIndex}`
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 animate-pulse"
                            : "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200"
                        }`}
                      >
                        {audioLoading[`full-${selectedScriptIndex}`] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>생성된 더빙 듣기</span>
                      </button>

                      {/* 2. 멈추기 버튼 (Requirement 2) */}
                      <button
                        onClick={() => stopAllAudio()}
                        disabled={playingAudioId !== `full-${selectedScriptIndex}`}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          playingAudioId === `full-${selectedScriptIndex}`
                            ? "bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>멈추기</span>
                      </button>

                      {/* Download MP3 */}
                      <button
                        onClick={() => handleTTSDownload(getFullScriptText(result.scripts[selectedScriptIndex]), `${result.productName}_${result.scripts[selectedScriptIndex].title}`)}
                        className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
                        title="전체 MP3 파일 다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCopy(getFullScriptText(result.scripts[selectedScriptIndex]), `fullcopy-${selectedScriptIndex}`)}
                        className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
                        title="대본 텍스트 전체 복사"
                      >
                        {copiedTextId === `fullcopy-${selectedScriptIndex}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Scene-by-scene script cards */}
                  <div className="space-y-3 font-sans">
                    {result.scripts[selectedScriptIndex].scenes.map((scene) => {
                      const sceneId = `scene-${selectedScriptIndex}-${scene.sceneNumber}`;
                      return (
                        <div 
                          key={scene.sceneNumber} 
                          className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-12 hover:border-rose-200 transition-all"
                        >
                          {/* Left visual director part (md:span-5) */}
                          <div className="md:col-span-5 bg-slate-50/50 p-4 border-b md:border-b-0 md:border-r border-slate-250/60 flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-mono bg-slate-200 text-slate-800 shadow-xs">
                                SCENE 0{scene.sceneNumber}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 font-mono ml-2">예상 시간: {scene.durationSec}초</span>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-rose-600 uppercase tracking-wide block">🎬 추천 연출 / 비주얼</span>
                              <p className="text-xs text-slate-700 leading-relaxed font-bold">
                                {scene.visual}
                              </p>
                            </div>
                          </div>

                          {/* Right narration / text part (md:span-7) */}
                          <div className="md:col-span-7 p-4 flex flex-col justify-between gap-4">
                            <div className="space-y-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">🔊 나레이션 성우 멘트 및 자막</span>
                              <p className="text-sm font-bold text-slate-900 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl border-l-4 border-rose-500">
                                {scene.narration}
                              </p>
                            </div>

                            {/* TTS for single scene */}
                            <div className="flex items-center justify-end gap-2 text-xs">
                              <button
                                onClick={() => handleTTSPlay(scene.narration, sceneId)}
                                disabled={audioLoading[sceneId]}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all border cursor-pointer ${
                                  playingAudioId === sceneId
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs"
                                }`}
                              >
                                {audioLoading[sceneId] ? (
                                  <Loader2 className="w-3 animate-spin" />
                                ) : playingAudioId === sceneId ? (
                                  <Pause className="w-3 h-3 fill-current" />
                                ) : (
                                  <Volume2 className="w-3 h-3 text-rose-500" />
                                )}
                                <span>이 씬 더빙 듣기</span>
                              </button>

                              <button
                                onClick={() => handleTTSDownload(scene.narration, `${result.productName}_S${scene.sceneNumber}`)}
                                className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-all border border-slate-200 cursor-pointer shadow-xs"
                                title="이 씬 오디오 다운로드"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleCopy(scene.narration, sceneId)}
                                className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-all border border-slate-200 cursor-pointer shadow-xs"
                                title="씬 복사"
                              >
                                {copiedTextId === sceneId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* BGM / SFX Tips Guidance Card */}
            {result.tips && result.tips.length > 0 && (
              <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3.5 font-sans">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-150">
                  <Music className="w-4 h-4 text-amber-600" />
                  <h4 className="font-black text-slate-900 text-sm">🎵 추천 영상 배경음악 및 연출 주의사항</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-700 leading-relaxed font-bold">
                  {result.tips.map((tip, index) => (
                    <p key={index} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-black select-none shrink-0">•</span>
                      <span>{tip}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
