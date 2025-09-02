// 판교어 번역 확장프로그램 - Content Script (고도화)
let translatorEnabled = true;
let currentTranslateOverlay = null;
let selectedText = '';
let modelReady = false;

// 초기 설정 및 모델 상태 확인
chrome.storage.local.get(['pangyoTranslatorEnabled', 'modelReadyNotification'], function(result) {
    translatorEnabled = result.pangyoTranslatorEnabled !== false;
    modelReady = result.modelReadyNotification?.ready || false;
    
    if (modelReady) {
        console.log('판교어 번역기 준비 완료 - 즉시 번역 가능');
    }
});

// 메시지 리스너
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'toggleTranslator') {
        translatorEnabled = request.enabled;
        if (!translatorEnabled && currentTranslateOverlay) {
            hideTranslateOverlay();
        }
        sendResponse({ success: true });
    }
    return true;
});

// 키보드 단축키 리스너
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (!translatorEnabled) return;
    
    if (request.action === 'translate-to-korean') {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            selectedText = selection.toString().trim();
            if (selectedText) {
                showTranslateOverlay('to-korean', selectedText, selection.getRangeAt(0).getBoundingClientRect());
            }
        }
        sendResponse({ success: true });
    } else if (request.action === 'translate-to-pangyo') {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            selectedText = selection.toString().trim();
            if (selectedText) {
                showTranslateOverlay('to-pangyo', selectedText, selection.getRangeAt(0).getBoundingClientRect());
            }
        }
        sendResponse({ success: true });
    }
    return true;
});

// 번역 오버레이 표시
function showTranslateOverlay(mode, text, rect) {
    hideTranslateOverlay();
    
    const overlay = document.createElement('div');
    overlay.id = 'pangyo-translate-overlay';
    overlay.innerHTML = `
        <div class="pangyo-overlay-content">
            <div class="pangyo-header">
                <div class="pangyo-icon">🌐</div>
                <div class="pangyo-title">${mode === 'to-korean' ? '판교어 → 한국어' : '한국어 → 판교어'}</div>
                <button class="pangyo-close" onclick="this.closest('#pangyo-translate-overlay').remove()">✕</button>
            </div>
            <div class="pangyo-original">
                <div class="pangyo-label">원문:</div>
                <div class="pangyo-text">${text}</div>
            </div>
            <div class="pangyo-result">
                <div class="pangyo-label">번역:</div>
                <div class="pangyo-text pangyo-loading">
                    <div class="pangyo-spinner"></div>
                    번역 중...
                </div>
            </div>
            <div class="pangyo-footer">
                <button class="pangyo-copy-btn" title="번역 결과 복사">📋 복사</button>
                <div class="pangyo-powered">Powered by LFM2-350M</div>
            </div>
        </div>
    `;
    
    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
        #pangyo-translate-overlay {
            position: fixed;
            top: ${Math.min(rect.top + window.scrollY - 10, window.innerHeight - 300)}px;
            left: ${Math.min(rect.left + window.scrollX, window.innerWidth - 350)}px;
            z-index: 2147483647;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            border-radius: 12px;
            overflow: hidden;
            animation: pangyoFadeIn 0.3s ease-out;
            max-width: 340px;
            backdrop-filter: blur(10px);
        }
        
        @keyframes pangyoFadeIn {
            from { opacity: 0; transform: translateY(-10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        .pangyo-overlay-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .pangyo-header {
            display: flex;
            align-items: center;
            padding: 16px 20px 12px 20px;
            background: rgba(255, 255, 255, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .pangyo-icon {
            font-size: 18px;
            margin-right: 10px;
        }
        
        .pangyo-title {
            flex: 1;
            font-weight: 600;
            font-size: 15px;
        }
        
        .pangyo-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
        }
        
        .pangyo-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }
        
        .pangyo-original, .pangyo-result {
            padding: 16px 20px;
        }
        
        .pangyo-result {
            background: rgba(255, 255, 255, 0.05);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .pangyo-label {
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .pangyo-text {
            line-height: 1.5;
            word-break: break-word;
        }
        
        .pangyo-loading {
            display: flex;
            align-items: center;
            opacity: 0.8;
        }
        
        .pangyo-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: pangyoSpin 1s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes pangyoSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .pangyo-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            background: rgba(0, 0, 0, 0.1);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .pangyo-copy-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
            font-weight: 500;
        }
        
        .pangyo-copy-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }
        
        .pangyo-powered {
            font-size: 11px;
            opacity: 0.7;
            font-weight: 500;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    currentTranslateOverlay = overlay;
    
    // 번역 실행
    translateText(text, mode, overlay);
}

// 번역 오버레이 숨기기
function hideTranslateOverlay() {
    if (currentTranslateOverlay) {
        currentTranslateOverlay.remove();
        currentTranslateOverlay = null;
    }
}

// 번역 실행
async function translateText(text, mode, overlay) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'translate',
            text: text,
            mode: mode
        });
        
        if (response && response.success) {
            const resultElement = overlay.querySelector('.pangyo-result .pangyo-text');
            resultElement.textContent = response.translation;
            resultElement.classList.remove('pangyo-loading');
            
            // 복사 버튼 활성화
            const copyBtn = overlay.querySelector('.pangyo-copy-btn');
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(response.translation).then(() => {
                    copyBtn.textContent = '✅ 복사됨';
                    setTimeout(() => {
                        copyBtn.innerHTML = '📋 복사';
                    }, 1500);
                });
            };
        } else {
            throw new Error(response?.error || '번역에 실패했습니다.');
        }
    } catch (error) {
        const resultElement = overlay.querySelector('.pangyo-result .pangyo-text');
        resultElement.innerHTML = `<span style="color: #ffcccb;">오류: ${error.message}</span>`;
        resultElement.classList.remove('pangyo-loading');
    }
}

// 클릭 시 오버레이 외부 클릭하면 닫기
document.addEventListener('click', function(event) {
    if (currentTranslateOverlay && !currentTranslateOverlay.contains(event.target)) {
        hideTranslateOverlay();
    }
});

// ESC 키로 오버레이 닫기
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && currentTranslateOverlay) {
        hideTranslateOverlay();
    }
});