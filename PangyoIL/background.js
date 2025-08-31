// 판교어 번역 확장프로그램 - Background Script (Service Worker)

// 키보드 단축키 리스너
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { action: command });
    }
  } catch (error) {
    console.error('Error handling command:', error);
  }
});

// Content Script로부터의 메시지 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    handleTranslation(request.text, request.mode)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 비동기 응답을 위해 true 반환
  }
});

// LFM2-350M 모델을 사용한 번역 처리
async function handleTranslation(text, mode) {
  try {
    // LFM2-350M 모델 로드 및 번역 수행
    const translation = await translateWithLFM2(text, mode);
    return { success: true, translation: translation };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// LFM2-350M 모델 번역 함수
async function translateWithLFM2(text, mode) {
  try {
    // LFM2 번역 엔진 로드
    if (!self.lfm2Translator) {
      // 번역 엔진 스크립트 동적 로드
      await loadTranslatorEngine();
    }
    
    // 번역 실행
    const translation = await self.lfm2Translator.translate(text, mode);
    return translation;
  } catch (error) {
    console.error('LFM2 translation error:', error);
    // 폴백 번역
    return getFallbackTranslation(text, mode);
  }
}

// 번역 엔진 로드
async function loadTranslatorEngine() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('lfm2-translator.js');
    script.onload = () => {
      console.log('LFM2 번역 엔진이 로드되었습니다.');
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 판교어 -> 한국어 번역
async function translatePangyoToKorean(text, modelUrl) {
  // TODO: 실제 LFM2-350M 모델을 사용한 번역 구현
  // 현재는 모의 번역을 반환
  
  const pangyoWords = {
    '판교어': '판교 지역 특유의 언어',
    '출근': '오피스로 가는 것',
    '퇴근': '집으로 돌아가는 것',
    '야근': '밤늦게까지 일하는 것',
    '카페인': '업무 필수 연료',
    '런치': '점심 시간',
    '미팅': '회의',
    '데드라인': '마감일',
    '워라밸': '일과 삶의 균형'
  };
  
  let translatedText = text;
  for (const [pangyo, korean] of Object.entries(pangyoWords)) {
    translatedText = translatedText.replace(new RegExp(pangyo, 'g'), korean);
  }
  
  // 문맥에 따른 추가 번역 로직
  if (translatedText === text) {
    // 직접 매칭되는 단어가 없을 경우 문맥 번역
    translatedText = `${text} (한국어로 번역됨)`;
  }
  
  return translatedText;
}

// 한국어 -> 판교어 번역
async function translateKoreanToPangyo(text, modelUrl) {
  // TODO: 실제 LFM2-350M 모델을 사용한 번역 구현
  // 현재는 모의 번역을 반환
  
  const koreanToPangyo = {
    '출근하다': '출근하기',
    '퇴근하다': '퇴근하기', 
    '일하다': '워킹하기',
    '회의하다': '미팅하기',
    '점심 먹다': '런치하기',
    '커피 마시다': '카페인 충전하기',
    '야근하다': '야근하기',
    '마감일': '데드라인',
    '일과 삶의 균형': '워라밸'
  };
  
  let translatedText = text;
  for (const [korean, pangyo] of Object.entries(koreanToPangyo)) {
    translatedText = translatedText.replace(new RegExp(korean, 'g'), pangyo);
  }
  
  // 문맥에 따른 추가 번역 로직
  if (translatedText === text) {
    // 직접 매칭되는 단어가 없을 경우 문맥 번역
    translatedText = `${text} (판교어로 번역됨)`;
  }
  
  return translatedText;
}

// 폴백 번역 함수
function getFallbackTranslation(text, mode) {
  if (mode === 'to-korean') {
    return `"${text}" (판교어→한국어 번역 처리 중...)`;
  } else {
    return `"${text}" (한국어→판교어 번역 처리 중...)`;
  }
}

// 확장프로그램 설치 시 초기화
chrome.runtime.onInstalled.addListener(() => {
  console.log('판교어 번역기가 설치되었습니다.');
  
  // 기본 설정값 저장
  chrome.storage.local.set({
    pangyoTranslatorEnabled: true
  });
});