// Global type declarations for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class SpeechRecognitionManager {
  private recognition: any | null = null;
  private isListening = false;
  
  constructor(
    private language: string,
    private onResult: (transcript: string, isFinal: boolean) => void,
    private onError: (error: string) => void,
    private onStart: () => void,
    private onEnd: () => void
  ) {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    if (!this.isSupported()) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.getLanguageCode();

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStart();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onEnd();
      };

      this.recognition.onresult = (event) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        this.onResult(transcript, isFinal);
      };

      this.recognition.onerror = (event) => {
        this.onError(this.getErrorMessage(event.error));
      };
    }
  }

  private getLanguageCode(): string {
    switch (this.language) {
      case 'pt': return 'pt-BR';
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      default: return 'pt-BR';
    }
  }

  private getErrorMessage(error: string): string {
    switch (error) {
      case 'no-speech': return 'Nenhuma fala detectada. Tente novamente.';
      case 'audio-capture': return 'Erro ao acessar o microfone.';
      case 'not-allowed': return 'Permissão de microfone negada.';
      case 'network': return 'Erro de conexão. Verifique sua internet.';
      default: return 'Erro no reconhecimento de voz.';
    }
  }

  public start(): boolean {
    if (!this.recognition || this.isListening) {
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      this.onError('Erro ao iniciar reconhecimento de voz');
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public updateLanguage(language: string): void {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = this.getLanguageCode();
    }
  }
}

export class SpeechSynthesisManager {
  private synthesis: SpeechSynthesis;
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    private language: string,
    private onStart: () => void,
    private onEnd: () => void,
    private onError: (error: string) => void
  ) {
    this.synthesis = window.speechSynthesis;
  }

  public speak(text: string): boolean {
    if (!this.isSupported()) {
      this.onError('Síntese de voz não suportada neste navegador');
      return false;
    }

    // Stop any current speech
    this.stop();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = this.getLanguageCode();
    this.currentUtterance.rate = 0.9;
    this.currentUtterance.pitch = 1;
    this.currentUtterance.volume = 0.8;

    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
      this.onStart();
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.onEnd();
    };

    this.currentUtterance.onerror = (event) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      // "interrupted" is not a real error - it happens when the user stops speech
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        this.onError(`Erro na síntese de voz: ${event.error}`);
      } else {
        // Just call onEnd for graceful stop
        this.onEnd();
      }
    };

    // Select the best voice for the language
    const voices = this.synthesis.getVoices();
    const preferredVoice = this.selectBestVoice(voices);
    if (preferredVoice) {
      this.currentUtterance.voice = preferredVoice;
    }

    this.synthesis.speak(this.currentUtterance);
    return true;
  }

  private selectBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const langCode = this.getLanguageCode();
    const langPrefix = langCode.split('-')[0];
    
    // Filter voices by language
    const languageVoices = voices.filter(voice => 
      voice.lang.startsWith(langPrefix)
    );
    
    // Prefer female voices for PrIscA (she's a woman!)
    // Common female voice name patterns across browsers
    const femalePatterns = [
      /female/i, /mulher/i, /mujer/i, /woman/i,
      /maria/i, /lucia/i, /luciana/i, /fernanda/i, /ana/i,
      /google.*female/i, /microsoft.*female/i,
      // Portuguese female voices
      /vitória/i, /francisca/i, /raquel/i, /catarina/i,
      // English female voices  
      /samantha/i, /victoria/i, /karen/i, /moira/i, /tessa/i, /fiona/i,
      // Spanish female voices
      /mónica/i, /paulina/i, /helena/i
    ];
    
    // Try to find a female voice
    const femaleVoice = languageVoices.find(voice => 
      femalePatterns.some(pattern => pattern.test(voice.name))
    );
    
    if (femaleVoice) {
      console.log('🎤 Selected female voice for PrIscA:', femaleVoice.name);
      return femaleVoice;
    }
    
    // If no explicit female voice found, try local voices first (usually better quality)
    const localVoices = languageVoices.filter(voice => voice.localService);
    if (localVoices.length > 0) {
      console.log('🎤 Using local voice:', localVoices[0].name);
      return localVoices[0];
    }
    
    // Fallback to any voice in the target language
    if (languageVoices.length > 0) {
      console.log('🎤 Using fallback voice:', languageVoices[0].name);
      return languageVoices[0];
    }
    
    return null;
  }

  private getLanguageCode(): string {
    switch (this.language) {
      case 'pt': return 'pt-BR';
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      default: return 'pt-BR';
    }
  }

  public stop(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  public pause(): void {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  public resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  public isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public updateLanguage(language: string): void {
    this.language = language;
  }
}

// Browser capability detection
export const getBrowserSpeechCapabilities = () => {
  return {
    speechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    speechSynthesis: 'speechSynthesis' in window,
    mediaDevices: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
  };
};
