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

// Content Script로부터의 고도화된 메시지 처리
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'translate':
        // 번역 요청 처리
        const result = await handleTranslation(request.text, request.mode);
        sendResponse(result);
        break;
        
      case 'checkModelStatus':
        // 모델 상태 확인
        const modelLoaded = self.lfm2Translator && self.lfm2Translator.modelLoaded;
        const storage = await chrome.storage.local.get(['modelPreloaded']);
        sendResponse({ 
          modelLoaded: modelLoaded,
          preloaded: storage.modelPreloaded || false
        });
        break;
        
      case 'forcePreload':
        // 강제 프리로드 요청
        if (!self.lfm2Translator) {
          await loadTranslatorEngine();
        }
        preloadModelInBackground();
        sendResponse({ success: true });
        break;
        
      case 'getPerformanceStats':
        // 성능 통계 제공
        const stats = await getPerformanceStats();
        sendResponse(stats);
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('메시지 처리 오류:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // 비동기 응답 지원
});

// 성능 통계 수집
async function getPerformanceStats() {
  try {
    const storage = await chrome.storage.local.get([
      'translationCount', 'averageInferenceTime', 'modelPreloadTime'
    ]);
    
    return {
      translationCount: storage.translationCount || 0,
      averageInferenceTime: storage.averageInferenceTime || 0,
      modelPreloaded: Boolean(storage.modelPreloadTime),
      lastPreloadTime: storage.modelPreloadTime || null
    };
  } catch (error) {
    return { error: error.message };
  }
}

// 고도화된 번역 처리 (성능 추적 포함)
async function handleTranslation(text, mode) {
  const startTime = performance.now();
  
  try {
    // LFM2-350M 모델 로드 및 번역 수행
    const translation = await translateWithLFM2(text, mode);
    
    // 성능 통계 업데이트
    const inferenceTime = performance.now() - startTime;
    await updatePerformanceStats(inferenceTime);
    
    return { 
      success: true, 
      translation: translation,
      inferenceTime: inferenceTime.toFixed(2)
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

// 성능 통계 업데이트
async function updatePerformanceStats(inferenceTime) {
  try {
    const storage = await chrome.storage.local.get([
      'translationCount', 'averageInferenceTime'
    ]);
    
    const count = (storage.translationCount || 0) + 1;
    const currentAvg = storage.averageInferenceTime || 0;
    const newAvg = (currentAvg * (count - 1) + inferenceTime) / count;
    
    await chrome.storage.local.set({
      translationCount: count,
      averageInferenceTime: newAvg
    });
    
    console.log(`번역 #${count} 완료, 평균 추론 시간: ${newAvg.toFixed(2)}ms`);
  } catch (error) {
    console.error('성능 통계 업데이트 오류:', error);
  }
}

// 최적화된 LFM2-350M 모델 번역 함수
async function translateWithLFM2(text, mode) {
  try {
    // LFM2 번역 엔진 로드 확인 및 로드
    if (!self.lfm2Translator) {
      console.log('번역 엔진 미로드 - 즉시 로드 시작');
      await loadTranslatorEngine();
    }
    
    // 번역 실행 (고도화된 메서드 사용)
    const translation = await self.lfm2Translator.translate(text, mode);
    
    console.log(`번역 완료: "${text}" -> "${translation}"`);
    return translation;
    
  } catch (error) {
    console.error('LFM2 translation error:', error);
    
    // 폴백 번역 (더 정교한 폴백)
    return getEnhancedFallbackTranslation(text, mode, error);
  }
}

// 향상된 폴백 번역
function getEnhancedFallbackTranslation(text, mode, originalError) {
  console.log('폴백 번역 모드 활성화');
  
  // 간단한 사전 기반 번역
  const basicDictionary = {
    'to-korean': {
      '미팅': '회의',
      '런치': '점심',
      '카페인': '커피',
      '데드라인': '마감일',
      '워라밸': '일과 삶의 균형',
      '오피스': '사무실',
      '디벨롭': '개발',
      '코딩': '프로그래밍'
    },
    'to-pangyo': {
      '회의': '미팅',
      '점심': '런치',
      '커피': '카페인',
      '마감일': '데드라인',
      '일과 삶의 균형': '워라밸',
      '사무실': '오피스',
      '개발': '디벨롭',
      '프로그래밍': '코딩'
    }
  };
  
  const dict = basicDictionary[mode] || {};
  let result = text;
  
  for (const [from, to] of Object.entries(dict)) {
    result = result.replace(new RegExp(from, 'gi'), to);
  }
  
  return result !== text ? result : getFallbackTranslation(text, mode);
}

// 고도화된 번역 엔진 로드 및 모델 프리로딩
async function loadTranslatorEngine() {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('LFM2 번역 엔진 로드 시작...');
      const startTime = performance.now();
      
      // Service Worker에서는 importScripts 사용
      importScripts(chrome.runtime.getURL('lfm2-translator.js'));
      console.log('LFM2 번역 엔진 스크립트 로드 완료');
      
      // 글로벌 번역기 인스턴스 생성
      if (typeof LFM2PangyoTranslator !== 'undefined') {
        self.lfm2Translator = new LFM2PangyoTranslator();
        
        // 백그라운드에서 모델 프리로딩 시작
        console.log('백그라운드 모델 프리로딩 시작...');
        preloadModelInBackground();
        
        const loadTime = performance.now() - startTime;
        console.log(`LFM2 번역 엔진 로드 완료: ${loadTime.toFixed(2)}ms`);
        resolve();
      } else {
        reject(new Error('LFM2PangyoTranslator 클래스를 찾을 수 없습니다.'));
      }
    } catch (error) {
      console.error('번역 엔진 로드 실패:', error);
      reject(error);
    }
  });
}

// 백그라운드 모델 프리로딩
async function preloadModelInBackground() {
  try {
    // 비동기적으로 모델 로드 (사용자 경험을 방해하지 않도록)
    setTimeout(async () => {
      try {
        console.log('백그라운드 모델 프리로딩 실행 중...');
        const success = await self.lfm2Translator.loadModel();
        
        if (success) {
          console.log('모델 프리로딩 성공');
          // 스토리지에 모델 로드 상태 저장
          await chrome.storage.local.set({
            modelPreloaded: true,
            modelPreloadTime: Date.now()
          });
          
          // 모든 활성 탭에 모델 로드 완료 알림
          notifyTabsModelReady();
        } else {
          console.warn('모델 프리로딩 실패');
        }
      } catch (error) {
        console.error('백그라운드 모델 프리로딩 오류:', error);
      }
    }, 2000); // 2초 후 시작 (크롬 시작 성능에 영향 최소화)
    
  } catch (error) {
    console.error('프리로딩 설정 오류:', error);
  }
}

// 활성 탭들에 모델 준비 완료 알림 (activeTab 권한만 사용)
async function notifyTabsModelReady() {
  try {
    // activeTab 권한을 사용하여 현재 활성 탭만 대상으로 함
    console.log('모델 프리로딩 완료 - 다음 번역 요청 시 즉시 사용 가능');
    
    // 스토리지에 알림 상태 저장 (content script가 확인할 수 있도록)
    await chrome.storage.local.set({
      modelReadyNotification: {
        timestamp: Date.now(),
        ready: true
      }
    });
    
  } catch (error) {
    console.error('모델 준비 알림 설정 오류:', error);
  }
}

// 메모리 관리 및 정리
setInterval(() => {
  // 주기적 메모리 정리 (1시간마다)
  if (self.lfm2Translator && self.lfm2Translator.translationCache) {
    const cacheSize = self.lfm2Translator.translationCache.size;
    if (cacheSize > 500) {
      console.log(`캐시 정리: ${cacheSize}개 항목`);
      // 오래된 캐시 항목들 정리
      const entries = Array.from(self.lfm2Translator.translationCache.entries());
      const keepCount = 300;
      const toKeep = entries.slice(-keepCount);
      
      self.lfm2Translator.translationCache.clear();
      toKeep.forEach(([key, value]) => {
        self.lfm2Translator.translationCache.set(key, value);
      });
      
      console.log(`캐시 정리 완료: ${keepCount}개 항목 유지`);
    }
  }
}, 60 * 60 * 1000); // 1시간

// 서비스 워커 유지
setInterval(() => {
  // 서비스 워커 활성 상태 유지
}, 20 * 1000); // 20초

// 폴백 번역 함수
function getFallbackTranslation(text, mode) {
  if (mode === 'to-korean') {
    return `"${text}" (판교어→한국어 번역 처리 중...)`;
  } else {
    return `"${text}" (한국어→판교어 번역 처리 중...)`;
  }
}

// 확장프로그램 설치 및 시작 시 초기화
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('판교어 번역기 설치/업데이트:', details.reason);
  
  // 기본 설정값 저장
  await chrome.storage.local.set({
    pangyoTranslatorEnabled: true,
    modelPreloaded: false,
    installTime: Date.now()
  });
  
  // 설치 후 즉시 번역 엔진 로드 시작
  if (!self.lfm2Translator) {
    await loadTranslatorEngine();
  }
});

// 서비스 워커 시작 시 초기화 (크롬 재시작 시)
chrome.runtime.onStartup.addListener(async () => {
  console.log('크롬 시작 - 판교어 번역기 초기화');
  
  // 번역 엔진 즉시 로드
  if (!self.lfm2Translator) {
    await loadTranslatorEngine();
  }
  
  // 이전 모델 프리로드 상태 확인
  const storage = await chrome.storage.local.get(['modelPreloaded', 'modelPreloadTime']);
  const timeSincePreload = Date.now() - (storage.modelPreloadTime || 0);
  
  // 24시간이 지났거나 처음이면 다시 프리로드
  if (!storage.modelPreloaded || timeSincePreload > 24 * 60 * 60 * 1000) {
    console.log('모델 재프리로딩 필요');
    preloadModelInBackground();
  } else {
    console.log('기존 프리로드된 모델 사용');
  }
});

// 추가 메시지 핸들러 - 모델 상태 확인
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkModelStatus') {
    const modelLoaded = self.lfm2Translator && self.lfm2Translator.modelLoaded;
    sendResponse({ modelLoaded: modelLoaded });
    return true;
  } else if (request.action === 'forcePreload') {
    // 강제 프리로드 요청
    preloadModelInBackground();
    sendResponse({ success: true });
    return true;
  }
});