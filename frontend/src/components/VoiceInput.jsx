import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';

const LANGUAGE_CODES = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

const VoiceInput = ({ onTranscript, currentValue = '', placeholder = '' }) => {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANGUAGE_CODES[i18n.language] || 'en-IN';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(currentValue + (currentValue ? ' ' : '') + finalTranscript.trim());
        setInterimText('');
      } else {
        setInterimText(interimTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [i18n.language, currentValue, onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = LANGUAGE_CODES[i18n.language] || 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Failed to start recognition:', err);
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
        <MicOff className="w-4 h-4" />
        {t('common.browserNotSupported')}
      </div>
    );
  }

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={toggleListening}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
          isListening
            ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/40'
            : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
        }`}
      >
        {isListening ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Square className="w-4 h-4 fill-current" />
            </motion.div>
            <span>{t('common.listening')}</span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            <span>{t('common.voiceInput')}</span>
          </>
        )}
        {isListening && (
          <motion.span
            className="absolute inset-0 rounded-xl border-2 border-red-400"
            animate={{ scale: [1, 1.1, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full mt-2 left-0 right-0 bg-violet-50 border border-violet-200 rounded-lg p-3 z-10"
          >
            <p className="text-xs font-semibold text-violet-700 mb-1">
              🎤 {t('common.speakNow')}
            </p>
            <p className="text-sm text-slate-700 italic">
              {interimText || '...'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;
