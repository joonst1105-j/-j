export interface TrendingVideo {
  id: string;
  title: string;
  creator: string;
  views: string;
  platform: "Shorts" | "Reels" | "TikTok";
  category: string;
  videoUrl: string;
  productName: string;
  searchQuery: string;
  points: string[];
  thumbnail: string;
}

// Map high-quality realistic Unsplash images based on keywords in title or product name
export function getThumbnailUrl(query: string, emojiFallback: string): string {
  const text = query.toLowerCase();
  
  if (text.includes("도어스토퍼") || text.includes("문고리") || text.includes("가구") || text.includes("스토퍼")) {
    return "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("행거") || text.includes("옷걸이") || text.includes("의류") || text.includes("수납")) {
    return "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("물막이") || text.includes("싱크대") || text.includes("주방") || text.includes("식기")) {
    return "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("다지기") || text.includes("채칼") || text.includes("슬라이서") || text.includes("마늘")) {
    return "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("파스타") || text.includes("요리") || text.includes("불닭") || text.includes("라면")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("곱창") || text.includes("전골") || text.includes("찌개") || text.includes("고기")) {
    return "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("닭강정") || text.includes("치킨") || text.includes("닭")) {
    return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("무드등") || text.includes("조명") || text.includes("오르골") || text.includes("스탠드")) {
    return "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("타이머") || text.includes("시계") || text.includes("공부시계")) {
    return "https://images.unsplash.com/photo-1508962914676-134849a727f0?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("AB롤러") || text.includes("복근") || text.includes("운동") || text.includes("헬스")) {
    return "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("마사지") || text.includes("마사지건") || text.includes("안마")) {
    return "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("샤워기") || text.includes("욕실") || text.includes("필터")) {
    return "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("에어건") || text.includes("차량") || text.includes("세차") || text.includes("자동차")) {
    return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("지갑") || text.includes("카드지갑") || text.includes("명함")) {
    return "https://images.unsplash.com/photo-1627124112126-7d4ad2e67500?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("강아지") || text.includes("반려동물") || text.includes("간식볼") || text.includes("개")) {
    return "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("고양이") || text.includes("냥") || text.includes("레이저")) {
    return "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("캐리어") || text.includes("여행") || text.includes("저울")) {
    return "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("토너패드") || text.includes("화장") || text.includes("모공") || text.includes("뷰티")) {
    return "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("케이블") || text.includes("충전") || text.includes("자석")) {
    return "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("반반") || text.includes("반팔티") || text.includes("옷") || text.includes("남친룩")) {
    return "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("연애") || text.includes("커플") || text.includes("질문지")) {
    return "https://images.unsplash.com/photo-1511739001486-6bfe10ec785f?w=400&auto=format&fit=crop&q=80";
  }
  if (text.includes("앵무새") || text.includes("인형") || text.includes("유머")) {
    return "https://images.unsplash.com/photo-1484807352052-0a11586ae5f1?w=400&auto=format&fit=crop&q=80";
  }

  // Fallback to beautiful social-media/trending aesthetic images
  const fallbacks = [
    "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80"
  ];
  const charSum = query.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbacks[charSum % fallbacks.length];
}

const CATEGORIES_DATA: Record<string, {
  emoji: string;
  creators: string[];
  items: Array<{
    title: string;
    product: string;
    query: string;
    points: string[];
  }>;
}> = {
  entertainment: {
    emoji: "🎬",
    creators: ["피식대학 Psick Univ", "주우재", "서준맘", "침착맨", "예능연구소", "꿀잼클립"],
    items: [
      { title: "피식대학 주우재가 강력 추천하는 옷 진짜 못 입는 남친용 체형 보정 반팔티", product: "어깨 보정 탄탄 머슬 오버핏 반팔티", query: "어깨보정 오버핏 반팔티", points: ["목 늘어남 방지 이중 바인딩 20수", "어깨라인 시각적 확장 효과", "사계절 내내 세탁기 돌려도 멀쩡"] },
      { title: "서준맘이 알려주는 동네 기센 엄마들 기죽지 않는 우아한 볼드 진주 코디법", product: "클래식 볼드 진주 레이어드 목걸이", query: "서준맘 진주목걸이", points: ["고품격 우아한 광택감 연출", "알러지 방지 프리미엄 은 침 소재", "캐주얼 정장 어디든 매치 가능"] },
      { title: "침착맨이 극찬한 세상 쓸모없는데 손에서 절대 뗄 수 없는 마성의 피젯토이", product: "스트레스 해소용 무한 실리콘 뽁뽁이", query: "무한 뽁뽁이 피젯토이", points: ["중독성 가득한 에어 뽁뽁이 소리", "안심 위생 친환경 실리콘", "열쇠고리 겸용 휴대 편리성"] }
    ]
  },
  recipe: {
    emoji: "🍳",
    creators: ["요리용디", "자취생레시피", "하루한끼", "뚝딱이형", "초간단식당", "맛맛맛"],
    items: [
      { title: "원팬으로 끝내는 비주얼 대폭발! 치즈 폭포 불닭 크림 파스타 레시피", product: "인덕션 겸용 멀티 그리들 팬", query: "인덕션 멀티 그리들 캠핑팬", points: ["티타늄 코팅 논스틱 가공", "원팬으로 조리부터 플레이팅까지", "세련된 천연 우드 손잡이"] },
      { title: "요알못도 3초 만에 눈물 없이 마늘 양파 완벽하게 다지는 만능 다지기", product: "원터치 초스피드 야채 다지기", query: "원터치 무전원 야채다지기", points: ["초강력 3중 칼날로 완벽 분쇄", "눈 맵고 시린 자극 완벽 차단", "간단 물세척 및 위생 세척"] }
    ]
  },
  food: {
    emoji: "🍔",
    creators: ["쯔양", "먹어보라", "미식가이드", "뚱보가이드", "맛집수사대", "푸드포르노"],
    items: [
      { title: "쯔양이 10인분이나 흡입한 곱이 터지는 소곱창 전골 15분 완성 밀키트", product: "참나무 초벌 직화 소곱창 전골 세트", query: "소곱창 전골 밀키트", points: ["잡내 제로 초벌 훈연 마감", "엄청난 밀도의 고소한 곱 가득", "특제 비법 매콤 감칠맛 양념"] },
      { title: "망원시장 3시간 대기 뿌링클 닭강정 집에서 에어프라이어로 완벽 구현", product: "수제 크리스피 바삭 순살 닭강정", query: "순살 닭강정 밀키트", points: ["쌀가루 튀김옷의 극강 바삭함", "새콤달콤 중독적인 명품 양념", "100% 신선 닭다리살 겉바속촉"] }
    ]
  },
  quotes: {
    emoji: "📝",
    creators: ["지혜의샘", "성공의빛", "동기부여팩트", "인생명언", "책읽는밤", "슬기로운생활"],
    items: [
      { title: "인생 슬럼프와 게으름 한 방에 즉각 박살내는 쇼펜하우어 인생 조언", product: "쇼펜하우어 베스트셀러 마인드셋 도서", query: "쇼펜하우어 베스트셀러 도서", points: ["슬럼프 즉각 타파 멘탈 트레이닝", "현대적인 간편 요약본 수록", "선물용 고급 원목 북마크 포함"] },
      { title: "부자들이 매일 아침 거울 보고 뇌에 세뇌한다는 끌어당김의 감사 일기", product: "하루 10분 마인드셋 확언 플래너", query: "동기부여 감사일기 다이어리", points: ["목표 시각화를 위한 플래너 팁", "고품격 친환경 고급 가죽 표지", "매일 스스로를 일깨우는 명언 수록"] }
    ]
  },
  sports: {
    emoji: "⚽",
    creators: ["김계란", "말왕", "헬창TV", "축구대장", "홈트코치", "머슬스토리"],
    items: [
      { title: "헬스장 안 가도 집에서 뱃살만 골라 타격하는 오토리바운드 AB롤러", product: "자동 리바운드 스마트 AB롤러", query: "오토리바운드 AB슬라이드", points: ["오토 리바운드로 허리 부상 제로", "우레탄 무소음 휠 층간소음 차단", "운동 시 스마트폰 거치 가능"] },
      { title: "손끝 감각 손목 통증 3초 만에 푸는 신기한 자이로볼 회전 효과", product: "자가발전 LED 스마트 고속 자이로볼", query: "자가발전 자이로볼 손목강화", points: ["무전원 스스로 회전 원심력 설계", "속도 올라가면 반짝이는 LED 불빛", "손목 터널 증후군 예방 탁월"] }
    ]
  },
  politics: {
    emoji: "⚖️",
    creators: ["시사비하인드", "글로벌정치학", "국회비하인드", "정치학개론", "세상의법칙", "폴리틱스"],
    items: [
      { title: "국회 청문회 대란 속 여야 의원 레전드 티키타카 회의용 미니 판사봉", product: "미니 천연 원목 법봉 망치 세트", query: "미니 판사봉 장난감", points: ["책상 위 아기자기한 정의 인테리어", "경쾌한 타격음으로 긴장 완화 효과", "고급 소나무 원목 핸드메이드 제작"] },
      { title: "요즘 국회의원들이 회의실에서 스마트폰 볼 때 철저히 화면 가리는 특수 필름", product: "사생활 원천 보호 필름 강화유리", query: "사생활보호 강화유리 필름", points: ["좌우 30도 외부 완벽 정보 차단", "9H 초고경도 전면 충격 방지", "매끄러운 터치감 및 지문 방지"] }
    ]
  },
  info: {
    emoji: "💡",
    creators: ["1분미만", "살림요정", "꿀팁창고", "생활백과", "오늘의정보", "꿀정보상자"],
    items: [
      { title: "지금 즉시 싱크대 하수구에 이거 설치하세요. 벌레 악취 3초 컷 차단 트랩", product: "배수구 하수구 역류 방지 실리콘트랩", query: "하수구 냄새 차단 트랩", points: ["역겨운 썩은 내 및 날파리 밀폐 차단", "배수 시에만 자동 개폐 자석 방식", "가위로 잘라 어떤 구경이든 설치"] },
      { title: "여름철 에어컨 가동할 때 나는 꿉꿉한 식초 쉰내 싹 제거하는 살균제", product: "에어컨 먼지 세정 곰팡이 제거 스프레이", query: "에어컨 세정제 탈취 스프레이", points: ["핀 가득한 곰팡이 세균 99% 살균", "에어로솔 미세 입자 깊숙이 침투", "상쾌한 피톤치드 솔나무 향기 탈취"] }
    ]
  },
  beauty: {
    emoji: "💅",
    creators: ["올리브영 뷰티룸", "뷰티유튜버", "화장연구가", "글램디", "메이크업톡", "스타일가이드"],
    items: [
      { title: "올리브영 품절 대란! 화장 찰떡같이 잘 먹게 모공 피지 싹 비우는 패드", product: "모공 청정 토너 필링 듀얼 토너패드", query: "모공 토너패드 필링패드", points: ["각질 모공 피지 엠보싱 듀얼 가드", "수분 쿨링 에센스 초신선 충전", "자극 없이 화사한 광채 메이크업"] }
    ]
  },
  tech: {
    emoji: "🔌",
    creators: ["디에디트", "뻘짓연구소", "가젯매니아", "테크충", "IT리더", "얼리어답터"],
    items: [
      { title: "충전선 꼬임 완벽 해방! 자석으로 또르르 알아서 수납되는 마그네틱 선", product: "마그네틱 고속 충전 자동정리 케이블", query: "자석 마그네틱 충전케이블", points: ["엉킴 없이 자석식 자동 돌돌 수납", "초고속 100W 전송 및 데이터 전송", "단선 없는 패브릭 특수 원사 마감"] }
    ]
  },
  romance: {
    emoji: "❤️",
    creators: ["연애고수", "심리 연구실", "러브게임", "비밀 연애", "썸남썸녀", "심리 테스트"],
    items: [
      { title: "썸남 썸녀가 즉시 고백하게 만드는 카카오톡 호감도 테스트 카드게임", product: "연인 썸남썸녀 고백 문답 카드게임", query: "커플 대화 카드게임", points: ["어색함 즉각 타파 로맨틱 질문지", "이성의 가치관 및 이상형 파악", "고급 코팅 수납 보관 하드 케이스"] }
    ]
  },
  animals: {
    emoji: "🐶",
    creators: ["댕댕이네", "냥냥연구소", "반려동물 극장", "강아지 브이로그", "동물농장", "개냥이가이드"],
    items: [
      { title: "우리 댕댕이 분리불안 30초 만에 완벽 해결해 준 스스로 구르는 노즈워크 볼", product: "댕댕이 전용 움직이는 노즈워크 간식볼", query: "강아지 노즈워크 자동 간식볼", points: ["위생 무해 고탄성 천연 실리콘 가공", "무게중심 자율 배터리 프리 주행", "분리불안 스트레스 즉각 타파 복지"] }
    ]
  },
  travel: {
    emoji: "✈️",
    creators: ["여행일기", "방랑자", "가성비여행", "해외직구", "캠핑생활", "힐링노마드"],
    items: [
      { title: "해외여행 공항 캐리어 무게 초과 방지하는 한 손가락 측정 정밀 저울", product: "휴대용 디지털 캐리어 저울 측정기", query: "휴대용 캐리어 무게 저울", points: ["0.1kg 단위 초고정밀 로드셀 센서", "초경량 마우스 규격 콤팩트 보관", "항공 수하물 초과 예방 필살기"] }
    ]
  },
  business: {
    emoji: "📈",
    creators: ["머니인사이드", "성공시대", "머니토크", "돈 공부방", "재테크 마스터", "자본주의 사회"],
    items: [
      { title: "책상 위에 두기만 해도 성공 기운과 재물운이 상승하는 황금 골드바 소품", product: "재물운 유발 황금 골드바 대용량 저금통", query: "황금 골드바 저금통 인테리어소품", points: ["리얼 금괴 디자인의 세련된 비주얼", "동전 지폐 완벽 수납 초대형 사이즈", "개업 승진 축하 위트 넘치는 선물"] }
    ]
  },
  humor: {
    emoji: "🤪",
    creators: ["빅재미", "유머 킹", "핵꿀잼", "밈 메이커", "웃음 연구소", "레전드 영상집"],
    items: [
      { title: "출근길에 보면 무조건 육성으로 터지는 2026 역대급 말장난 앵무새 인형", product: "말따라하는 인형 앵무새 녹음기 키링", query: "말따라하는 앵무새 인형", points: ["목소리와 억양 100% 따라하기 녹음", "가방 키링 겸용 콤팩트 데코레이션", "아이부터 반려견까지 폭소 만발"] }
    ]
  },
  household: {
    emoji: "🏠",
    creators: ["자취남", "리빙마스터", "청소요정", "살림마스터", "꿀템연구소", "집돌이살림"],
    items: [
      { title: "자취 10년차가 강력히 강추하는 발로 툭 차면 고정 끝나는 원터치 자석 도어스토퍼", product: "원터치 강력 자석 도어스토퍼", query: "자석 도어스토퍼 원터치", points: ["허리 굽힐 필요 없는 스위치 작동", "강력한 네오디움 자석 고정 지지력", "문과 벽 흠집 방지 패드 세트"] },
      { title: "문걸이 틈새 공간 200% 완벽하게 활용하는 원터치 폴딩 의류 행거", product: "접이식 틈새 문걸이 옷걸이 행거", query: "접이식 문걸이 옷걸이 행거", points: ["안 쓸 때는 자석으로 밀착 접이 수납", "문고리에 1초 만에 논타공 간편 거치", "최대 10벌 튼튼 하중 강철 지지대"] }
    ]
  },
  kitchen: {
    emoji: "🍽️",
    creators: ["주부백서", "요리용디", "기름때킬러", "키친연구소", "살림꿀템", "쿡방의달인"],
    items: [
      { title: "설거지 할 때 물 한 방울도 튀지 않는 강력 흡착 실리콘 물막이 워터가드", product: "실리콘 흡착식 싱크대 물막이", query: "실리콘 싱크대 물막이 워터가드", points: ["설거지 시 허리 배 부분 젖음 원천 가드", "강력 문어발 흠착판으로 물 틈새 침투 방지", "위생적인 친환경 열탕 소독 실리콘"] },
      { title: "양파 마늘 칼질 귀찮을 때 이거 하나 돌리면 3초 컷 대량 채썰기 채칼", product: "다용도 드럼 회전식 만능 채칼 슬라이서", query: "회전식 만능 채칼 슬라이서", points: ["손 베일 일 없는 완벽 안전 칼날 가드", "손잡이 회전식으로 순식간에 채썰기 끝", "채썰기 편썰기 분쇄 칼날 3종 기본 동봉"] }
    ]
  },
  toys: {
    emoji: "🎮",
    creators: ["코코보라", "장난감리뷰어", "만들기천재", "토이월드", "똑똑육아", "장난감수집가"],
    items: [
      { title: "공중에 던지면 알아서 돌아오는 마법의 LED 플라잉 스피너 부메랑 볼", product: "LED 플라잉 볼 스피너 부메랑볼", query: "플라잉 볼 부메랑 피젯스피너", points: ["어린이 야외 놀이 인싸템 등극", "부딪혀도 안 다치는 안전 유연 케이싱", "화려한 RGB LED 야간 비행 쇼파티"] }
    ]
  },
  car: {
    emoji: "🚗",
    creators: ["차덕후의세계", "오토매거진", "차량인테리어", "자동차연구소", "세차전문가", "차사랑"],
    items: [
      { title: "먼지 흡입이랑 찌든 때 바람 불어내기 동시 지원 세차 2in1 무선 에어건", product: "세차용 차량용 강력 무선 에어건 청소기", query: "차량용 무선 에어건 청소기 겸용", points: ["초강력 모터 탑재 시원한 먼지 송풍", "시트 틈새 먼지 강력 흡입 필터 탑재", "세차 후 문틈 물기 날리기 완전 특화"] }
    ]
  }
};

export function generateTrendingVideos(
  category: string,
  platform: string,
  period: string,
  seed: number = 0
): TrendingVideo[] {
  const catData = CATEGORIES_DATA[category] || CATEGORIES_DATA["household"];
  const rawItems = catData.items;

  const items: TrendingVideo[] = [];

  // Seeded random helper
  const randomSeeded = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const platforms = ["Shorts", "Reels", "TikTok"] as const;
  const pFilter = platform === "All" || !platform ? null : platform;

  // Scale views based on Period
  const viewsCoeff = 
    period === "realtime" ? 0.15 :
    period === "daily" ? 0.35 :
    period === "weekly" ? 0.9 : 2.8;

  for (let i = 0; i < 10; i++) {
    const itemSeed = seed + i * 17 + (category.charCodeAt(0) || 1);
    const itemIndex = i % rawItems.length;
    const baseItem = rawItems[itemIndex];

    // Platform
    let pVal: "Shorts" | "Reels" | "TikTok";
    if (pFilter) {
      pVal = pFilter as any;
    } else {
      const idx = Math.floor(randomSeeded(itemSeed + 5) * platforms.length);
      pVal = platforms[idx];
    }

    // Real Channel name / Creator
    const creatorIdx = Math.floor(randomSeeded(itemSeed + 12) * catData.creators.length);
    const creator = catData.creators[creatorIdx];

    // Views
    const baseViewsVal = 120 + Math.floor(randomSeeded(itemSeed + 23) * 1500); // 120K ~ 1620K
    const finalViewsK = Math.floor(baseViewsVal * viewsCoeff);
    let viewsStr = "";
    if (finalViewsK >= 1000) {
      viewsStr = (finalViewsK / 1000).toFixed(1) + "M";
    } else {
      viewsStr = finalViewsK + "K";
    }

    // Varied actual verbatim titles if repeating raw item indexes
    let finalTitle = baseItem.title;
    let finalProduct = baseItem.product;
    let finalQuery = baseItem.query;
    let finalPoints = [...baseItem.points];

    if (i >= rawItems.length) {
      const prefixes = ["SNS 난리 난 ", "실제 대란 중인 ", "품절 속출하는 ", "1분 미만 추천 ", "자취 필수 치트키 "];
      const prefix = prefixes[Math.floor(randomSeeded(itemSeed + 8) * prefixes.length)];
      finalTitle = prefix + finalTitle.replace(/피식대학 |서준맘이 |침착맨이 |자취 10년차가 /, "");
      finalProduct = "리얼 " + finalProduct;
      finalQuery = finalQuery + " 추천";
      if (finalPoints.length > 0) {
        finalPoints[0] = "실제 숏폼 500만 뷰 검증 제품";
      }
    }

    // Determine high-quality Unsplash thumbnail image URL
    const thumbnailImg = getThumbnailUrl(finalProduct + " " + finalTitle, catData.emoji);

    items.push({
      id: `${category.substring(0, 2)}-${pVal.toLowerCase().substring(0, 2)}-${period.substring(0, 2)}-${i + seed}`,
      title: finalTitle,
      creator,
      views: viewsStr,
      platform: pVal,
      category,
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      productName: finalProduct,
      searchQuery: finalQuery,
      points: finalPoints,
      thumbnail: thumbnailImg
    });
  }

  return items;
}
