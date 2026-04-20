import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, UserCheck, Quote } from 'lucide-react';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) {
    return null;
  }

  const modelName = finalResponse.model.split('/')[1] || finalResponse.model;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-2xl md:rounded-3xl shadow-lg shadow-emerald-500/5 overflow-hidden">
      {/* Header - The "Chairman" identity */}
      <div className="px-5 py-4 border-b border-emerald-50 dark:border-emerald-900/20 bg-emerald-50/30 dark:bg-emerald-900/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Stage 3: Final Consensus
          </h3>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-800/50 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-tighter">
          <UserCheck size={12} />
          Chairman
        </div>
      </div>

      <div className="p-5 md:p-8 relative">
        {/* Decorative Quote Icon for the "Synthesis" feel */}
        <Quote 
          size={40} 
          className="absolute top-4 right-4 text-emerald-500/5 pointer-events-none" 
        />

        {/* Chairman Attribution for Mobile */}
        <div className="md:hidden flex items-center gap-2 mb-4 text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase">
          <UserCheck size={12} />
          Chairman: {modelName}
        </div>

        {/* Desktop Attribution Label */}
        <div className="hidden md:block mb-6">
          <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-tight">Synthesized by</p>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{modelName}</p>
        </div>

        {/* The Final Content - Fixed ReactMarkdown */}
        <div className="prose dark:prose-invert prose-emerald max-w-none 
          text-sm md:text-base leading-relaxed
          prose-headings:font-bold prose-headings:tracking-tight
          prose-pre:bg-slate-900 dark:prose-pre:bg-black prose-pre:rounded-2xl
          prose-code:text-emerald-600 dark:prose-code:text-emerald-400">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {finalResponse.response}
          </ReactMarkdown>
        </div>
      </div>

      {/* Footer Completion Badge */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-center md:justify-end">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          Council deliberation complete <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
        </span>
      </div>
    </div>
  );
}