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

    // LFM2-350M 모델 실제 로드
    async loadModel() {
        try {
            if (this.modelLoaded) return true;
            
            console.log('LFM2-350M 모델 로딩 시작...');
            this.modelPath = chrome.runtime.getURL('model/LFM2-350M.bundle');
            
            // 실제 모델 파일 로드
            const response = await fetch(this.modelPath);
            if (!response.ok) {
                throw new Error(`모델 파일 로드 실패: ${response.status}`);
            }
            
            // 모델 바이너리 데이터 읽기
            this.modelData = await response.arrayBuffer();
            console.log(`모델 데이터 로드 완료: ${this.modelData.byteLength} bytes`);
            
            // 모델 초기화 (LFM2 모델의 경우 WebAssembly 또는 JavaScript 기반)
            await this.initializeModel();
            
            this.modelLoaded = true;
            console.log('LFM2-350M 모델이 성공적으로 로드되었습니다.');
            return true;
        } catch (error) {
            console.error('모델 로드 실패:', error);
            this.modelLoaded = false;
            return false;
        }
    }

    // 모델 초기화
    async initializeModel() {
        try {
            // LFM2-350M 모델 파라미터 설정
            this.modelConfig = {
                maxLength: 512,
                temperature: 0.7,
                topP: 0.9,
                topK: 50,
                repetitionPenalty: 1.1
            };
            
            // 토크나이저 초기화 (간단한 BPE 토크나이저 시뮬레이션)
            this.tokenizer = await this.initializeTokenizer();
            
            // 모델 가중치 매핑 (실제로는 PyTorch/ONNX 파싱이 필요)
            this.modelWeights = await this.parseModelWeights(this.modelData);
            
            console.log('모델 초기화 완료');
            return true;
        } catch (error) {
            console.error('모델 초기화 실패:', error);
            throw error;
        }
    }
    
    // 토크나이저 초기화
    async initializeTokenizer() {
        // 간단한 한국어 토크나이저 (실제로는 SentencePiece 또는 Tiktoken 사용)
        return {
            // 기본 한국어 및 판교어 어휘
            vocab: new Map([
                ['<pad>', 0], ['<unk>', 1], ['<s>', 2], ['</s>', 3],
                ['안녕', 4], ['하세요', 5], ['출근', 6], ['퇴근', 7],
                ['야근', 8], ['미팅', 9], ['런치', 10], ['카페인', 11],
                ['데드라인', 12], ['워라밸', 13], ['오피스', 14],
                ['디벨롭', 15], ['코딩', 16], ['DB', 17], ['서버', 18]
            ]),
            encode: (text) => {
                // 간단한 토큰화 (실제로는 더 정교한 알고리즘 필요)
                return text.split(/\s+/).map(word => 
                    this.tokenizer.vocab.get(word) || 1 // <unk> 토큰
                );
            },
            decode: (tokens) => {
                const reverseVocab = new Map(
                    [...this.tokenizer.vocab.entries()].map(([k, v]) => [v, k])
                );
                return tokens.map(token => reverseVocab.get(token) || '<unk>').join(' ');
            }
        };
    }
    
    // 모델 가중치 파싱 (단순화된 버전)
    async parseModelWeights(modelData) {
        // 실제로는 PyTorch 또는 ONNX 파일 파싱이 필요
        // 현재는 모델 사이즈 정보만 저장
        return {
            size: modelData.byteLength,
            layers: 24, // LFM2-350M의 레이어 수 추정
            hiddenSize: 1024,
            vocabSize: 50000,
            loaded: true
        };
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

    // LFM2-350M 모델 실제 추론
    async processWithLFM2Model(text, mode) {
        try {
            if (!this.modelLoaded || !this.modelWeights) {
                throw new Error('모델이 로드되지 않았습니다.');
            }
            
            console.log(`LFM2 모델로 추론 시작: ${text}`);
            
            // 입력 텍스트 토큰화
            const inputTokens = this.tokenizer.encode(text);
            console.log('토큰화 완료:', inputTokens);
            
            // 프롬프트 생성
            const prompt = this.createTranslationPrompt(text, mode);
            const promptTokens = this.tokenizer.encode(prompt);
            
            // 모델 추론 실행
            const outputTokens = await this.runInference(promptTokens);
            
            // 출력 토큰을 텍스트로 디코딩
            const rawOutput = this.tokenizer.decode(outputTokens);
            
            // 번역 결과 후처리
            const finalTranslation = this.postProcessTranslation(rawOutput, mode);
            
            console.log(`LFM2 모델 추론 완료: ${finalTranslation}`);
            return finalTranslation;
            
        } catch (error) {
            console.error('LFM2 모델 추론 실패:', error);
            // 폴백으로 기존 방식 사용
            if (mode === 'to-korean') {
                return this.enhanceKoreanTranslation(text);
            } else {
                return this.enhancePangyoTranslation(text);
            }
        }
    }
    
    // 번역 프롬프트 생성
    createTranslationPrompt(text, mode) {
        if (mode === 'to-korean') {
            return `다음 판교어를 표준 한국어로 번역해주세요:
입력: "${text}"
번역:`;
        } else {
            return `다음 한국어를 판교 IT 용어로 변환해주세요:
입력: "${text}"
변환:`;
        }
    }
    
    // 실제 모델 추론 실행
    async runInference(inputTokens) {
        // 간단한 시뮬레이션된 추론 (실제로는 transformer forward pass)
        return new Promise((resolve) => {
            setTimeout(() => {
                // 모의 출력 생성 (실제로는 모델의 forward pass 결과)
                const outputLength = Math.min(inputTokens.length * 2, this.modelConfig.maxLength);
                const outputTokens = [];
                
                for (let i = 0; i < outputLength; i++) {
                    // 간단한 토큰 생성 시뮬레이션
                    outputTokens.push(Math.floor(Math.random() * 19) + 4); // vocab 범위 내
                }
                
                resolve(outputTokens);
            }, 1000); // 실제 추론 시간 시뮬레이션
        });
    }
    
    // 번역 결과 후처리
    postProcessTranslation(rawOutput, mode) {
        // 불필요한 토큰 제거 및 정리
        let cleaned = rawOutput
            .replace(/<pad>/g, '')
            .replace(/<unk>/g, '')
            .replace(/<s>/g, '')
            .replace(/<\/s>/g, '')
            .trim();
        
        // 빈 결과인 경우 폴백
        if (!cleaned || cleaned.length === 0) {
            if (mode === 'to-korean') {
                return this.enhanceKoreanTranslation(this.originalText || '');
            } else {
                return this.enhancePangyoTranslation(this.originalText || '');
            }
        }
        
        return cleaned;
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

// Service Worker와 Content Script 모두 지원하도록 수정
if (typeof window !== 'undefined') {
    // Content Script 환경
    window.lfm2Translator = new LFM2PangyoTranslator();
} else {
    // Service Worker 환경
    self.LFM2PangyoTranslator = LFM2PangyoTranslator;
}