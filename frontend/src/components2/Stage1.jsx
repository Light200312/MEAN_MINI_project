import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Cpu } from 'lucide-react';

export default function Stage1({ responses }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!responses || responses.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
      {/* Header - Responsive padding */}
      <div className="px-4 py-3 md:px-5 md:py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center gap-2">
        <Cpu size={14} className="text-blue-500 shrink-0" />
        <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          Stage 1: Individual Insights
        </h3>
      </div>

      {/* Tabs Row - Custom scrollbar behavior for mobile */}
      <div className="flex gap-1 p-2 bg-slate-100/50 dark:bg-slate-800/50 overflow-x-auto no-scrollbar scroll-smooth snap-x">
        {responses.map((resp, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[11px] md:text-xs font-semibold transition-all whitespace-nowrap snap-ml-2 ${
              activeTab === index
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-slate-600'
                : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            {resp.model.split('/')[1] || resp.model}
          </button>
        ))}
      </div>

      {/* Content Area - Adjusted text size for small screens */}
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-3 md:mb-4 text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-tight overflow-hidden">
          <Bot size={12} className="shrink-0" />
          <span className="truncate">Model: {responses[activeTab].model}</span>
        </div>
        
        {/* Markdown Wrapper: Ensuring code blocks and text wrap correctly on mobile */}
        <div className="prose dark:prose-invert prose-sm max-w-none 
          prose-p:leading-relaxed prose-pre:max-w-[calc(100vw-4rem)] md:prose-pre:max-w-none 
          prose-pre:overflow-x-auto prose-pre:bg-slate-900 dark:prose-pre:bg-black">
          <ReactMarkdown>{responses[activeTab].response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}