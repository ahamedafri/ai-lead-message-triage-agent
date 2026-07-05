import React, { useState, useEffect } from 'react';
import { MessageItem, AIPrediction } from '../types';
import { ChannelIcon } from './ChannelIcons';
import { Check, Edit2, Trash2, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';

interface MessageCardProps {
  message: MessageItem;
  onAction: (
    messageId: string,
    action: 'approve' | 'edit' | 'reject',
    customReplyText: string,
    predictionsToVerify: AIPrediction
  ) => void;
  onUpdateReply?: (messageId: string, replyText: string) => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message, onAction, onUpdateReply }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftReply, setDraftReply] = useState(message.reply);
  const [userEdited, setUserEdited] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    setDraftReply(message.reply);
  }, [message.reply]);

  const handleDraftWithAI = async () => {
    setIsDrafting(true);
    try {
      const response = await fetch('/api/draft-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: message.channel,
          sender: message.sender,
          message: message.message,
          category: message.category,
          priority: message.priority
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate draft reply from server');
      }

      const data = await response.json();
      setDraftReply(data.reply);
      setUserEdited(false);
      
      if (onUpdateReply) {
        onUpdateReply(message.id, data.reply);
      }
    } catch (err: any) {
      console.error("Failed to fetch draft reply:", err);
    } finally {
      setIsDrafting(false);
    }
  };

  const isLongMessage = message.message.length > 220;
  const displayText = isExpanded ? message.message : 
                      isLongMessage ? `${message.message.substring(0, 220)}...` : message.message;

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftReply(e.target.value);
    setUserEdited(true);
  };

  const handleApprove = () => {
    const action = userEdited ? 'edit' : 'approve';
    onAction(message.id, action, draftReply, {
      priority: message.priority,
      leadQuality: message.leadQuality,
      review: message.review,
      category: message.category,
      reasoning: message.reasoning,
      reply: message.reply
    });
  };

  const handleReject = () => {
    onAction(message.id, 'reject', '', {
      priority: message.priority,
      leadQuality: message.leadQuality,
      review: message.review,
      category: message.category,
      reasoning: message.reasoning,
      reply: message.reply
    });
  };

  // Badges Colors
  const getPriorityBadgeColor = (p: string) => {
    switch (p) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900';
      case 'normal':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
      case 'low':
        return 'bg-zinc-50 text-zinc-500 border-zinc-100 dark:bg-zinc-900/60 dark:text-zinc-500 dark:border-zinc-800/80';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getQualityBadgeColor = (q: string) => {
    switch (q) {
      case 'strong':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50';
      case 'weak':
        return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-800';
      case 'unclear':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40';
    }
  };

  return (
    <div 
      id={`message-card-${message.id}`}
      className={`border rounded-xl p-5 transition-all bg-white dark:bg-zinc-900 ${
        message.status !== 'pending' 
          ? 'border-zinc-200 dark:border-zinc-800/60 opacity-65 scale-[0.98]' 
          : message.priority === 'urgent'
          ? 'border-red-300 shadow-sm shadow-red-50/50 dark:border-red-900/50 dark:shadow-none'
          : 'border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/60 shrink-0">
            <ChannelIcon channel={message.channel} size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 leading-snug">
              {message.sender}
            </h3>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider">
              {message.channel} • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 justify-end">
          {message.review && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Needs Human Review
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeColor(message.priority)}`}>
            {message.priority} priority
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getQualityBadgeColor(message.leadQuality)}`}>
            Lead: {message.leadQuality}
          </span>
        </div>
      </div>

      {/* Message Body */}
      <div className="text-sm text-zinc-700 dark:text-zinc-300 mb-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 p-3.5 rounded-lg font-normal leading-relaxed break-words">
        {displayText}
        {isLongMessage && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs ml-1 hover:underline inline-flex items-center gap-0.5"
          >
            {isExpanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Read more <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>

      {/* AI classification / reasoning info */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/60 rounded-lg p-3 mb-4 text-xs">
        <div className="flex items-center gap-1.5 mb-1.5 text-indigo-700 dark:text-indigo-400 font-semibold">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Classification: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{message.category}</span></span>
        </div>
        <p className="text-zinc-600 dark:text-zinc-300 italic">"{message.reasoning}"</p>
      </div>

      {/* Response and actions */}
      {message.status === 'pending' ? (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">
                Draft Reply {userEdited && <span className="text-amber-500">(Edited)</span>}
              </label>
              <button
                type="button"
                onClick={handleDraftWithAI}
                disabled={isDrafting}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer border border-indigo-100 dark:border-indigo-900/40 px-2 py-1 rounded bg-indigo-50/40 dark:bg-indigo-950/20 shadow-2xs"
              >
                <Sparkles className={`h-3 w-3 ${isDrafting ? 'animate-spin text-indigo-500' : ''}`} />
                {isDrafting ? 'Drafting...' : 'Draft with AI'}
              </button>
            </div>
            <textarea
              id={`textarea-reply-${message.id}`}
              value={draftReply}
              onChange={handleReplyChange}
              rows={3}
              placeholder={isDrafting ? "AI is generating your professional response..." : "No reply drafted yet. Click 'Draft with AI' or start typing..."}
              className="w-full text-xs p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 resize-y leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              id={`discard-btn-${message.id}`}
              onClick={handleReject}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Discard / Reject
            </button>

            <div className="flex items-center gap-2">
              <button
                id={`approve-btn-${message.id}`}
                onClick={handleApprove}
                className={`px-4 py-2 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                  userEdited 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {userEdited ? <Edit2 className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                {userEdited ? 'Edit & Send' : 'Approve & Send'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Action: <strong className="uppercase text-zinc-700 dark:text-zinc-300 font-bold">{message.status}</strong>
          </span>
          {message.status !== 'rejected' && (
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs text-right line-clamp-1 italic">
              Sent: "{message.finalReply || message.reply}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
