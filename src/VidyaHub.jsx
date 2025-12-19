import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Mic, X, Globe, Zap, MessageSquare, Phone, Shield, Download, Share2, GraduationCap } from 'lucide-react';

const VidyaBotHub = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'नमस्ते! स्कूल के बारे में कुछ भी पूछें। 🙏', time: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState('hi');
  const [isVisible, setIsVisible] = useState({});
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Handle sending messages
  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputText,
      time: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // TODO: AWS Integration - Replace with actual Lex API call
    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        sender: 'bot',
        text: language === 'hi' 
          ? 'मैं आपकी मदद कर सकता हूं! प्रवेश शुल्क ₹500 है। क्या आपको और जानकारी चाहिए?' 
          : 'I can help you! The admission fee is ₹500. Do you need more information?',
        time: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const quickQuestions = [
    { hi: 'प्रवेश शुल्क क्या है?', en: 'What is the admission fee?' },
    { hi: 'कौन से दस्तावेज़ चाहिए?', en: 'What documents are needed?' },
    { hi: 'कक्षा का समय क्या है?', en: 'What are class timings?' },
    { hi: 'परिणाम कब आएंगे?', en: 'When will results come?' }
  ];

  const content = {
    hi: {
      tagline: 'स्कूल प्रवेश आसान बनाया',
      hero: 'अपनी भाषा में सवाल पूछें',
      subhero: 'स्कूल प्रवेश, फीस और समय के बारे में तुरंत जवाब पाएं',
      startChat: 'बातचीत शुरू करें',
      features: [
        { title: 'अपनी भाषा बोलें 🗣️', desc: 'हिंदी, अंग्रेजी और क्षेत्रीय भाषाओं में उपलब्ध' },
        { title: 'आवाज़ और टेक्स्ट 🎤', desc: 'अपने सवाल टाइप करें या बोलें' },
        { title: 'तुरंत जवाब ⚡', desc: 'AWS AI द्वारा संचालित' }
      ],
      howItWorks: 'यह कैसे काम करता है',
      steps: [
        'अपना सवाल पूछें',
        'AI समझता है और खोजता है',
        'अपनी भाषा में जवाब पाएं'
      ]
    },
    en: {
      tagline: 'School Admissions Made Easy',
      hero: 'Ask Questions in Your Language',
      subhero: 'Get instant answers about school admissions, fees, and schedules',
      startChat: 'Start Chat',
      features: [
        { title: 'Speak Your Language 🗣️', desc: 'Available in Hindi, English, and regional languages' },
        { title: 'Voice & Text Support 🎤', desc: 'Type or speak your questions naturally' },
        { title: 'Instant AI Answers ⚡', desc: 'Powered by AWS AI to answer instantly' }
      ],
      howItWorks: 'How It Works',
      steps: [
        'Ask Your Question',
        'AI Understands & Searches',
        'Get Answer in Your Language'
      ]
    }
  };

  const t = content[language];

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
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Globe className="w-4 h-4" />
              <span className="font-semibold">{language === 'hi' ? 'EN' : 'हिं'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-pink-50 to-indigo-100 opacity-50"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10" id="hero" data-animate>
          <h2 className={`text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent transition-all duration-700 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {t.hero}
          </h2>
          <p className="text-xl text-gray-700 mb-8">{t.subhero}</p>
          
          <button
            onClick={() => setIsChatOpen(true)}
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-pulse hover:animate-none"
          >
            <span className="flex items-center space-x-2">
              <MessageCircle className="w-6 h-6" />
              <span>{t.startChat}</span>
            </span>
          </button>

          {/* Quick Questions */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsChatOpen(true);
                  setInputText(q[language]);
                }}
                className="px-4 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 text-sm text-gray-700 hover:bg-purple-50 hover:scale-105"
              >
                {q[language]}
              </button>
            ))}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-300 rounded-full opacity-20 animate-pulse"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white" id="features" data-animate>
        <div className={`max-w-6xl mx-auto transition-all duration-700 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="grid md:grid-cols-3 gap-8">
            {t.features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="text-4xl mb-4">{feature.title.split(' ')[0]}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4" id="how-it-works" data-animate>
        <div className={`max-w-5xl mx-auto transition-all duration-700 ${isVisible['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">{t.howItWorks}</h2>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
            {t.steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center text-center max-w-xs">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">
                    {idx + 1}
                  </div>
                  <p className="text-lg font-semibold text-gray-800">{step}</p>
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
            <span className="font-semibold text-gray-700">Privacy Protected</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-400 mb-4">Powered by AWS | Built with ❤️ for Rural Education</p>
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

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-50 animate-bounce hover:animate-none"
        >
          <MessageCircle className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">1</span>
        </button>
      )}

      {/* Chat Widget */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-full md:w-96 h-[600px] max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300 md:max-w-md">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-3xl flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold">Vidya-Bot</h3>
                <p className="text-xs flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-md rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-white px-4 py-3 rounded-2xl shadow-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t rounded-b-3xl">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={language === 'hi' ? 'अपना सवाल लिखें...' : 'Type your question...'}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
              <button className="p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-all">
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VidyaBotHub;