export type ChannelType = 'whatsapp' | 'instagram' | 'email' | 'website';
export type PriorityType = 'urgent' | 'normal' | 'low';
export type LeadQualityType = 'strong' | 'weak' | 'unclear';
export type MessageStatus = 'pending' | 'approved' | 'edited' | 'rejected';

export interface AIPrediction {
  priority: PriorityType;
  leadQuality: LeadQualityType;
  review: boolean;
  category: string;
  reasoning: string;
  reply: string;
}

export interface MessageItem {
  id: string;
  channel: ChannelType;
  sender: string;
  message: string;
  timestamp: string; // ISO string
  priority: PriorityType;
  leadQuality: LeadQualityType;
  review: boolean;
  category: string;
  reasoning: string;
  reply: string;
  status: MessageStatus;
  finalReply?: string;
  isAnalyzing?: boolean;
}

export interface FeedbackLog {
  id: string;
  timestamp: string;
  originalMessage: string;
  channel: ChannelType;
  sender: string;
  aiPrediction: AIPrediction;
  humanAction: 'approve' | 'edit' | 'reject';
  humanReply: string;
  metrics: {
    priorityAgreed: boolean;
    leadQualityAgreed: boolean;
    categoryAgreed: boolean;
    reviewAgreed: boolean;
    overallAgreed: boolean;
  };
}

export interface ChannelStatus {
  id: ChannelType;
  name: string;
  connected: boolean;
  color: string;
}
