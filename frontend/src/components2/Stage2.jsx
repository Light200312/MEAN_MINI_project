import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trophy, BarChart3, Search, Users, Bot } from 'lucide-react';

function deAnonymizeText(text, labelToModel) {
  if (!labelToModel) return text;
  let result = text;
  Object.entries(labelToModel).forEach(([label, model]) => {
    const modelShortName = model.split('/')[1] || model;
    result = result.replace(new RegExp(label, 'g'), `**${modelShortName}**`);
  });
  return result;
}

export default function Stage2({ rankings, labelToModel, aggregateRankings }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!rankings || rankings.length === 0) return null;

  return (
    <div className="w-full space-y-6">
      {/* RAW EVALUATIONS BOX */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Stage 2: Peer Review
            </h3>
          </div>
        </div>

        {/* Info Header */}
        <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border-b border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Models evaluated each other anonymously. Model names are re-inserted in <strong className="text-amber-600 dark:text-amber-400">bold</strong> for your convenience.
          </p>
        </div>

        {/* Scrollable Tabs */}
        <div className="flex gap-1 p-2 bg-slate-100/30 dark:bg-slate-800/30 overflow-x-auto no-scrollbar snap-x">
          {rankings.map((rank, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 rounded-xl text-[11px] md:text-xs font-semibold transition-all whitespace-nowrap snap-ml-2 ${activeTab === index
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100 dark:border-slate-600'
                  : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
            >
              {rank.model.split('/')[1] || rank.model}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-slate-400 uppercase">
            <Bot size={12} />
            Evaluator: {rankings[activeTab].model}
          </div>

          <div className="prose dark:prose-invert prose-sm max-w-none prose-pre:bg-slate-900 dark:prose-pre:bg-black">
            <ReactMarkdown>
              {deAnonymizeText(rankings[activeTab].ranking, labelToModel)}
            </ReactMarkdown>
          </div>

          {/* Parsed List */}
          {rankings[activeTab].parsed_ranking?.length > 0 && (
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase">
                <BarChart3 size={14} /> Final Ranking Order
              </div>
              <div className="space-y-2">
                {rankings[activeTab].parsed_ranking.map((label, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {labelToModel?.[label]?.split('/')[1] || labelToModel?.[label] || label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AGGREGATE RANKINGS (LEADERBOARD) */}
      {aggregateRankings && aggregateRankings.length > 0 && (
        <div className="bg-linear-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={20} className="text-yellow-500" />
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Council Consensus (Street Cred)
            </h4>
          </div>

          <div className="space-y-3">
            {aggregateRankings.map((agg, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-xl font-black text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-slate-200 text-slate-600' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-700'
                    }`}>
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm md:text-base">
                      {agg.model.split('/')[1] || agg.model}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Users size={10} /> {agg.rankings_count} council votes
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Avg Rank</p>
                  <p className="text-lg font-black text-blue-500 dark:text-blue-400 leading-none">
                    {agg.average_rank.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}