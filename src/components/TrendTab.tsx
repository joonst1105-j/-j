import React, { useState, useEffect } from "react";
import { 
  TrendingVideo, 
  RealTimeTrendItem 
} from "../types";
import { 
  TrendingUp, 
  Video, 
  Search, 
  Sparkles, 
  ChevronRight, 
  Play, 
  Copy, 
  Check, 
  ShoppingBag, 
  AlertCircle,
  Eye,
  Flame,
  ArrowRight,
  RotateCw
} from "lucide-react";

interface TrendTabProps {
  onSelectProduct: (name: string, description: string) => void;
}

export default function TrendTab({ onSelectProduct }: TrendTabProps) {
  // 18 Expanded categories matching procedural backend DB
  const categories = [
    { id: "entertainment", label: "🎬 예능/유머" },
    { id: "recipe", label: "🍳 레시피/요리" },
    { id: "food", label: "🍔 맛집/푸드" },
    { id: "quotes", label: "📝 명언/동기부여" },
    { id: "sports", label: "⚽ 스포츠/운동" },
    { id: "politics", label: "⚖️ 정치/시사" },
    { id: "info", label: "💡 일상정보/꿀팁" },
    { id: "beauty", label: "💅 뷰티/패션" },
    { id: "tech", label: "🔌 테크/가전" },
    { id: "romance", label: "❤️ 연애/심리" },
    { id: "animals", label: "🐶 반려동물" },
    { id: "travel", label: "✈️ 여행/레저" },
    { id: "business", label: "📈 재테크/비즈니스" },
    { id: "humor", label: "🤪 유머/밈" },
    { id: "household", label: "🏠 생활용품" },
    { id: "kitchen", label: "🍽️ 주방용품" },
    { id: "toys", label: "🎮 장난감/취미" },
    { id: "car", label: "🚗 차량용품" }
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>("entertainment");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("realtime");
  const [refreshSeed, setRefreshSeed] = useState<number>(0);

  const [curatedTrends, setCuratedTrends] = useState<Record<string, TrendingVideo[]>>({});
  const [loadingCurated, setLoadingCurated] = useState<boolean>(true);
  
  // AI discovery states
  const [discoverLoading, setDiscoverLoading] = useState<boolean>(false);
  const [discoverStep, setDiscoverStep] = useState<string>("");
  const [aiDiscoverResults, setAiDiscoverResults] = useState<Record<string, RealTimeTrendItem[]>>({});
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [isDemoFallback, setIsDemoFallback] = useState<boolean>(false);

  // Selected video for the modal details
  const [selectedVideoDetail, setSelectedVideoDetail] = useState<TrendingVideo | null>(null);

  // Fetch curated trends from express server with filters and seed
  useEffect(() => {
    async function fetchCurated() {
      try {
        setLoadingCurated(true);
        const res = await fetch(
          `/api/trends?category=${selectedCategory}&platform=${selectedPlatform}&period=${selectedPeriod}&seed=${refreshSeed}`
        );
        if (res.ok) {
          const data = await res.json();
          setCuratedTrends(data.trends);
        }
      } catch (err) {
        console.error("Error fetching curated trends:", err);
      } finally {
        setLoadingCurated(false);
      }
    }
    fetchCurated();
  }, [selectedCategory, selectedPlatform, selectedPeriod, refreshSeed]);

  // AI discovery via Search Grounding
  const handleAiTrendDiscovery = async () => {
    const currentCategoryKo = categories.find(c => c.id === selectedCategory)?.label.split(" ")[1] || "생활";
    try {
      setDiscoverLoading(true);
      setDiscoverError(null);
      setIsQuotaExceeded(false);
      setIsDemoFallback(false);
      setDiscoverStep("1. 실시간 숏폼 트렌드 웹 데이터 수집 중...");
      
      // Simulate sub-steps with timeouts for UX
      const timer1 = setTimeout(() => {
        setDiscoverStep("2. 구글 검색 결과를 바탕으로 급상승 키워드 추출 중...");
      }, 1200);
      
      const timer2 = setTimeout(() => {
        setDiscoverStep("3. 틱톡/쇼츠 조회수 급증 상품 분석 및 연출안 정리 중...");
      }, 2500);

      const res = await fetch("/api/trends/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          category: selectedCategory,
          categoryKo: currentCategoryKo
        })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (res.ok) {
        const data = await res.json();
        setAiDiscoverResults(prev => ({
          ...prev,
          [selectedCategory]: data.results
        }));
        setIsDemoFallback(!!data.isDemoFallback);
        setDiscoverError(null);
        setIsQuotaExceeded(false);
      } else {
        const errData = await res.json();
        const errMsg = errData.error || "서버 오류";
        const isQuota = errMsg.includes("429") || 
                        errMsg.toUpperCase().includes("QUOTA") || 
                        errMsg.toUpperCase().includes("RESOURCE_EXHAUSTED") || 
                        errMsg.toUpperCase().includes("LIMIT");
        setIsQuotaExceeded(isQuota);
        setDiscoverError(errMsg);
      }
    } catch (err: any) {
      console.error(err);
      setDiscoverError("네트워크 통신 오류가 발생했습니다.");
    } finally {
      setDiscoverLoading(false);
      setDiscoverStep("");
    }
  };

  // Copy keyword to clipboard helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuery(id);
    setTimeout(() => setCopiedQuery(null), 1500);
  };

  const currentVideos = curatedTrends[selectedCategory] || [];
  const currentAiResults = aiDiscoverResults[selectedCategory] || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tab Navigation for categories */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* AI search grounding activator */}
        <button
          onClick={handleAiTrendDiscovery}
          disabled={discoverLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-black shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-200" />
          <span>{categories.find(c => c.id === selectedCategory)?.label.split(" ")[1]} 실시간 트렌드 AI 검색</span>
        </button>
      </div>

      {discoverError && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-3xl p-5 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-rose-500 text-white rounded-xl shrink-0 shadow-sm shadow-rose-200">
              <AlertCircle className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-rose-950 text-sm">트렌드 AI 검색에 실패했습니다</h4>
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
              <p>{discoverError}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAiTrendDiscovery}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-rose-200 transition-all hover:scale-[1.01]"
            >
              다시 시도하기
            </button>
          </div>
        </div>
      )}

      {/* Filters & Refresh Control Panel */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Platform Filter */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">플랫폼 필터</span>
            <div className="flex bg-white border border-slate-200 p-1 rounded-xl">
              {[
                { id: "All", label: "전체" },
                { id: "Shorts", label: "유튜브" },
                { id: "Reels", label: "인스타" },
                { id: "TikTok", label: "틱톡" }
              ].map((plat) => (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => setSelectedPlatform(plat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPlatform === plat.id
                      ? "bg-rose-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {plat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Period Filter */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">조회 기간</span>
            <div className="flex bg-white border border-slate-200 p-1 rounded-xl">
              {[
                { id: "realtime", label: "실시간" },
                { id: "daily", label: "일간" },
                { id: "weekly", label: "주간" },
                { id: "monthly", label: "월간" }
              ].map((per) => (
                <button
                  key={per.id}
                  type="button"
                  onClick={() => setSelectedPeriod(per.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === per.id
                      ? "bg-rose-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {per.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Refresh Action */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshSeed((prev) => prev + 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            title="새로고침"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingCurated ? "animate-spin text-rose-500" : ""}`} />
            <span>트렌드 새로고침</span>
          </button>
        </div>
      </div>

      {/* Loading state for AI Trend search */}
      {discoverLoading && (
        <div className="bg-white text-slate-800 rounded-3xl p-8 border border-slate-100 text-center space-y-4 shadow-xl">
          <div className="relative flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-rose-50">
            <Flame className="w-8 h-8 text-rose-500 pulse-animation" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-slate-950">Gemini AI가 실시간 급상승 아이템 수집 중</h3>
            <p className="text-xs text-rose-600 font-bold animate-pulse">{discoverStep}</p>
          </div>
          <div className="max-w-xs mx-auto bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-amber-500 h-1.5 rounded-full animate-loading-bar" style={{ width: "80%", transition: "width 2s ease" }}></div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">실시간 구글 검색 API 연동으로, 숏폼에서 바이럴 타기 좋은 핫템을 서칭합니다.</p>
        </div>
      )}

      {/* AI Discovery results Section */}
      {!discoverLoading && currentAiResults.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-6 shadow-md">
          {isDemoFallback && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs space-y-3 animate-fade-in mb-4">
              <div className="flex items-start gap-3">
                <span className="p-2 bg-amber-500 text-white rounded-xl shrink-0 shadow-sm shadow-amber-200">
                  <AlertCircle className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-amber-950 text-sm">데모 모드(지능형 시뮬레이션) 작동 안내</h4>
                  <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                    구글 Gemini 무료 API 호출 한도 초과로 자동 전환되었습니다.
                  </p>
                </div>
              </div>
              <div className="text-xs text-amber-900 leading-relaxed font-medium">
                <p>
                  현재 무료 계정의 일일 호출 한도가 초과되어, 트렌드 분석이 원활히 이어질 수 있도록 <strong>지능형 로컬 트렌드 시뮬레이터</strong>가 해당 카테고리의 핫 아이템을 대신 정리했습니다.
                </p>
                <p className="mt-2 bg-white/80 p-3 rounded-xl border border-amber-100 text-[11px] text-slate-700">
                  💡 <strong>완전 해결 방법:</strong> 우측 상단의 <strong>Settings &gt; Secrets</strong> 메뉴에서 나만의 <code>GEMINI_API_KEY</code>를 발급받아 등록하면 실시간 AI 분석 서비스를 중단 없이 이용하실 수 있습니다.
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                   실시간 AI 추천 트렌드 (구글 검색 기반)
                </h3>
                <p className="text-xs text-slate-500 font-medium">숏폼 플랫폼에서 언급량이 급증한 최근 트렌드 아이템입니다.</p>
              </div>
            </div>
            <button 
              onClick={() => setAiDiscoverResults(prev => ({ ...prev, [selectedCategory]: [] }))}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              결과 지우기
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {currentAiResults.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-rose-400 hover:bg-white transition-all flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-mono font-black">
                      ITEM 0{idx + 1}
                    </span>
                    <span className="flex items-center gap-1 text-amber-500 text-xs font-black">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>대박지수 {item.score}%</span>
                    </span>
                  </div>

                  <h4 className="font-black text-slate-900 text-base font-display">{item.name}</h4>
                  
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold text-rose-600 block">💡 바이럴 요인</span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-100 p-2.5 rounded-xl">
                      {item.reason}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-extrabold text-amber-600 block">🔥 추천 후킹</span>
                    <p className="text-xs italic text-slate-700 font-bold bg-amber-50/50 p-2.5 rounded-xl border-l-2 border-amber-500">
                      &quot;{item.hook}&quot;
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>쇼핑 검색어: </span>
                    <button
                      onClick={() => handleCopyText(item.query, `ai-${idx}`)}
                      className="flex items-center gap-1 hover:text-slate-900 transition-colors bg-white border border-slate-200 px-2.5 py-1 rounded-lg"
                    >
                      <span className="font-bold text-slate-700">{item.query}</span>
                      {copiedQuery === `ai-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectProduct(item.name, `${item.name}은(는) 최근 SNS 및 숏폼에서 바이럴 중인 아이템입니다. 특징: ${item.reason}`)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-black text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md shadow-rose-200 transition-all cursor-pointer"
                  >
                    <span>이 상품으로 즉시 대본 쓰기</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curated Videos Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rose-500" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              실시간 인기 급상승 리포트 ({currentVideos.length}개)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100 shadow-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] uppercase font-black text-green-600 tracking-widest">LIVE</span>
          </div>
        </div>

        {loadingCurated ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-3xl h-80"></div>
            ))}
          </div>
        ) : currentVideos.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl text-slate-500 space-y-2 border border-slate-150">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm">해당 카테고리의 트렌드 데이터가 비어 있습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {currentVideos.map((video) => (
              <div 
                key={video.id} 
                className="bg-white rounded-3xl border border-slate-200/60 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Visual Thumbnail Frame with icon */}
                <div className="relative aspect-[9/16] bg-slate-950 flex items-center justify-center overflow-hidden group">
                  {video.thumbnail?.startsWith("http") ? (
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-8xl select-none group-hover:scale-110 transition-transform duration-300">
                      {video.thumbnail}
                    </span>
                  )}
                  {/* Backdrop tint */}
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/45 transition-colors"></div>
                  
                  {/* Platforms indicator badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm ${
                      video.platform === "Shorts" ? "bg-red-600" :
                      video.platform === "TikTok" ? "bg-black border border-slate-800" : "bg-gradient-to-r from-purple-600 to-pink-500"
                    }`}>
                      {video.platform}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-xs flex items-center gap-1">
                      <Eye className="w-3 h-3 text-rose-400" />
                      {video.views}
                    </span>
                  </div>

                  {/* Play Trigger */}
                  <button 
                    onClick={() => setSelectedVideoDetail(video)}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white text-rose-500 hover:bg-rose-600 hover:text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 opacity-90 group-hover:opacity-100 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>

                  {/* Bottom title layer overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-8">
                    <p className="text-[11px] text-slate-300 font-bold mb-1">@{video.creator}</p>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-relaxed">
                      {video.title}
                    </h4>
                  </div>
                </div>

                {/* Content description area */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900">{video.productName}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">ID: {video.id}</span>
                    </div>
                    {/* Points lists */}
                    <div className="space-y-1">
                      {video.points.slice(0, 2).map((pt, index) => (
                        <p key={index} className="text-xs text-slate-600 flex items-start gap-1 font-medium">
                          <span className="text-rose-500 font-bold">✔</span>
                          <span className="line-clamp-1">{pt}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-150 space-y-2">
                    {/* Search Copy trigger */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                      <span className="truncate max-w-[120px] font-semibold">🔍 {video.searchQuery}</span>
                      <button 
                        onClick={() => handleCopyText(video.searchQuery, video.id)}
                        className="hover:text-slate-900 text-slate-400 hover:scale-105 transition-all cursor-pointer"
                      >
                        {copiedQuery === video.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedVideoDetail(video)}
                        className="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-center transition-colors cursor-pointer"
                      >
                        분석 리포트
                      </button>
                      <button
                        onClick={() => onSelectProduct(video.productName, `${video.productName} 상세설명: 1. ${video.points[0]} 2. ${video.points[1]} 3. ${video.points[2] || ""}`)}
                        className="w-full py-2.5 text-xs font-black text-white bg-rose-500 hover:bg-rose-600 rounded-xl text-center transition-all shadow-sm shadow-rose-100 cursor-pointer"
                      >
                        대본 제작
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Reference detailed report modal */}
      {selectedVideoDetail && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up border border-slate-100">
            <div className="bg-gradient-to-r from-rose-500 to-amber-500 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-xs text-white">
                  {selectedVideoDetail.platform} Reference
                </span>
                <h4 className="font-black text-sm truncate max-w-[350px]">
                  {selectedVideoDetail.title}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedVideoDetail(null)}
                className="text-white hover:text-rose-100 text-lg font-black p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Fake Video Player Mock */}
              <div className="aspect-video bg-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                {selectedVideoDetail.thumbnail?.startsWith("http") ? (
                  <img 
                    src={selectedVideoDetail.thumbnail} 
                    alt={selectedVideoDetail.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                ) : (
                  <span className="text-7xl select-none opacity-40">
                    {selectedVideoDetail.thumbnail}
                  </span>
                )}
                <div className="absolute inset-0 flex flex-col justify-between p-4 bg-black/40">
                  <div className="flex justify-between items-start">
                    <span className="text-white text-xs font-semibold bg-black/50 px-2.5 py-1 rounded-lg">
                      @{selectedVideoDetail.creator}
                    </span>
                    <span className="text-white text-xs font-black bg-rose-500 px-2.5 py-1 rounded-lg shadow-sm shadow-rose-950/20">
                      조회수 {selectedVideoDetail.views} 돌파!
                    </span>
                  </div>
                  
                  {/* Big play button to trigger play design mock */}
                  <div className="self-center flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-1" />
                    </div>
                    <span className="text-xs text-slate-300 font-bold">실제 SNS 바이럴 영상 레퍼런스</span>
                  </div>

                  <div className="text-[11px] text-slate-300 bg-black/65 p-2.5 rounded-xl text-center font-sans">
                    참고용 숏폼 레이아웃 정보입니다. 동일 상품으로 대본을 즉시 작성해 세일즈 경쟁력을 강화해보세요.
                  </div>
                </div>
              </div>

              {/* Product Info Card inside modal */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-slate-900 text-sm">🛍️ 바이럴 상품 정보</h5>
                  <div className="text-xs text-slate-500 font-bold">
                    추천 쇼핑 검색어: <span className="font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded">{selectedVideoDetail.searchQuery}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">매출 유발 요소 01</span>
                    <span className="text-xs font-bold text-slate-800">{selectedVideoDetail.points[0]}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">매출 유발 요소 02</span>
                    <span className="text-xs font-bold text-slate-800">{selectedVideoDetail.points[1]}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block">매출 유발 요소 03</span>
                    <span className="text-xs font-bold text-slate-800">{selectedVideoDetail.points[2] || "극강의 가성비"}</span>
                  </div>
                </div>
              </div>

              {/* Editing & Visual Flow techniques */}
              <div className="space-y-3">
                <h5 className="font-black text-slate-900 text-sm">🎥 이 영상의 조회수 폭발 연출 치트키 (기획 분석)</h5>
                <div className="space-y-2 font-sans text-xs">
                  <div className="flex gap-3 bg-rose-50/50 p-3 rounded-xl border-l-4 border-rose-500">
                    <span className="font-mono font-black text-rose-600 shrink-0">00~03초</span>
                    <div className="space-y-1">
                      <p className="font-black text-slate-800">초반 압도적 시각 자극 (후킹 멘트)</p>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        일반적인 사용법이 아닌, 극적인 해결 모습을 1초 만에 슬로우 모션 또는 클로즈업으로 보여줘 흥미를 최고조로 유도함.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border-l-4 border-slate-400">
                    <span className="font-mono font-black text-slate-500 shrink-0">03~10초</span>
                    <div className="space-y-1">
                      <p className="font-black text-slate-800">일상적인 공감대 유발 & 실사용 증명</p>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        &quot;이거 나만 겪었나?&quot;하는 불편한 경험을 짧게 노출한 후, 본 제품을 꺼내서 쾌감 가득하게 원킬로 씻겨내거나 설치하는 모습을 연속 컷 편집으로 속도감 있게 전개.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border-l-4 border-slate-400">
                    <span className="font-mono font-black text-slate-500 shrink-0">10~15초</span>
                    <div className="space-y-1">
                      <p className="font-black text-slate-800">구매 가속화 및 아웃트로 유도</p>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        판매가 정보나 &quot;댓글창/프로필 링크 확인&quot; 등 행동 촉구(CTA)를 확실하게 띄워 조회수가 실판매 매출로 즉각 전환되도록 유도함.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setSelectedVideoDetail(null)}
                className="w-1/3 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  onSelectProduct(selectedVideoDetail.productName, `${selectedVideoDetail.productName} 상세설명: 1. ${selectedVideoDetail.points[0]} 2. ${selectedVideoDetail.points[1]} 3. ${selectedVideoDetail.points[2] || ""}`);
                  setSelectedVideoDetail(null);
                }}
                className="w-2/3 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition-all shadow-md shadow-rose-200 cursor-pointer"
              >
                이 상품 정보로 대본 메이커 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
