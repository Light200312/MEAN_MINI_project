import { Context } from "../../context/Context";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useState, useContext, useRef } from "react";
import { Image, Mic, Send, Sparkles, X, Loader2 } from "lucide-react";
import { assets } from "../../assets/assets";

// Import Council Stages
import Stage1 from "../../components2/Stage1";
import Stage2 from "../../components2/Stage2";
import Stage3 from "../../components2/Stage3";

import "../../App.css";

const Main = () => {
  const {
    input,
    setInput,
    currentChat,
    currentConversation,
    loading,
    isLLMLoading,
    onSent,
    handleSendLLMMessage,
    PageView,
    currentConversationId,
    loadConversations,
    loadConversation,
    chatError,
    setChatError,
  } = useContext(Context);

  const [listening, setListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const chatContainerRef = useRef(null);

  const isLLM = PageView === "llm-chat";

  // Load conversation data when in LLM Mode
  useEffect(() => {
    if (isLLM) {
      loadConversations();
      if (currentConversationId) {
        loadConversation(currentConversationId);
      }
    }
  }, [isLLM, currentConversationId, loadConversations, loadConversation]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [currentChat, currentConversation, loading, isLLMLoading]);

  const handleSendMessage = () => {
    if (input.trim() || (selectedImage && !isLLM)) {
      const message = input;
      setInput("");
      if (isLLM) {
        handleSendLLMMessage(message);
      } else {
        onSent(message, selectedImage);
      }
      setSelectedImage(null);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition)
      return alert("Speech recognition not supported in this browser.");
    const recognition = new SpeechRecognition();
    recognition.start();
    setListening(true);
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
  };

  const activeChat = isLLM ? currentConversation : currentChat;
  const chatMessages =
    activeChat?.messages || (Array.isArray(activeChat) ? activeChat : []);
  const isActiveLoading = isLLM ? isLLMLoading : loading;

  return (
    <div className="flex-1 h-screen bg-white dark:bg-slate-950 dark:text-gray-100 flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between font-semibold p-4 border-b dark:border-slate-800">
        <div className="flex items-center gap-2">
          {isLLM ?
            <Sparkles className="text-purple-500 animate-pulse" size={20} />
            : <div className="w-3 h-3 bg-blue-500 rounded-full" />}
          <h1 className="text-lg text-gray-700 dark:text-gray-200">
            {isLLM ? "LLM Council" : "Normal AiChat"}
          </h1>
        </div>
        <img
          src={assets.user_icon}
          className="w-8 h-8 rounded-full border dark:border-slate-700"
          alt="user"
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
        {/* ✅ ERROR MESSAGE DISPLAY */}
        {chatError && !isLLM && (
          <div className="max-w-4xl mx-auto m-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-red-700 dark:text-red-400">Error</p>
              <p className="text-sm text-red-600 dark:text-red-300">{chatError}</p>
            </div>
            <button
              onClick={() => setChatError("")}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {chatMessages.length === 0 ?
          /* PREVIOUS STYLE: Left-aligned Gradient Welcome */
          <div className="max-w-4xl mx-auto mt-12 px-6">
            <div className="text-5xl font-semibold">
              <p className="bg-linear-to-r from-[#4b90ff] to-[#ff5546] bg-clip-text text-transparent inline-block">
                {isLLM ? "Hello, Council User" : "Hello, User"}
              </p>
            </div>
            <p className="text-4xl text-gray-300 dark:text-gray-700 font-medium mt-2">
              {isLLM ?
                "How can the council assist your query?"
                : "How can I help you today?"}
            </p>
          </div>
          : <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
            {chatMessages.map((msg, index) => (
              <div key={index} className="flex flex-col">
                {msg.role === "user" ?
                  /* User Message */
                  <div className="flex items-start gap-4 justify-end mb-4">
                    <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-2xl max-w-[80%] shadow-sm">
                      {/* Fix: className moved to wrapper div */}
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none 
    prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent
    prose-headings:font-semibold prose-headings:text-slate-900 
    dark:prose-headings:text-slate-100 text-base md:text-lg"
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text || msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    <img
                      src={assets.user_icon}
                      className="w-8 h-8 rounded-full border dark:border-slate-700"
                      alt=""
                    />
                  </div>
                  : /* Assistant / Council Message */
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-slate-800 rounded-full h-fit shadow-sm">
                      <Sparkles
                        size={20}
                        className={isLLM ? "text-purple-500" : "text-blue-500"}
                      />
                    </div>
                    <div className="flex-1 space-y-6 overflow-hidden">
                      {/* Normal Normal AiChat Mode */}
                      {!isLLM && (
                        <div
                          className="
            prose prose-slate dark:prose-invert 
            max-w-none 
            prose-p:leading-relaxed 
            prose-pre:bg-slate-900 
            prose-pre:text-white 
            prose-pre:rounded-xl 
            prose-pre:p-4
            prose-code:text-pink-500
            prose-headings:font-semibold
            text-base md:text-[16px]
          "
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text || msg.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* LLM Council Mode (Multi-Stage Rendering) */}
                      {isLLM && (
                        <div className="space-y-8">
                          {/* Stage 1 */}
                          {msg.loading?.stage1 && (
                            <div className="flex items-center gap-3 text-sm text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                              <Loader2 className="animate-spin" size={16} />
                              <span>
                                Gathering individual insights from models...
                              </span>
                            </div>
                          )}
                          {msg.stage1 && <Stage1 responses={msg.stage1} />}

                          {/* Stage 2 */}
                          {msg.loading?.stage2 && (
                            <div className="flex items-center gap-3 text-sm text-amber-500 bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
                              <Loader2 className="animate-spin" size={16} />
                              <span>
                                Ranking and Peer Reviewing responses...
                              </span>
                            </div>
                          )}
                          {msg.stage2 && (
                            <Stage2
                              rankings={msg.stage2}
                              labelToModel={msg.metadata?.label_to_model}
                              aggregateRankings={
                                msg.metadata?.aggregate_rankings
                              }
                            />
                          )}

                          {/* Stage 3 */}
                          {msg.loading?.stage3 && (
                            <div className="flex items-center gap-3 text-sm text-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                              <Loader2 className="animate-spin" size={16} />
                              <span>
                                Drafting final peer-reviewed consensus...
                              </span>
                            </div>
                          )}
                          {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
                        </div>
                      )}
                    </div>
                  </div>
                }
              </div>
            ))}
          </div>
        }

        {/* ANIMATED LOADING SKELETON */}
        {isActiveLoading && (
          <div className="max-w-4xl mx-auto px-16 py-4">
            <div className="flex flex-col gap-2 w-full animate-pulse">
              <hr className="rounded-md border-none bg-gray-100 dark:bg-slate-800 h-4 bg-linear-to-r from-[#81afff] via-[#ffffff] to-[#81afff] bg-size-[800px_50px]" />
              <hr className="rounded-md border-none bg-gray-100 dark:bg-slate-800 h-4 bg-linear-to-r from-[#81afff] via-[#ffffff] to-[#81afff] bg-size-[800px_50px]" />
              <hr className="rounded-md border-none bg-gray-100 dark:bg-slate-800 h-4 w-[70%] bg-linear-to-r from-[#81afff] via-[#ffffff] to-[#81afff] bg-size-[800px_50px]" />
            </div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto relative group">
          {selectedImage && !isLLM && (
            <div className="relative w-20 h-20 mb-3 border-2 border-blue-500 rounded-xl overflow-hidden shadow-lg">
              <img
                src={selectedImage}
                className="w-full h-full object-cover"
                alt="upload preview"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg shadow-md hover:bg-red-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 bg-gray-100 dark:bg-slate-900 px-6 py-3 rounded-full border dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-sm">
            <textarea
              className="flex-1 bg-transparent border-none outline-none text-base py-1 resize-none max-h-40 overflow-y-auto"
              placeholder={
                isLLM ? "Consult the Council Experts..." : "Enter a prompt here"
              }
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex items-center gap-4 text-gray-400">
              {/* Images usually only supported in standard chat mode */}
              {!isLLM && (
                <label className="cursor-pointer hover:text-blue-500 transition-colors">
                  <Image size={20} />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onloadend = () => setSelectedImage(reader.result);
                      if (file) reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
              <Mic
                size={20}
                className={`cursor-pointer transition-colors ${listening ? "text-red-500" : "hover:text-blue-500"}`}
                onClick={startListening}
              />
              {(input || selectedImage) && (
                <button
                  onClick={handleSendMessage}
                  className="text-blue-600 hover:scale-110 active:scale-95 transition-all p-1"
                >
                  <Send size={22} />
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-center text-gray-500 mt-3 font-medium tracking-wide">
            Normal AiChat may display inaccurate info. Always verify the
            Council's final synthesis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;
