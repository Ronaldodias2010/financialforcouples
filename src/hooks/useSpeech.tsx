import { useState, useEffect, useCallback, useRef } from 'react';
import { SpeechRecognitionManager, SpeechSynthesisManager, getBrowserSpeechCapabilities } from '@/utils/speechUtils';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';

interface UseSpeechProps {
  onTranscription?: (text: string, isFinal: boolean) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  autoSpeak?: boolean;
}

export const useSpeech = (props: UseSpeechProps = {}) => {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [capabilities, setCapabilities] = useState(getBrowserSpeechCapabilities());
  
  const speechRecognitionRef = useRef<SpeechRecognitionManager | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisManager | null>(null);

  // Initialize speech managers
  useEffect(() => {
    const initManagers = () => {
      // Speech Recognition Manager
      if (capabilities.speechRecognition) {
        speechRecognitionRef.current = new SpeechRecognitionManager(
          language,
          (transcript, isFinal) => {
            setCurrentTranscript(transcript);
            props.onTranscription?.(transcript, isFinal);
            
            if (isFinal) {
              setCurrentTranscript('');
            }
          },
          (error) => {
            console.error('Speech recognition error:', error);
            toast({
              title: t('voice.error'),
              description: error,
              variant: "destructive"
            });
            setIsListening(false);
          },
          () => {
            setIsListening(true);
            props.onSpeechStart?.();
          },
          () => {
            setIsListening(false);
            setCurrentTranscript('');
            props.onSpeechEnd?.();
          }
        );
      }

      // Speech Synthesis Manager
      if (capabilities.speechSynthesis) {
        speechSynthesisRef.current = new SpeechSynthesisManager(
          language,
          () => setIsSpeaking(true),
          () => setIsSpeaking(false),
          (error) => {
            console.error('Speech synthesis error:', error);
            toast({
              title: t('voice.error'),
              description: error,
              variant: "destructive"
            });
          }
        );
      }
    };

    initManagers();
  }, [language, t, toast, capabilities, props]);

  // Update language when it changes
  useEffect(() => {
    speechRecognitionRef.current?.updateLanguage(language);
    speechSynthesisRef.current?.updateLanguage(language);
  }, [language]);

  // Check microphone permission
  const checkPermission = useCallback(async () => {
    if (!capabilities.mediaDevices) {
      setPermissionGranted(false);
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      return true;
    } catch (error) {
      setPermissionGranted(false);
      toast({
        title: t('voice.permissionDenied'),
        description: t('voice.permissionDeniedDesc'),
        variant: "destructive"
      });
      return false;
    }
  }, [capabilities.mediaDevices, t, toast]);

  // Start listening
  const startListening = useCallback(async () => {
    if (!capabilities.speechRecognition) {
      toast({
        title: t('voice.notSupported'),
        description: t('voice.notSupportedDesc'),
        variant: "destructive"
      });
      return false;
    }

    const hasPermission = await checkPermission();
    if (!hasPermission) {
      return false;
    }

    const started = speechRecognitionRef.current?.start();
    if (!started) {
      toast({
        title: t('voice.error'),
        description: t('voice.startError'),
        variant: "destructive"
      });
    }
    return started || false;
  }, [capabilities.speechRecognition, checkPermission, t, toast]);

  // Stop listening
  const stopListening = useCallback(() => {
    speechRecognitionRef.current?.stop();
  }, []);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!capabilities.speechSynthesis) {
      toast({
        title: t('voice.notSupported'),
        description: t('voice.synthNotSupportedDesc'),
        variant: "destructive"
      });
      return false;
    }

    return speechSynthesisRef.current?.speak(text) || false;
  }, [capabilities.speechSynthesis, t, toast]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    speechSynthesisRef.current?.stop();
  }, []);

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Toggle speaking
  const toggleSpeaking = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
    }
  }, [isSpeaking, stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechRecognitionRef.current?.stop();
      speechSynthesisRef.current?.stop();
    };
  }, []);

  return {
    // States
    isListening,
    isSpeaking,
    currentTranscript,
    permissionGranted,
    capabilities,
    
    // Actions
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    toggleSpeaking,
    checkPermission,
    
    // Utils
    isSupported: capabilities.speechRecognition || capabilities.speechSynthesis
  };
};