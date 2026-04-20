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

    if (!currentConversationId) return;

    setIsLLMLoading(true);

    try {

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
        currentConversationId,
        content,
        (eventType, event) => {
          console.log(`[Council] Event received: ${eventType}`, event);

          setCurrentConversation((prev) => {

            const messages = [...prev.messages];
            const lastIdx = messages.length - 1;

            switch (eventType) {

              case "stage1_complete":
                console.log("[Council] Stage 1 complete, responses:", event.data?.length);
                messages[lastIdx].stage1 = event.data;
                messages[lastIdx].loading.stage1 = false;
                messages[lastIdx].loading.stage2 = true;
                break;

              case "stage2_complete":
                console.log("[Council] Stage 2 complete, rankings:", event.data?.length);
                messages[lastIdx].stage2 = event.data;
                messages[lastIdx].metadata = event.metadata;
                messages[lastIdx].loading.stage2 = false;
                messages[lastIdx].loading.stage3 = true;
                break;

              case "stage3_complete":
                console.log("[Council] Stage 3 complete");
                messages[lastIdx].stage3 = event.data;
                messages[lastIdx].loading.stage3 = false;
                break;

              case "title_complete":
                console.log("[Council] Title complete:", event.data?.title);
                loadConversations();
                break;

              case "complete":
                console.log("[Council] Stream complete");
                setIsLLMLoading(false);
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
      const response = await fetch("http://localhost:8000/api/chat/simple", {
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