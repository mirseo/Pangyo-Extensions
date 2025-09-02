document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');
    const copyrightLink = document.getElementById('copyrightLink');
    const modelStatusElement = document.getElementById('modelStatus');
    const testButton = document.getElementById('testButton');

    // 모델 상태 확인
    checkModelStatus();

    // 저장된 상태 불러오기
    chrome.storage.local.get(['pangyoTranslatorEnabled'], function(result) {
        const isEnabled = result.pangyoTranslatorEnabled !== false; // 기본값 true
        toggleSwitch.checked = isEnabled;
        updateStatusText(isEnabled);
    });

    // 토글 스위치 이벤트 리스너
    toggleSwitch.addEventListener('change', function() {
        const isEnabled = toggleSwitch.checked;
        
        // 상태 저장
        chrome.storage.local.set({
            pangyoTranslatorEnabled: isEnabled
        });

        // UI 업데이트
        updateStatusText(isEnabled);
        
        // 컨텐츠 스크립트에 상태 전달
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'toggleTranslator',
                    enabled: isEnabled
                }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.log('탭이 준비되지 않았거나 지원하지 않는 페이지입니다.');
                    }
                });
            }
        });
    });

    // 테스트 버튼 클릭 이벤트
    if (testButton) {
        testButton.addEventListener('click', function() {
            chrome.tabs.create({ url: chrome.runtime.getURL('test-model.html') });
        });
    }

    // Copyright 링크 클릭 이벤트
    copyrightLink.addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://github.com/mirseo/Pangyo-Extensions' });
    });

    function updateStatusText(isEnabled) {
        statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
        statusText.className = `status ${isEnabled ? 'enabled' : 'disabled'}`;
    }

    function checkModelStatus() {
        // 백그라운드 스크립트에 모델 상태 확인 요청
        chrome.runtime.sendMessage({action: 'checkModelStatus'}, function(response) {
            if (modelStatusElement) {
                if (response && response.modelLoaded) {
                    modelStatusElement.textContent = '모델 로드됨';
                    modelStatusElement.className = 'status enabled';
                } else {
                    modelStatusElement.textContent = '모델 미로드';
                    modelStatusElement.className = 'status disabled';
                }
            }
        });
    }
});