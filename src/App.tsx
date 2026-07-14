import React, { useState } from "react";
import Header from "./components/Header";
import TrendTab from "./components/TrendTab";
import ScriptTab from "./components/ScriptTab";
import { TrendingUp, FileText, HelpCircle, Heart, Star, Compass } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"trends" | "scripts">("trends");
  
  // Transition states for auto-filling from trend item to script generator
  const [preFilledName, setPreFilledName] = useState<string>("");
  const [preFilledDescription, setPreFilledDescription] = useState<string>("");

  const handleSelectTrendingProduct = (name: string, description: string) => {
    setPreFilledName(name);
    setPreFilledDescription(description);
    setActiveTab("scripts"); // Redirect to generator tab
  };

  const handleClearPreFilled = () => {
    setPreFilledName("");
    setPreFilledDescription("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Dynamic Navigation Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        
        {/* Tab Selection Row */}
        <div className="flex bg-rose-50/70 p-1.5 rounded-2xl max-w-md shadow-sm border border-rose-100">
          <button
            id="tab-trends"
            onClick={() => setActiveTab("trends")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
              activeTab === "trends"
                ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                : "text-rose-700/80 hover:text-rose-900 hover:bg-white/60"
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === "trends" ? "text-white" : "text-rose-500"}`} />
            <span>🔥 인기 트렌드 분석</span>
          </button>
          
          <button
            id="tab-scripts"
            onClick={() => setActiveTab("scripts")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
              activeTab === "scripts"
                ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                : "text-rose-700/80 hover:text-rose-900 hover:bg-white/60"
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === "scripts" ? "text-white" : "text-rose-500"}`} />
            <span>📝 AI 상품 대본 생성기</span>
          </button>
        </div>

        {/* Tab panels switcher with animations */}
        <div className="min-h-[500px]">
          {activeTab === "trends" ? (
            <TrendTab onSelectProduct={handleSelectTrendingProduct} />
          ) : (
            <ScriptTab
              preFilledName={preFilledName}
              preFilledDescription={preFilledDescription}
              onClearPreFilled={handleClearPreFilled}
            />
          )}
        </div>
      </main>

      {/* Aesthetic Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 font-sans space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span>쇼츠마스터 - 쇼핑 쇼츠 제작 도우미</span>
          <span className="text-slate-200">|</span>
          <span className="flex items-center gap-0.5 text-slate-400">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> by Gemini
          </span>
        </div>
        <p className="max-w-md mx-auto text-[11px] leading-relaxed">
          본 플랫폼은 유튜브 쇼핑 제작을 지원하기 위해 설계되었으며, 제공되는 실시간 정보는 AI가 구글 검색 및 시맨틱 수집을 통해 가공한 정보입니다. 무료 TTS 및 MP3 다운로드 기능은 개인 제작용으로 제한 없이 사용하실 수 있습니다.
        </p>
      </footer>
    </div>
  );
}

