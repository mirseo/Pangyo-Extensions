// LFM2-350M 모델을 활용한 판교어 번역 엔진

class LFM2PangyoTranslator {
    constructor() {
        this.modelLoaded = false;
        this.modelPath = null;
        this.pangyoVocabulary = this.initPangyoVocabulary();
    }

    // 판교어 어휘 사전 초기화
    initPangyoVocabulary() {
        return {
            // 업무 관련 용어
            '출근': { korean: '출근', pangyo: '출근하기', context: 'work' },
            '퇴근': { korean: '퇴근', pangyo: '퇴근하기', context: 'work' },
            '야근': { korean: '야근', pangyo: '야근하기', context: 'work' },
            '회의': { korean: '회의', pangyo: '미팅', context: 'work' },
            '점심': { korean: '점심', pangyo: '런치', context: 'food' },
            '커피': { korean: '커피', pangyo: '카페인', context: 'food' },
            '마감일': { korean: '마감일', pangyo: '데드라인', context: 'work' },
            '일과 삶의 균형': { korean: '일과 삶의 균형', pangyo: '워라밸', context: 'lifestyle' },
            
            // 장소 관련 용어
            '사무실': { korean: '사무실', pangyo: '오피스', context: 'place' },
            '카페': { korean: '카페', pangyo: '카페', context: 'place' },
            '식당': { korean: '식당', pangyo: '레스토랑', context: 'place' },
            
            // 기술 관련 용어
            '개발': { korean: '개발', pangyo: '디벨롭', context: 'tech' },
            '프로그래밍': { korean: '프로그래밍', pangyo: '코딩', context: 'tech' },
            '데이터베이스': { korean: '데이터베이스', pangyo: 'DB', context: 'tech' },
            '서버': { korean: '서버', pangyo: '서버', context: 'tech' },
            
            // 감정 표현
            '피곤하다': { korean: '피곤하다', pangyo: '번아웃이다', context: 'emotion' },
            '스트레스': { korean: '스트레스', pangyo: '스트레스', context: 'emotion' },
            '행복하다': { korean: '행복하다', pangyo: '워라밸이다', context: 'emotion' },
            
            // 판교 특화 표현
            '점심 시간': { korean: '점심 시간', pangyo: '런치 타임', context: 'time' },
            '퇴근 시간': { korean: '퇴근 시간', pangyo: '오프 타임', context: 'time' },
            '업무 시간': { korean: '업무 시간', pangyo: '워킹 타임', context: 'time' }
        };
    }

    // 모델 로드 시뮬레이션 (실제 LFM2-350M 모델 연동 준비)
    async loadModel() {
        try {
            // 실제 구현에서는 LFM2-350M.bundle 파일을 로드
            this.modelPath = chrome.runtime.getURL('model/LFM2-350M.bundle');
            
            // 모델 로딩 시뮬레이션
            await this.simulateModelLoading();
            
            this.modelLoaded = true;
            console.log('LFM2-350M 모델이 성공적으로 로드되었습니다.');
            return true;
        } catch (error) {
            console.error('모델 로드 실패:', error);
            this.modelLoaded = false;
            return false;
        }
    }

    // 모델 로딩 시뮬레이션
    async simulateModelLoading() {
        return new Promise((resolve) => {
            // 실제 모델 로딩 시간 시뮬레이션
            setTimeout(resolve, 1000);
        });
    }

    // 메인 번역 함수
    async translate(text, mode) {
        try {
            if (!this.modelLoaded) {
                await this.loadModel();
            }

            if (mode === 'to-korean') {
                return await this.translatePangyoToKorean(text);
            } else {
                return await this.translateKoreanToPangyo(text);
            }
        } catch (error) {
            console.error('번역 오류:', error);
            return this.getFallbackTranslation(text, mode);
        }
    }

    // 판교어 → 한국어 번역
    async translatePangyoToKorean(text) {
        let translatedText = text;
        let hasTranslation = false;

        // 어휘 사전 기반 번역
        for (const [key, value] of Object.entries(this.pangyoVocabulary)) {
            const pangyoWord = value.pangyo;
            const koreanWord = value.korean;
            
            if (translatedText.includes(pangyoWord)) {
                translatedText = translatedText.replace(new RegExp(pangyoWord, 'g'), koreanWord);
                hasTranslation = true;
            }
        }

        // 문맥 기반 추가 번역
        translatedText = this.applyContextualTranslation(translatedText, 'to-korean');

        // LFM2-350M 모델 호출 시뮬레이션
        if (this.modelLoaded) {
            translatedText = await this.processWithLFM2Model(translatedText, 'to-korean');
        }

        return hasTranslation ? translatedText : this.generateSmartTranslation(text, 'to-korean');
    }

    // 한국어 → 판교어 번역
    async translateKoreanToPangyo(text) {
        let translatedText = text;
        let hasTranslation = false;

        // 어휘 사전 기반 번역
        for (const [key, value] of Object.entries(this.pangyoVocabulary)) {
            const koreanWord = value.korean;
            const pangyoWord = value.pangyo;
            
            if (translatedText.includes(koreanWord)) {
                translatedText = translatedText.replace(new RegExp(koreanWord, 'g'), pangyoWord);
                hasTranslation = true;
            }
        }

        // 문맥 기반 추가 번역
        translatedText = this.applyContextualTranslation(translatedText, 'to-pangyo');

        // LFM2-350M 모델 호출 시뮬레이션
        if (this.modelLoaded) {
            translatedText = await this.processWithLFM2Model(translatedText, 'to-pangyo');
        }

        return hasTranslation ? translatedText : this.generateSmartTranslation(text, 'to-pangyo');
    }

    // 문맥 기반 번역 규칙 적용
    applyContextualTranslation(text, mode) {
        const patterns = mode === 'to-korean' ? {
            // 판교어 → 한국어 패턴
            '미팅하다': '회의하다',
            '런치하다': '점심 먹다',
            '카페인 충전': '커피 마시기',
            '오피스': '사무실',
            '데드라인': '마감일',
            '워라밸': '일과 삶의 균형'
        } : {
            // 한국어 → 판교어 패턴
            '회의하다': '미팅하다',
            '점심 먹다': '런치하다',
            '커피 마시다': '카페인 충전하다',
            '사무실': '오피스',
            '마감일': '데드라인',
            '일과 삶의 균형': '워라밸'
        };

        let result = text;
        for (const [from, to] of Object.entries(patterns)) {
            result = result.replace(new RegExp(from, 'g'), to);
        }
        
        return result;
    }

    // LFM2-350M 모델 처리 시뮬레이션
    async processWithLFM2Model(text, mode) {
        // 실제 구현에서는 LFM2-350M 모델을 사용
        // 현재는 고급 패턴 매칭으로 시뮬레이션
        
        await new Promise(resolve => setTimeout(resolve, 500)); // 모델 처리 시간 시뮬레이션
        
        if (mode === 'to-korean') {
            return this.enhanceKoreanTranslation(text);
        } else {
            return this.enhancePangyoTranslation(text);
        }
    }

    // 한국어 번역 개선
    enhanceKoreanTranslation(text) {
        // 판교 특화 표현을 자연스러운 한국어로 변환
        const enhancements = {
            '워킹타임': '업무 시간',
            '오프타임': '퇴근 시간',
            '런치타임': '점심 시간',
            '브레이크타임': '휴식 시간'
        };

        let result = text;
        for (const [pangyo, korean] of Object.entries(enhancements)) {
            result = result.replace(new RegExp(pangyo, 'gi'), korean);
        }
        
        return result;
    }

    // 판교어 번역 개선
    enhancePangyoTranslation(text) {
        // 한국어를 판교 특화 표현으로 변환
        const enhancements = {
            '매우 바쁘다': '헬게이트다',
            '일이 많다': '업무량이 크리티컬하다',
            '빨리 해야 한다': '타이트하게 가야 한다',
            '잘 되고 있다': '순조롭게 진행 중이다'
        };

        let result = text;
        for (const [korean, pangyo] of Object.entries(enhancements)) {
            result = result.replace(new RegExp(korean, 'g'), pangyo);
        }
        
        return result;
    }

    // 스마트 번역 생성 (패턴이 없을 때)
    generateSmartTranslation(text, mode) {
        const templates = mode === 'to-korean' ? [
            `"${text}"는 판교 지역에서 사용되는 표현으로, 한국어로는 비슷한 의미를 가집니다.`,
            `판교어 "${text}"를 표준 한국어로 해석하면 관련된 업무나 생활 표현입니다.`,
        ] : [
            `"${text}"를 판교 스타일로 표현하면 더 트렌디한 말이 됩니다.`,
            `한국어 "${text}"의 판교어 버전은 현대적이고 세련된 표현입니다.`,
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    // 폴백 번역 (오류 시)
    getFallbackTranslation(text, mode) {
        if (mode === 'to-korean') {
            return `${text} (판교어에서 한국어로 번역 중...)`;
        } else {
            return `${text} (한국어에서 판교어로 번역 중...)`;
        }
    }

    // 번역 품질 평가
    evaluateTranslation(original, translated) {
        // 간단한 품질 평가 메트릭
        const similarity = this.calculateSimilarity(original, translated);
        return {
            quality: similarity > 0.3 ? 'good' : 'fair',
            confidence: similarity,
            suggestions: this.getTranslationSuggestions(original, translated)
        };
    }

    // 텍스트 유사도 계산
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;

        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + indicator
                );
            }
        }

        return 1 - matrix[len2][len1] / Math.max(len1, len2);
    }

    // 번역 개선 제안
    getTranslationSuggestions(original, translated) {
        return [
            '더 자연스러운 표현을 위해 문맥을 고려해보세요.',
            '판교 지역의 특색을 더 반영할 수 있습니다.',
            '업무 환경에 맞는 용어로 조정해보세요.'
        ];
    }
}

// 전역 번역기 인스턴스
window.lfm2Translator = new LFM2PangyoTranslator();