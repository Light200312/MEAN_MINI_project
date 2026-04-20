import React, { useState, useContext } from "react";
import { Context } from "../../context/Context";
import {
  Menu,
  Plus,
  MessageCircle,
  HelpCircle,
  History,
  Settings,
  User,
  Sparkles,
  Layers,
  LogOut
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = () => {
  const [extended, setExtended] = useState(false);

  const {
    conversations,
    currentConversationId,
    handleNewConversation, // renamed to match context
    handleSelectConversation, // renamed to match context
    chats,
    currentChat,
    newChat,
    openChat,
    PageView,
    setPageView,
    logout,
  } = useContext(Context);

  return (
    <div
      className={`h-screen ${extended ? "w-64" : "w-20"
        } flex flex-col justify-between bg-slate-100 dark:bg-slate-900 p-4 transition-all duration-300 border-r border-slate-200 dark:border-slate-800`}
    >
      {/* TOP SECTION */}
      <div>
        {/* MENU BUTTON */}
        <button
          onClick={() => setExtended((prev) => !prev)}
          className="p-2 mb-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400"
        >
          <Menu size={20} />
        </button>

        {/* ENHANCED PAGE SWITCHER */}
        <div className={`flex ${extended ? "flex-row" : "flex-col"} bg-slate-200 dark:bg-slate-800 p-1 rounded-xl gap-1 mb-6`}>
          <button
            onClick={() => setPageView("llm-chat")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-xs font-semibold ${PageView === "llm-chat"
              ? "bg-white dark:bg-slate-700 shadow-sm text-orange-500"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            <Sparkles size={16} />
            {extended && "Council"}
          </button>
          <button
            onClick={() => setPageView("normal-chat")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all text-xs font-semibold ${PageView === "normal-chat"
              ? "bg-white dark:bg-slate-700 shadow-sm text-blue-500"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
          >
            <Layers size={16} />
            {extended && "Standard"}
          </button>
        </div>

        {/* DYNAMIC CONTENT AREA */}
        <div className="flex flex-col">

          {/* NEW CONVERSATION BUTTON (Uniform Style) */}
          <div
            onClick={PageView === "llm-chat" ? handleNewConversation : newChat}
            className="flex items-center gap-3 p-3 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition border border-dashed border-slate-400 dark:border-slate-600 mb-6"
          >
            <Plus size={20} className={PageView === "llm-chat" ? "text-orange-500" : "text-blue-500"} />
            {extended && <p className="text-sm font-medium">New {PageView === "llm-chat" ? "Council" : "Chat"}</p>}
          </div>

          {/* RECENT LIST (Uniform Style) */}
          {extended && (
            <div className="overflow-y-auto max-h-[55vh] no-scrollbar">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-3 px-2">
                Recent {PageView === "llm-chat" ? "Council" : "History"}
              </p>

              <div className="space-y-1 no-scrollbar">
                {PageView === "llm-chat" ? (
                  /* LLM COUNCIL LIST */
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${conv.id === currentConversationId
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                        : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Sparkles size={16} className="shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                          <p className="truncate text-sm font-medium leading-tight">
                            {conv.title || "New Council Session"}
                          </p>
                          <span className="text-[10px] opacity-60">
                            {conv.message_count} messages
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  /* NORMAL CHAT LIST */
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => openChat(chat)}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${currentChat?.id === chat.id
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                    >
                      <MessageCircle size={16} className="shrink-0" />
                      <p className="truncate text-sm font-medium">
                        {chat.messages?.find((m) => m.role === "user")?.text?.slice(0, 24) || "New Chat"}
                      </p>
                    </div>
                  ))
                )}

                {/* EMPTY STATES */}
                {((PageView === "llm-chat" && conversations.length === 0) ||
                  (PageView === "normal-chat" && chats.length === 0)) && (
                    <p className="text-xs text-slate-400 px-2 italic">No conversations yet</p>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {[
          { icon: HelpCircle, label: "Help" },
          { icon: History, label: "Activity" },
          { icon: Settings, label: "Settings" },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-400">
            <item.icon size={18} />
            {extended && <p className="text-sm font-medium">{item.label}</p>}
          </div>
        ))}

        {/* ✅ NEW: LOGOUT BUTTON */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition text-red-600 dark:text-red-400"
        >
          <LogOut size={18} />
          {extended && <p className="text-sm font-medium">Logout</p>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;