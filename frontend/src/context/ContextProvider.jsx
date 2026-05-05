import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import axios from "axios";
import { Context } from "./Context";

const ContextProvider = ({ children }) => {

  // =========================
  // AUTH STATE
  // =========================
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("council_user")) || null
  );
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  // ✅ INITIALIZE AUTH ON MOUNT
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("council_user")) || null;
    setUser(savedUser);
    setIsAuthInitialized(true);
  }, []);

  // =========================
  // NORMAL CHAT STATE
  // =========================
  const [input, setInput] = useState("");
  const [PageView, setPageView] = useState("llm-chat");
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [chatError, setChatError] = useState("");

  const [currentChat, setCurrentChat] = useState({
    id: Date.now(),
    messages: [],
  });

  const [chats, setChats] = useState([]);

  // =========================
  // LLM COUNCIL STATE
  // =========================
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLLMLoading, setIsLLMLoading] = useState(false);

  // =========================
  // AUTH FUNCTIONS
  // =========================

  const login = async (email, password) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });

      setUser(res.data);
      localStorage.setItem("council_user", JSON.stringify(res.data));

      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Login failed";

      return { success: false, message: errorMessage };
    }
  };

  const register = async (username, email, password) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";
      await axios.post(`${API_BASE}/api/auth/register`, {
        username,
        email,
        password,
      });

      return await login(email, password);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Registration failed";

      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    setConversations([]);
    setCurrentConversation(null);
    localStorage.removeItem("council_user");
  };

  // =========================
  // CONVERSATION FUNCTIONS
  // =========================

  const loadConversations = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      const convs = await api.listConversations(user.id);
      setConversations(convs);

      // ✅ AUTO-SELECT FIRST CONVERSATION IF EXISTS AND NONE SELECTED
      if (convs.length > 0 && !currentConversationId) {
        setCurrentConversationId(convs[0].id);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, [user, currentConversationId]);

  const loadConversation = useCallback(async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }, []);

  const handleNewConversation = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      const newConv = await api.createConversation(user.id);

      setConversations((prev) => [
        {
          id: newConv.id,
          created_at: newConv.created_at,
          message_count: 0,
          title: newConv.title,
        },
        ...prev,
      ]);

      setCurrentConversationId(newConv.id);
      setCurrentConversation(newConv);

    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  }, [user]);

  // =========================
  // LOAD CONVERSATIONS
  // =========================

  useEffect(() => {
    if (user && user.id) {
      loadConversations();
    }
  }, [user, loadConversations]);

  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId, loadConversation]);

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  // =========================
  // LLM MESSAGE SEND
  // =========================

  const handleSendLLMMessage = async (content) => {

    setIsLLMLoading(true);

    try {
      // ✅ FIX 1: Auto-create a conversation if none exists
      let convId = currentConversationId;
      if (!convId) {
        if (!user || !user.id) {
          console.error("[Council] No user logged in, cannot create conversation");
          setIsLLMLoading(false);
          return;
        }
        const newConv = await api.createConversation(user.id);
        convId = newConv.id;
        setCurrentConversationId(newConv.id);
        setCurrentConversation(newConv);
        setConversations((prev) => [{
          id: newConv.id,
          created_at: newConv.created_at,
          message_count: 0,
          title: newConv.title,
        }, ...prev]);
      }

      const baseConversation = currentConversation || { messages: [] };
      const userMessage = { role: "user", content };

      setCurrentConversation({
        ...baseConversation,
        messages: [...baseConversation.messages, userMessage],
      });

      const assistantMessage = {
        role: "assistant",
        stage1: null,
        stage2: null,
        stage3: null,
        metadata: null,
        loading: { stage1: true, stage2: false, stage3: false },
      };

      setCurrentConversation((prev) => ({
        ...prev,
        messages: [...(prev?.messages || []), assistantMessage],
      }));

      await api.sendMessageStream(
        convId,
        content,
        (eventType, event) => {
          console.log(`[Council] Event received: ${eventType}`, event);

          setCurrentConversation((prev) => {
            const messages = prev.messages.map((m, i) => {
              // ✅ FIX 2: Deep-copy the last message to avoid mutating shared objects
              if (i === prev.messages.length - 1 && m.role === "assistant") {
                return { ...m, loading: { ...m.loading } };
              }
              return m;
            });

            const lastIdx = messages.length - 1;

            switch (eventType) {

              case "stage1_complete":
                console.log("[Council] Stage 1 complete, responses:", event.data?.length);
                messages[lastIdx] = {
                  ...messages[lastIdx],
                  stage1: event.data,
                  loading: { ...messages[lastIdx].loading, stage1: false, stage2: true },
                };
                break;

              case "stage2_complete":
                console.log("[Council] Stage 2 complete, rankings:", event.data?.length);
                messages[lastIdx] = {
                  ...messages[lastIdx],
                  stage2: event.data,
                  metadata: event.metadata,
                  loading: { ...messages[lastIdx].loading, stage2: false, stage3: true },
                };
                break;

              case "stage3_complete":
                console.log("[Council] Stage 3 complete");
                messages[lastIdx] = {
                  ...messages[lastIdx],
                  stage3: event.data,
                  loading: { ...messages[lastIdx].loading, stage3: false },
                };
                break;

              case "title_complete":
                console.log("[Council] Title complete:", event.data?.title);
                loadConversations();
                break;

              case "complete":
                console.log("[Council] Stream complete");
                setIsLLMLoading(false);
                // ✅ FIX 3: Reload conversation from backend to sync persisted history
                loadConversation(convId);
                break;

              case "error":
                console.error("[Council] Error from server:", event.message);
                setIsLLMLoading(false);
                break;
            }

            return { ...prev, messages };
          });
        }
      );

    } catch (error) {
      console.error("Failed to send message:", error);
      setIsLLMLoading(false);
    }
  };

  // =========================
  // NORMAL CHAT
  // =========================

  const onSent = async (prompt, image = null) => {

    if (!prompt && !image) return;

    const userMessage = { role: "user", text: prompt, image };

    setCurrentChat((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    setLoading(true);
    setInput("");
    setChatError("");  // ✅ Clear previous errors

    try {

      // Call backend's chat endpoint instead of OpenRouter directly
      // This keeps the API key secure on the backend
      const API_BASE_SIMPLE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";
      const response = await fetch(`${API_BASE_SIMPLE}/api/chat/simple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: prompt
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to get response from backend");
      }

      const data = await response.json();
      const botMessage = { role: "assistant", text: data.response };

      setCurrentChat((prev) => {

        const updatedChat = {
          ...prev,
          messages: [...prev.messages, botMessage],
        };

        setChats((prevChats) => {

          const exists = prevChats.find((c) => c.id === updatedChat.id);

          if (exists) {
            return prevChats.map((c) =>
              c.id === updatedChat.id ? updatedChat : c
            );
          }

          return [updatedChat, ...prevChats];
        });

        return updatedChat;
      });

    } catch (error) {
      const errorMsg = error.message || "Failed to get response from AI";
      setChatError(errorMsg);  // ✅ Show error to user
      console.error("OpenRouter Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setPageView("normal-chat");
    setCurrentChat({ id: Date.now(), messages: [] });
    setShowResult(false);
    setInput("");
  };

  const openChat = (chat) => {
    setCurrentChat(chat);
    setShowResult(true);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthInitialized,

    input,
    setInput,

    loading,
    showResult,
    setShowResult,
    chatError,
    setChatError,

    onSent,
    currentChat,
    chats,
    newChat,
    openChat,

    PageView,
    setPageView,

    conversations,
    currentConversationId,
    currentConversation,
    isLLMLoading,

    loadConversations,
    loadConversation,
    handleNewConversation,
    handleSelectConversation,
    handleSendLLMMessage,
  };

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
};

export default ContextProvider;