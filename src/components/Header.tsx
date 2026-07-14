import { Sparkles, Youtube, ShoppingBag } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 py-4 px-8 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand logo and title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md shadow-rose-200">
            <Youtube className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-amber-600">
                SHORTS LAB
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest">
                v1.5 Beta
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-sans font-medium">
              AI 기반 최신 쇼핑 트렌드 발굴 & 대본 제작 & 무료 TTS 보이스 솔루션
            </p>
          </div>
        </div>

        {/* Action / Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-bold">
            <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
            <span>숏폼 커머스 전용</span>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50/50 border border-rose-100 text-rose-600 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Powered by Gemini 3.5</span>
          </div>
        </div>
      </div>
    </header>
  );
}
