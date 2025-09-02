document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');
    const copyrightLink = document.getElementById('copyrightLink');
    const modelStatusElement = document.getElementById('modelStatus');
    const testButton = document.getElementById('testButton');
    const performanceButton = document.getElementById('performanceButton');

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
            runPerformanceTest();
        });
    }
    
    // 성능 테스트 버튼 클릭 이벤트
    if (performanceButton) {
        performanceButton.addEventListener('click', function() {
            showPerformanceStats();
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
                } else if (response && response.preloaded) {
                    modelStatusElement.textContent = '모델 프리로드됨';
                    modelStatusElement.className = 'status enabled';
                } else {
                    modelStatusElement.textContent = '모델 미로드';
                    modelStatusElement.className = 'status disabled';
                }
            }
        });
    }
    
    // 성능 테스트 실행
    async function runPerformanceTest() {
        const testTexts = [
            '출근하기 싫어요',
            '미팅이 너무 많아서 힘들어요',
            '런치 타임이 기다려져요',
            '데드라인이 다가와요',
            '워라밸이 중요해요'
        ];
        
        const results = [];
        const statusDiv = createTestStatusDiv();
        
        for (let i = 0; i < testTexts.length; i++) {
            const text = testTexts[i];
            statusDiv.textContent = `테스트 중... ${i + 1}/${testTexts.length}`;
            
            const startTime = performance.now();
            
            try {
                const result = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({
                        action: 'translate',
                        text: text,
                        mode: 'to-korean'
                    }, (response) => {
                        if (response && response.success) {
                            resolve(response);
                        } else {
                            reject(new Error(response?.error || '번역 실패'));
                        }
                    });
                });
                
                const endTime = performance.now();
                const inferenceTime = endTime - startTime;
                
                results.push({
                    input: text,
                    output: result.translation,
                    time: inferenceTime.toFixed(2)
                });
                
            } catch (error) {
                results.push({
                    input: text,
                    output: 'ERROR: ' + error.message,
                    time: 'N/A'
                });
            }
        }
        
        displayTestResults(results);
        statusDiv.remove();
    }
    
    // 성능 통계 표시
    async function showPerformanceStats() {
        chrome.runtime.sendMessage({action: 'getPerformanceStats'}, function(response) {
            if (response && !response.error) {
                const statsDiv = createStatsDiv(response);
                document.body.appendChild(statsDiv);
            } else {
                alert('성능 통계를 불러올 수 없습니다: ' + (response?.error || '알 수 없는 오류'));
            }
        });
    }
    
    // 테스트 상태 표시 div 생성
    function createTestStatusDiv() {
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
        `;
        statusDiv.textContent = '테스트 준비 중...';
        document.body.appendChild(statusDiv);
        return statusDiv;
    }
    
    // 테스트 결과 표시
    function displayTestResults(results) {
        const totalTime = results.reduce((sum, r) => sum + parseFloat(r.time || 0), 0);
        const avgTime = (totalTime / results.length).toFixed(2);
        
        const resultWindow = window.open('', '_blank', 'width=600,height=500');
        resultWindow.document.write(`
            <html>
            <head><title>판교어 번역기 성능 테스트 결과</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>성능 테스트 결과</h2>
                <p><strong>평균 추론 시간:</strong> ${avgTime}ms</p>
                <p><strong>총 테스트 시간:</strong> ${totalTime.toFixed(2)}ms</p>
                <hr>
                <h3>개별 결과:</h3>
                <table border="1" style="width:100%; border-collapse: collapse;">
                    <tr>
                        <th style="padding: 8px;">입력</th>
                        <th style="padding: 8px;">출력</th>
                        <th style="padding: 8px;">시간(ms)</th>
                    </tr>
                    ${results.map(r => `
                        <tr>
                            <td style="padding: 8px;">${r.input}</td>
                            <td style="padding: 8px;">${r.output}</td>
                            <td style="padding: 8px;">${r.time}</td>
                        </tr>
                    `).join('')}
                </table>
            </body>
            </html>
        `);
    }
    
    // 성능 통계 div 생성
    function createStatsDiv(stats) {
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 2px solid #667eea;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 12px;
            max-width: 250px;
        `;
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong>성능 통계</strong>
                <span style="cursor: pointer; color: #666;" onclick="this.parentElement.parentElement.remove()">✕</span>
            </div>
            <p><strong>총 번역 횟수:</strong> ${stats.translationCount || 0}</p>
            <p><strong>평균 추론 시간:</strong> ${(stats.averageInferenceTime || 0).toFixed(2)}ms</p>
            <p><strong>모델 프리로드:</strong> ${stats.modelPreloaded ? '✅' : '❌'}</p>
            ${stats.lastPreloadTime ? `<p><strong>마지막 프리로드:</strong> ${new Date(stats.lastPreloadTime).toLocaleString()}</p>` : ''}
        `;
        
        return div;
    }
});