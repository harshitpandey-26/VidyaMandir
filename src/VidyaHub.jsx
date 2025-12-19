import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Mic,
  X,
  Globe,
  Zap,
  Shield,
  Download,
  Share2,
  GraduationCap,
  Home,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";

// AWS Imports
import {
  LexRuntimeV2Client,
  RecognizeTextCommand,
} from "@aws-sdk/client-lex-runtime-v2";
import {
  TranslateClient,
  TranslateTextCommand,
} from "@aws-sdk/client-translate";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { AWS_CONFIG } from "./config/aws-config";

const VidyaBotHub = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState("hi"); // 'hi', 'mr', or 'en'
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVisible, setIsVisible] = useState({});
  const [sessionId] = useState(`session-${Date.now()}`);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // --- AWS Clients ---
  const credentials = fromCognitoIdentityPool({
    clientConfig: { region: AWS_CONFIG.region },
    identityPoolId: AWS_CONFIG.identityPoolId,
  });

  const lexClient = new LexRuntimeV2Client({
    region: AWS_CONFIG.region,
    credentials,
  });
  const translateClient = new TranslateClient({
    region: AWS_CONFIG.region,
    credentials,
  });
  const pollyClient = new PollyClient({
    region: AWS_CONFIG.region,
    credentials,
  });

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("[data-animate]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-IN";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [language]);

  // Toggle voice recording
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert(
        language === "hi"
          ? "आपका ब्राउज़र वॉयस रिकग्निशन को सपोर्ट नहीं करता"
          : "Your browser does not support voice recognition"
      );
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-US";
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // --- Helper: Translate Text ---
  const translateText = async (text, sourceLang, targetLang) => {
    try {
      if (sourceLang === targetLang) return text;
      const command = new TranslateTextCommand({
        Text: text,
        SourceLanguageCode: sourceLang,
        TargetLanguageCode: targetLang,
      });
      const response = await translateClient.send(command);
      return response.TranslatedText;
    } catch (error) {
      console.error("Translation Error:", error);
      return text;
    }
  };

  // --- Helper: Play Audio (Polly) ---
  const playAudio = async (text, langCode) => {
    if (!isAudioEnabled) return;
    try {
      const command = new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: "mp3",
        // Aditi is great for Hindi, Joanna for English
        VoiceId: langCode === "hi" ? "Aditi" : "Joanna",
        LanguageCode: langCode === "hi" ? "hi-IN" : "en-US",
      });
      const response = await pollyClient.send(command);
      const audioBlob = new Blob(
        [await response.AudioStream.transformToByteArray()],
        { type: "audio/mpeg" }
      );
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error("Polly Error:", error);
    }
  };

  // --- Logic: Send Message ---
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: inputText,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const originalInput = inputText;
    setInputText("");
    setIsTyping(true);

    try {
      // 1. Translate User Input to English for Lex (if not already English)
      const englishQuery = await translateText(originalInput, language, "en");

      // 2. Send English text to Lex
      const lexCommand = new RecognizeTextCommand({
        botId: AWS_CONFIG.botId,
        botAliasId: AWS_CONFIG.botAliasId,
        localeId: AWS_CONFIG.localeId,
        sessionId: sessionId,
        text: englishQuery,
      });

      const lexResponse = await lexClient.send(lexCommand);
      const lexReply =
        lexResponse.messages?.[0]?.content ||
        "I'm sorry, I couldn't find an answer.";

      // 3. Translate Lex Response back to User Language
      const finalReply = await translateText(lexReply, "en", language);

      const botResponse = {
        id: Date.now() + 1,
        sender: "bot",
        text: finalReply,
        time: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);

      // 4. Play Audio of the response
      playAudio(finalReply, language);
    } catch (error) {
      console.error("AWS Lex Error:", error);

      // Show error message to user
      const errorMessage = {
        id: messages.length + 2,
        sender: "bot",
        text:
          language === "hi"
            ? "क्षमा करें, कुछ गलत हो गया। कृपया दोबारा प्रयास करें।"
            : "Sorry, something went wrong. Please try again.",
        time: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    { hi: "प्रवेश शुल्क क्या है?", en: "What is the admission fee?" },
    { hi: "कौन से दस्तावेज़ चाहिए?", en: "What documents are needed?" },
    { hi: "कक्षा का समय क्या है?", en: "What are class timings?" },
    { hi: "परिणाम कब आएंगे?", en: "When will results come?" },
  ];

  const content = {
    hi: {
      tagline: "स्कूल प्रवेश आसान बनाया",
      hero: "अपनी भाषा में सवाल पूछें",
      subhero: "स्कूल प्रवेश, फीस और समय के बारे में तुरंत जवाब पाएं",
      startChat: "बातचीत शुरू करें",
      features: [
        {
          title: "अपनी भाषा बोलें 🗣️",
          desc: "हिंदी, अंग्रेजी और क्षेत्रीय भाषाओं में उपलब्ध",
        },
        { title: "आवाज़ और टेक्स्ट 🎤", desc: "अपने सवाल टाइप करें या बोलें" },
        { title: "तुरंत जवाब ⚡", desc: "AWS AI द्वारा संचालित" },
      ],
      howItWorks: "यह कैसे काम करता है",
      steps: [
        "अपना सवाल पूछें",
        "AI समझता है और खोजता है",
        "अपनी भाषा में जवाब पाएं",
      ],
      placeholder: "अपना सवाल लिखें...",
      welcomeMsg:
        "नमस्ते! मैं Vidya-Bot हूं। स्कूल प्रवेश के बारे में कुछ भी पूछें। 🙏",
    },
    en: {
      tagline: "School Admissions Made Easy",
      hero: "Ask Questions in Your Language",
      subhero:
        "Get instant answers about school admissions, fees, and schedules",
      startChat: "Start Chat",
      features: [
        {
          title: "Speak Your Language 🗣️",
          desc: "Available in Hindi, English, and regional languages",
        },
        {
          title: "Voice & Text Support 🎤",
          desc: "Type or speak your questions naturally",
        },
        {
          title: "Instant AI Answers ⚡",
          desc: "Powered by AWS AI to answer instantly",
        },
      ],
      howItWorks: "How It Works",
      steps: [
        "Ask Your Question",
        "AI Understands & Searches",
        "Get Answer in Your Language",
      ],
      placeholder: "Type your question...",
      welcomeMsg:
        "Hello! I'm Vidya-Bot. Ask me anything about school admissions. 🙏",
    },
  };

  const t = content[language];

  const startNewChat = () => {
    setCurrentPage("chat");
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          sender: "bot",
          text: t.welcomeMsg,
          time: new Date(),
        },
      ]);
    }
  };

  // HOME PAGE
  if (currentPage === "home") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-8 h-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Vidya-Bot 🎓
                  </h1>
                  <p className="text-xs text-gray-600">{t.tagline}</p>
                </div>
              </div>
              <button
                onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <Globe className="w-4 h-4" />
                <span className="font-semibold">
                  {language === "hi" ? "EN" : "हिं"}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-pink-50 to-indigo-100 opacity-50"></div>
          <div
            className="max-w-4xl mx-auto text-center relative z-10"
            id="hero"
            data-animate
          >
            <h2
              className={`text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent transition-all duration-700 ${
                isVisible.hero
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              {t.hero}
            </h2>
            <p className="text-xl text-gray-700 mb-8">{t.subhero}</p>

            <button
              onClick={startNewChat}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-pulse hover:animate-none"
            >
              <span className="flex items-center space-x-2">
                <MessageCircle className="w-6 h-6" />
                <span>{t.startChat}</span>
              </span>
            </button>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    startNewChat();
                    setTimeout(() => setInputText(q[language]), 100);
                  }}
                  className="px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 text-sm text-gray-700 hover:bg-purple-50 hover:scale-105"
                >
                  {q[language]}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute top-10 left-10 w-20 h-20 bg-purple-300 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-300 rounded-full opacity-20 animate-pulse"></div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-white" id="features" data-animate>
          <div
            className={`max-w-6xl mx-auto transition-all duration-700 ${
              isVisible.features
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="grid md:grid-cols-3 gap-8">
              {t.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  <div className="text-4xl mb-4">
                    {feature.title.split(" ")[0]}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4" id="how-it-works" data-animate>
          <div
            className={`max-w-5xl mx-auto transition-all duration-700 ${
              isVisible["how-it-works"]
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
              {t.howItWorks}
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
              {t.steps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center text-center max-w-xs">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">
                      {idx + 1}
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {step}
                    </p>
                  </div>
                  {idx < t.steps.length - 1 && (
                    <div className="hidden md:block w-24 h-1 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-12 px-4 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-center">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-gray-700">Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-yellow-600" />
              <span className="font-semibold text-gray-700">Free to Use</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-gray-700">
                Privacy Protected
              </span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm text-gray-400 mb-4">
              Powered by AWS | Built with ❤️ for Rural Education
            </p>
            <div className="flex justify-center space-x-4">
              <button className="hover:text-purple-400 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="hover:text-purple-400 transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // CHAT PAGE
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Chat Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm z-40 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage("home")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Home className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Vidya-Bot</h1>
                  <p className="text-xs text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setLanguage(language === "hi" ? "en" : "hi")}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Globe className="w-4 h-4" />
              <span className="font-semibold">
                {language === "hi" ? "EN" : "हिं"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl rounded-br-md"
                    : "bg-white text-gray-800 shadow-md rounded-3xl rounded-bl-md border border-gray-100"
                } px-6 py-4`}
              >
                <p className="text-base leading-relaxed">{msg.text}</p>
                <p
                  className={`text-xs mt-2 ${
                    msg.sender === "user" ? "text-purple-100" : "text-gray-400"
                  }`}
                >
                  {msg.time.toLocaleTimeString(
                    language === "hi" ? "hi-IN" : "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white px-6 py-4 rounded-3xl shadow-md border border-gray-100">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"></div>
                  <div
                    className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Questions (shown when chat is empty or few messages) */}
      {messages.length <= 2 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(q[language])}
                  className="px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 text-sm text-gray-700 hover:bg-purple-50 hover:scale-105 border border-gray-200"
                >
                  {q[language]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={t.placeholder}
                rows={1}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-base"
                style={{ minHeight: "56px", maxHeight: "200px" }}
              />
            </div>

            <button
              onClick={toggleRecording}
              className={`p-4 rounded-full transition-all duration-300 hover:scale-110 ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:scale-110 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-3">
            {language === "hi"
              ? "Vidya-Bot गलतियां कर सकता है। महत्वपूर्ण जानकारी की जांच करें।"
              : "Vidya-Bot can make mistakes. Check important info."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VidyaBotHub;
