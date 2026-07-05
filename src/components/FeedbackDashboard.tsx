import React from 'react';
import { FeedbackLog } from '../types';
import { FileDown, CheckCircle, AlertTriangle, RefreshCw, Layers } from 'lucide-react';

interface FeedbackDashboardProps {
  logs: FeedbackLog[];
  onClearLogs: () => void;
}

export const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({ logs, onClearLogs }) => {
  const total = logs.length;

  // Calculate metrics
  const approvals = logs.filter(l => l.humanAction === 'approve').length;
  const edits = logs.filter(l => l.humanAction === 'edit').length;
  const rejections = logs.filter(l => l.humanAction === 'reject').length;

  const approvalRate = total > 0 ? Math.round((approvals / total) * 100) : 0;
  const editRate = total > 0 ? Math.round((edits / total) * 100) : 0;
  const rejectionRate = total > 0 ? Math.round((rejections / total) * 100) : 0;

  // Agreement metrics
  const priorityAgreements = logs.filter(l => l.metrics.priorityAgreed).length;
  const qualityAgreements = logs.filter(l => l.metrics.leadQualityAgreed).length;
  const reviewAgreements = logs.filter(l => l.metrics.reviewAgreed).length;
  const categoryAgreements = logs.filter(l => l.metrics.categoryAgreed).length;
  const overallAgreements = logs.filter(l => l.metrics.overallAgreed).length;

  const priorityAgreementRate = total > 0 ? Math.round((priorityAgreements / total) * 100) : 0;
  const qualityAgreementRate = total > 0 ? Math.round((qualityAgreements / total) * 100) : 0;
  const reviewAgreementRate = total > 0 ? Math.round((reviewAgreements / total) * 100) : 0;
  const categoryAgreementRate = total > 0 ? Math.round((categoryAgreements / total) * 100) : 0;
  const overallAgreementRate = total > 0 ? Math.round((overallAgreements / total) * 100) : 0;

  // Export to CSV
  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = [
      'ID', 'Timestamp', 'Channel', 'Sender', 'Original Message',
      'AI Priority', 'AI Lead Quality', 'AI Category', 'AI Needs Review', 'AI Draft Reply',
      'Human Action', 'Human Reply', 'Overall Agreed', 'Priority Agreed', 'Lead Quality Agreed'
    ];

    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.channel,
      `"${log.sender.replace(/"/g, '""')}"`,
      `"${log.originalMessage.replace(/"/g, '""')}"`,
      log.aiPrediction.priority,
      log.aiPrediction.leadQuality,
      log.aiPrediction.category,
      log.aiPrediction.review,
      `"${log.aiPrediction.reply.replace(/"/g, '""')}"`,
      log.humanAction,
      `"${log.humanReply.replace(/"/g, '""')}"`,
      log.metrics.overallAgreed,
      log.metrics.priorityAgreed,
      log.metrics.leadQualityAgreed
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ai_triage_feedback_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSONL (OpenAI Finetuning format)
  const exportToJSONL = () => {
    if (logs.length === 0) return;
    
    const jsonlLines = logs.map(log => {
      // Create OpenAI format messages array
      const systemPrompt = `You are a message-triage classifier for a small media/marketing agency. Given one inbound message, return ONLY a valid JSON object with exactly these fields: {"priority": "urgent"|"normal"|"low", "leadQuality": "strong"|"weak"|"unclear", "review": true|false, "category": "label", "reasoning": "one sentence", "reply": "draft reply"}`;
      const userContent = `Channel: ${log.channel}\nSender: ${log.sender}\nMessage: ${log.originalMessage}`;
      
      const assistantContent = JSON.stringify({
        priority: log.aiPrediction.priority,
        leadQuality: log.aiPrediction.leadQuality,
        review: log.aiPrediction.review,
        category: log.aiPrediction.category,
        reasoning: log.aiPrediction.reasoning,
        reply: log.humanAction === 'reject' ? 'Discarded by human reviewer.' : log.humanReply
      });

      return JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
          { role: 'assistant', content: assistantContent }
        ]
      });
    });

    const blob = new Blob([jsonlLines.join('\n')], { type: 'application/x-jsonlines;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `groq_llama_finetuning_${Date.now()}.jsonl`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to simple Training Format JSON
  const exportToTrainingJSON = () => {
    if (logs.length === 0) return;
    
    const data = logs.map(log => ({
      input: {
        channel: log.channel,
        sender: log.sender,
        message: log.originalMessage
      },
      output: {
        priority: log.aiPrediction.priority,
        leadQuality: log.aiPrediction.leadQuality,
        review: log.aiPrediction.review,
        category: log.aiPrediction.category,
        reasoning: log.aiPrediction.reasoning,
        reply_draft: log.aiPrediction.reply
      },
      human_feedback: {
        action: log.humanAction,
        final_reply: log.humanReply,
        overall_agreement: log.metrics.overallAgreed,
        priority_agreement: log.metrics.priorityAgreed,
        quality_agreement: log.metrics.leadQualityAgreed
      }
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ai_triage_training_dataset_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="feedback-section" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" />
            Human Feedback & Agreement Loop
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Logs of operator reviews to audit Llama 3 accuracy and compile training data.
          </p>
        </div>

        {total > 0 && (
          <button
            id="clear-logs-btn"
            onClick={onClearLogs}
            className="text-xs text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1 self-end sm:self-auto"
          >
            Clear Logged Data
          </button>
        )}
      </div>

      {total === 0 ? (
        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center flex flex-col items-center justify-center">
          <CheckCircle className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No decisions logged yet</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm">
            Approve, Edit, or Reject mock/simulated draft replies above to populate alignment datasets.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Alert if 10+ items collected */}
          {total >= 10 && (
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-lg p-4 animate-pulse flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                  Ready for Model Fine-Tuning! ({total} Feedbacks Logged)
                </p>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                  You have collected over 10 user decisions. Export the JSONL dataset below to fine-tune Llama 3 on your business tone.
                </p>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">Logged Decisions</span>
              <span className="text-2xl font-bold text-zinc-900 dark:text-white mt-1 block">{total}</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">Approval Rate</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{approvalRate}%</span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">{approvals} approved clean</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">Edit / Revision Rate</span>
              <span className="text-2xl font-bold text-amber-500 dark:text-amber-400 mt-1 block">{editRate}%</span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">{edits} replies revised</span>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">AI Overall Agreement</span>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">{overallAgreementRate}%</span>
              <span className="text-[10px] text-zinc-400 mt-0.5 block">{overallAgreements} agreed setups</span>
            </div>
          </div>

          {/* AI Accuracy Agreement Breakdown */}
          <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 p-4 rounded-lg">
            <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3">AI Prediction vs. Human Agreement Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Priority Flag</span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5">{priorityAgreementRate}%</span>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${priorityAgreementRate}%` }} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Lead Quality</span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5">{qualityAgreementRate}%</span>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${qualityAgreementRate}%` }} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Needs-Review Flag</span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5">{reviewAgreementRate}%</span>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${reviewAgreementRate}%` }} />
                </div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Categorization</span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 block mt-0.5">{categoryAgreementRate}%</span>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${categoryAgreementRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Dataset Exports */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="export-csv-btn"
              onClick={exportToCSV}
              className="flex-1 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              Export CSV (Excel/Sheets)
            </button>
            <button
              id="export-jsonl-btn"
              onClick={exportToJSONL}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              Export JSONL (Llama 3 Fine-tuning)
            </button>
            <button
              id="export-training-btn"
              onClick={exportToTrainingJSON}
              className="flex-1 bg-zinc-900 hover:bg-zinc-950 dark:bg-zinc-100 dark:hover:bg-zinc-50 dark:text-zinc-900 text-white py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              Export Training Format (JSON)
            </button>
          </div>

          {/* Historical Log Viewer */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Logged Reviews (Latest first)</h4>
            <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y divide-zinc-200 dark:divide-zinc-800">
              {logs.slice().reverse().map(log => (
                <div key={log.id} className="p-3 bg-zinc-50/50 dark:bg-zinc-800/10 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{log.sender}</span>
                      <span className="text-[10px] text-zinc-400 uppercase">{log.channel}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      log.humanAction === 'approve' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400' :
                      log.humanAction === 'edit' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400'
                    }`}>
                      {log.humanAction}
                    </span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 line-clamp-1 italic mb-1">"{log.originalMessage}"</p>
                  <div className="text-[10px] text-zinc-400 flex flex-wrap gap-x-3 gap-y-1">
                    <span>AI Priority: <strong className="text-zinc-600 dark:text-zinc-300">{log.aiPrediction.priority}</strong></span>
                    <span>AI Lead: <strong className="text-zinc-600 dark:text-zinc-300">{log.aiPrediction.leadQuality}</strong></span>
                    <span>Agreed: <strong className="text-zinc-600 dark:text-zinc-300">{log.metrics.overallAgreed ? 'Yes' : 'No'}</strong></span>
                    <span>Time: <span className="text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
