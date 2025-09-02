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
  } else if (request.action === 'checkModelStatus') {
    // 모델 상태 확인
    const modelLoaded = self.lfm2Translator && self.lfm2Translator.modelLoaded;
    sendResponse({ modelLoaded: modelLoaded });
    return true;
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

// 번역 엔진 로드 (Service Worker 환경에 맞게 수정)
async function loadTranslatorEngine() {
  return new Promise(async (resolve, reject) => {
    try {
      // Service Worker에서는 importScripts 사용
      importScripts(chrome.runtime.getURL('lfm2-translator.js'));
      console.log('LFM2 번역 엔진이 로드되었습니다.');
      
      // 글로벌 번역기 인스턴스 생성
      if (typeof LFM2PangyoTranslator !== 'undefined') {
        self.lfm2Translator = new LFM2PangyoTranslator();
        resolve();
      } else {
        reject(new Error('LFM2PangyoTranslator 클래스를 찾을 수 없습니다.'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

// 사용하지 않는 함수들 제거 - 이제 lfm2Translator가 모든 번역 처리

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