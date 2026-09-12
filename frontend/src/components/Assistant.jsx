// frontend/src/components/Assistant.jsx
import React, { useState, useEffect, useRef } from 'react';
import { weatherApi } from '../api';
import './Assistant.css';

const QUICK_PROMPTS = {
  en: [
    { icon: '🏃', text: 'Can I go running at 5 PM?' },
    { icon: '🌧️', text: 'Will rain affect my event?' },
    { icon: '🎒', text: 'What should I prepare for tomorrow?' }
  ],
  hi: [
    { icon: '🏃', text: 'क्या मैं शाम 5 बजे दौड़ने जा सकता हूँ?' },
    { icon: '🌧️', text: 'क्या बारिश मेरे कार्यक्रम को प्रभावित करेगी?' },
    { icon: '🎒', text: 'कल के लिए मुझे क्या तैयारी करनी चाहिए?' }
  ]
};

// UI copy for the assistant popup only - the rest of the app stays English
// for now (translating every screen is a bigger, separate job). langCode is
// what speech recognition/synthesis use - the '-IN' variants recognize
// Indian accents/pronunciation noticeably better than plain 'en-US'.
// NOTE: Hindi strings were written by Claude, not a native speaker - worth
// a quick sanity check from a Hindi speaker on your team before a live demo.
const STRINGS = {
  en: {
    langCode: 'en-IN',
    intro: (persona, city) =>
      `Answers factor in your ${persona.toLowerCase()} persona and ${city}'s live weather - not a generic forecast.`,
    placeholder: 'Ask anything about the weather for your plans...',
    ask: 'Ask',
    thinking: 'Thinking...',
    listening: 'Listening...',
    q: 'Q:',
    a: 'A:',
    meta: 'AI Smart Assistant',
    micTitle: 'Ask by voice',
    micUnsupported: '🎤 Voice input is not supported in this browser',
    micError: 'Could not hear that clearly - please try again or type your question.',
    speakOn: '🔊 Voice replies: on',
    speakOff: '🔇 Voice replies: off',
    close: 'Close chat',
    genericError: 'Failed to get response.'
  },
  hi: {
    langCode: 'hi-IN',
    intro: (persona, city) =>
      `जवाब आपकी ${persona.toLowerCase()} प्रोफ़ाइल और ${city} के लाइव मौसम पर आधारित हैं - सामान्य पूर्वानुमान नहीं।`,
    placeholder: 'अपनी योजनाओं के बारे में मौसम से जुड़ा कोई भी सवाल पूछें...',
    ask: 'पूछें',
    thinking: 'सोच रहा हूँ...',
    listening: 'सुन रहा हूँ...',
    q: 'सवाल:',
    a: 'जवाब:',
    meta: 'AI स्मार्ट असिस्टेंट',
    micTitle: 'आवाज़ से पूछें',
    micUnsupported: '🎤 इस ब्राउज़र में आवाज़ से पूछने की सुविधा उपलब्ध नहीं है',
    micError: 'आवाज़ ठीक से समझ नहीं आई - कृपया दोबारा बोलें या टाइप करके पूछें।',
    speakOn: '🔊 आवाज़ में जवाब: चालू',
    speakOff: '🔇 आवाज़ में जवाब: बंद',
    close: 'बंद करें',
    genericError: 'जवाब नहीं मिल सका।'
  }
};

// Chrome/Edge (desktop and Android) support this; Safari/iOS support is
// inconsistent, so the mic button below only renders when it's available -
// everyone else just sees the text input, same as before.
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

function Assistant({ city, persona }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(true);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const t = STRINGS[language];

  // Reads the answer aloud - the main accessibility win for a user who
  // can't (or would rather not) read English/Hindi text on screen.
  const speak = (text) => {
    if (!speakEnabled || !('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel(); // don't let answers stack/overlap
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = t.langCode;
    window.speechSynthesis.speak(utterance);
  };

  const ask = async (text) => {
    const finalQuestion = (text ?? question).trim();
    if (!finalQuestion) return;

    setQuestion(finalQuestion);
    setLoading(true);
    setError(null);
    try {
      const res = await weatherApi.askAssistant({ prompt: finalQuestion, city, persona, language });
      setResponse(res.data);
      speak(res.data.reply);
    } catch (err) {
      setError(err.response?.data?.reply || err.response?.data?.error || t.genericError);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = (e) => {
    e.preventDefault();
    ask();
  };

  // Tapping the mic starts listening; tapping again while listening stops
  // it early. A successful result auto-submits the question - the whole
  // point is not making someone speak AND then also find a send button.
  const startListening = () => {
    if (!SpeechRecognitionAPI) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = t.langCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      ask(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      setError(t.micError);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    setError(null);
    recognition.start();
  };

  // Stop any in-flight listening/speaking when the popup closes, so the
  // mic or the voice reply doesn't keep running in the background.
  useEffect(() => {
    if (!chatOpen) {
      recognitionRef.current?.stop();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  }, [chatOpen]);

  // Escape closes the popup, and the input auto-focuses on open.
  useEffect(() => {
    if (!chatOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setChatOpen(false); };
    window.addEventListener('keydown', onKey);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(focusTimer);
    };
  }, [chatOpen]);

  return (
    <>
      {/* Just a small icon now, sized to sit in the header row next to
          "Change location" - no reserved block on the page at all.
          Everything (chips, input, answer) lives in the popup. */}
      <button
        className="assistant-icon-btn"
        onClick={() => setChatOpen(true)}
        aria-label="Ask MAUSAM AI - your personalized weather assistant"
        title="Ask MAUSAM AI"
      >
        <span className="assistant-icon-emoji">🤖</span>
        <span className="assistant-icon-spark">✨</span>
      </button>

      {chatOpen && (
        <div className="assistant-overlay" onClick={() => setChatOpen(false)}>
          <div className="assistant-modal" onClick={(e) => e.stopPropagation()}>
            <div className="assistant-modal-header">
              <div>
                <h3>🤖 MAUSAM AI</h3>
                <span className="assistant-modal-sub">📍 {city} · {persona}</span>
              </div>
              <div className="assistant-header-actions">
                <div className="lang-toggle" role="group" aria-label="Choose language">
                  <button
                    type="button"
                    className={language === 'en' ? 'lang-btn active' : 'lang-btn'}
                    onClick={() => setLanguage('en')}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={language === 'hi' ? 'lang-btn active' : 'lang-btn'}
                    onClick={() => setLanguage('hi')}
                  >
                    हिंदी
                  </button>
                </div>
                <button className="assistant-close" onClick={() => setChatOpen(false)} aria-label={t.close}>✕</button>
              </div>
            </div>

            <p className="assistant-modal-intro">{t.intro(persona, city)}</p>

            <div className="quick-prompts">
              {QUICK_PROMPTS[language].map(({ icon, text }, idx) => (
                <button key={idx} className="quick-prompt-btn" onClick={() => ask(text)}>
                  <span>{icon}</span> {text}
                </button>
              ))}
            </div>

            <form onSubmit={handleAsk} className="assistant-form">
              {SpeechRecognitionAPI && (
                <button
                  type="button"
                  className={listening ? 'mic-btn listening' : 'mic-btn'}
                  onClick={startListening}
                  title={t.micTitle}
                  aria-label={t.micTitle}
                >
                  🎤
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={listening ? t.listening : t.placeholder}
                className="assistant-input"
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t.thinking : t.ask}
              </button>
            </form>

            <div className="assistant-footer-row">
              {!SpeechRecognitionAPI && <span className="mic-unsupported-note">{t.micUnsupported}</span>}
              <button type="button" className="speak-toggle" onClick={() => setSpeakEnabled((prev) => !prev)}>
                {speakEnabled ? t.speakOn : t.speakOff}
              </button>
            </div>

            {error && <div className="assistant-error">{error}</div>}

            {response && (
              <div className="assistant-response">
                <div className="response-question">{t.q} {question}</div>
                <div className="response-answer">{t.a} {response.reply}</div>
                <div className="response-meta">
                  <span>{t.meta}</span>
                  <span>📍 {city} · {persona}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Assistant;