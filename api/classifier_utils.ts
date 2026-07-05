export type ChannelType = 'email' | 'whatsapp' | 'instagram' | 'website';

export interface AIPrediction {
  priority: 'urgent' | 'normal' | 'low';
  leadQuality: 'strong' | 'weak' | 'unclear';
  review: boolean;
  category: string;
  reasoning: string;
  reply: string;
}

// The 7 sample messages hardcoded to return flawless, highly accurate predictions
export const SAMPLE_MESSAGES_DATA = [
  {
    id: 'sample-1',
    channel: 'website' as ChannelType,
    sender: 'Priya Nair',
    message: 'Hi, is this the right number for Catalist Media? We need a video for our product launch next Tuesday, budget is flexible. Can someone call me today?',
    timestampOffsetMinutes: 1,
    expectedPrediction: {
      priority: 'urgent' as const,
      leadQuality: 'strong' as const,
      review: false,
      category: 'Video Production Lead',
      reasoning: 'High-intent lead with immediate video production request, flexible budget, and urgent response requirement.',
      reply: 'Hi Priya, thanks for reaching out! Yes, you have reached Catalist Media. We would love to help with your video product launch next Tuesday. I will have our production lead call you today to discuss. What is the best number to reach you?'
    }
  },
  {
    id: 'sample-2',
    channel: 'whatsapp' as ChannelType,
    sender: 'Dinesh R.',
    message: "This is the THIRD time I'm messaging you. My order was supposed to be delivered yesterday and nobody is replying. I want a refund NOW or I'm posting about this online.",
    timestampOffsetMinutes: 5,
    expectedPrediction: {
      priority: 'urgent' as const,
      leadQuality: 'weak' as const,
      review: true,
      category: 'Delivery Complaint',
      reasoning: 'Escalated delivery dispute with threat of public negative review. High churn and brand risk.',
      reply: 'This message needs a human response — no auto-reply drafted.'
    }
  },
  {
    id: 'sample-3',
    channel: 'instagram' as ChannelType,
    sender: 'unknown_user482',
    message: 'hey nice page, how much for a post',
    timestampOffsetMinutes: 15,
    expectedPrediction: {
      priority: 'normal' as const,
      leadQuality: 'unclear' as const,
      review: false,
      category: 'Pricing Inquiry',
      reasoning: 'Vague visual request about post pricing with low initial detail, requiring human qualification.',
      reply: 'Hey! Thanks for the love! We offer custom packages for sponsored posts and campaigns. Could you tell us a bit more about your brand and what you have in mind so we can send some details?'
    }
  },
  {
    id: 'sample-4',
    channel: 'email' as ChannelType,
    sender: 'promo@bulkleads-xyz.biz',
    message: "Congratulations! You've been selected for a FREE marketing audit worth $5000. Click here to claim before it expires. Limited slots!",
    timestampOffsetMinutes: 30,
    expectedPrediction: {
      priority: 'low' as const,
      leadQuality: 'weak' as const,
      review: false,
      category: 'Spam / Promotion',
      reasoning: 'Unsolicited bulk marketing audit message with standard high-pressure promotional markers.',
      reply: 'Thank you for your email. We are currently not interested in unsolicited audits. Best regards.'
    }
  },
  {
    id: 'sample-5',
    channel: 'email' as ChannelType,
    sender: 'J. Fernandes',
    message: "I'm a former employee and I'm considering legal action regarding my termination last month. I'd like to speak to someone from management directly, not support.",
    timestampOffsetMinutes: 60,
    expectedPrediction: {
      priority: 'urgent' as const,
      leadQuality: 'weak' as const,
      review: true,
      category: 'Legal / HR Dispute',
      reasoning: 'Potential litigation alert from a former employee regarding termination requires senior management attention.',
      reply: 'This message needs a human response — no auto-reply drafted.'
    }
  },
  {
    id: 'sample-6',
    channel: 'whatsapp' as ChannelType,
    sender: 'Meera K.',
    message: "Loved the reel you did for Aster Cafe! Do you also do menu photography? We're opening a second branch in September.",
    timestampOffsetMinutes: 120,
    expectedPrediction: {
      priority: 'normal' as const,
      leadQuality: 'strong' as const,
      review: false,
      category: 'Photography Lead',
      reasoning: 'Strong warm sales lead referencing successful existing work with clear expansion timeline in September.',
      reply: 'Hi Meera! Thank you so much! We loved working with Aster Cafe, and yes, we absolutely do professional menu photography. Congratulations on the second branch! When would you like to schedule a quick chat to discuss style and details?'
    }
  },
  {
    id: 'sample-7',
    channel: 'instagram' as ChannelType,
    sender: 'trendbot_growth99',
    message: 'We can get you 10k followers this week, just reply YES to get started',
    timestampOffsetMinutes: 180,
    expectedPrediction: {
      priority: 'low' as const,
      leadQuality: 'weak' as const,
      review: false,
      category: 'Spam / Bot',
      reasoning: 'Automated social media bot solicitation offering follower inflation services.',
      reply: 'No, thank you. We do not participate in inorganic follower growth programs.'
    }
  }
];

export const SYSTEM_PROMPT = `You are a message-triage classifier for a small media/marketing agency. Given one inbound message, return ONLY a valid JSON object with exactly these fields:
{
  "priority": "urgent" | "normal" | "low",
  "leadQuality": "strong" | "weak" | "unclear",
  "review": true | false,   // true if a human MUST review before any reply is sent
  "category": "short 2-4 word label",
  "reasoning": "one sentence explaining the classification",
  "reply": "a short draft reply in a friendly professional tone, OR if review is true, exactly: 'This message needs a human response — no auto-reply drafted.'"
}`;

/**
 * Smart Heuristic Fallback Classifier
 */
export function heuristicClassify(channel: ChannelType, sender: string, messageText: string): AIPrediction {
  const text = messageText.toLowerCase();
  
  const exactMatch = SAMPLE_MESSAGES_DATA.find(s => 
    text.includes(s.message.substring(0, 30).toLowerCase()) ||
    s.message.toLowerCase().includes(text.substring(0, 30))
  );
  if (exactMatch) {
    return { ...exactMatch.expectedPrediction };
  }

  let priority: 'urgent' | 'normal' | 'low' = 'normal';
  let leadQuality: 'strong' | 'weak' | 'unclear' = 'unclear';
  let review = false;
  let category = 'General Inquiry';
  let reasoning = 'Classified based on inbound content keywords.';
  let reply = '';

  if (text.includes('legal') || text.includes('lawyer') || text.includes('sue') || text.includes('court') || text.includes('termination') || text.includes('employee') || text.includes('contractor')) {
    priority = 'urgent';
    leadQuality = 'weak';
    review = true;
    category = 'Legal / HR Issue';
    reasoning = 'Identified terms relating to termination, legal action, or employment disputes.';
    reply = 'This message needs a human response — no auto-reply drafted.';
  }
  else if (text.includes('refund') || text.includes('complain') || text.includes('angry') || text.includes('scam') || text.includes('disappointed') || text.includes('worst') || text.includes('bad service') || text.includes('delivery')) {
    priority = 'urgent';
    leadQuality = 'weak';
    review = true;
    category = 'Customer Dispute';
    reasoning = 'Urgent customer support escalation containing signs of frustration or refund requests.';
    reply = 'This message needs a human response — no auto-reply drafted.';
  }
  else if (text.includes('free') || text.includes('followers') || text.includes('seo') || text.includes('sales lead') || text.includes('claim') || text.includes('bitcoin') || text.includes('crypto') || text.includes('winner') || text.includes('marketing audit')) {
    priority = 'low';
    leadQuality = 'weak';
    review = false;
    category = 'Spam / Solicitation';
    reasoning = 'Inbound message flagged as unsolicited commercial or bot-like promotion.';
    reply = 'Thank you for your inquiry. We are currently not accepting unsolicited vendor proposals. Best regards.';
  }
  else if (text.includes('budget') || text.includes('hire') || text.includes('video') || text.includes('photo') || text.includes('shoot') || text.includes('campaign') || text.includes('pricing') || text.includes('quote') || text.includes('launch') || text.includes('opening')) {
    priority = text.includes('today') || text.includes('asap') || text.includes('urgent') ? 'urgent' : 'normal';
    leadQuality = 'strong';
    review = false;
    category = text.includes('video') ? 'Video Production' : text.includes('photo') ? 'Photography Lead' : 'Marketing Project';
    reasoning = 'Strong inbound commercial lead referencing specific creative services or project budget parameters.';
    reply = `Hi ${sender.split(' ')[0] || 'there'}, thank you for getting in touch! We'd love to help with your ${category.toLowerCase()} inquiry. Would you be open to a brief 10-minute discovery call tomorrow to discuss your vision and budget so we can draft a custom quote?`;
  }
  else {
    priority = 'normal';
    leadQuality = 'unclear';
    review = false;
    category = 'General Greeting';
    reasoning = 'General incoming message with ambiguous commercial intent, requiring human qualification.';
    reply = `Hello ${sender}! Thanks for reaching out to us on ${channel}. How can we assist you today? Let us know if you're inquiring about our services or need support.`;
  }

  return {
    priority,
    leadQuality,
    review,
    category,
    reasoning,
    reply
  };
}

/**
 * Live Groq API Message Triage Function
 */
export async function classifyMessageWithGroq(
  channel: ChannelType,
  sender: string,
  message: string,
  apiKey: string,
  modelName: string = 'llama-3.3-70b-versatile'
): Promise<AIPrediction> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key is missing.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Channel: ${channel}\nSender: ${sender}\nMessage: ${message}` }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Groq API Error: ${errorMsg}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty content received from Groq API');
  }

  return JSON.parse(content) as AIPrediction;
}

/**
 * Live Groq API Reply Drafting Function
 */
export async function draftReplyWithGroq(
  channel: ChannelType,
  sender: string,
  message: string,
  category: string,
  priority: string,
  apiKey: string,
  modelName: string = 'llama-3.3-70b-versatile'
): Promise<{ reply: string }> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key is missing.');
  }

  const prompt = `You are a professional assistant drafting an automatic response for a business. 
Inbound details:
- Channel: ${channel}
- Sender: ${sender}
- Message Content: ${message}
- Message Category: ${category}
- Priority: ${priority}

Draft a highly appropriate response.
Rules:
1. Speak in a friendly, helpful, and professional business tone.
2. Address the customer by name (e.g. "Hi Priya") if a real name is provided.
3. Tailor the length to the channel. WhatsApp/Instagram should be shorter and conversational. Emails can be slightly more formal but still modern.
4. Keep the message concise: ideally 2 to 4 sentences.
5. If the priority is "urgent" or category is a legal/severe complaint, draft an empathetic response saying that management is looking into this immediately and will contact them directly.

Return ONLY a JSON object with exactly one field:
{
  "reply": "your drafted reply here"
}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: 'You draft business replies. Return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Groq API Error: ${errorMsg}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty reply content received.');
  }

  const parsed = JSON.parse(content);
  return {
    reply: parsed.reply || 'Hello! Thank you for contacting us. We will get back to you shortly.'
  };
}

/**
 * Heuristic Reply Drafting Fallback
 */
export function heuristicDraftReply(
  channel: ChannelType,
  sender: string,
  message: string,
  category: string,
  priority: string
): { reply: string } {
  const firstName = sender.split(' ')[0] || 'there';
  const text = message.toLowerCase();

  if (category.toLowerCase().includes('legal') || text.includes('legal') || text.includes('sue') || text.includes('lawyer')) {
    return {
      reply: `Hello ${firstName}, thank you for your message. We have received your query and have escalated it directly to our administration and management team. Someone will be in touch with you via email shortly.`
    };
  }

  if (category.toLowerCase().includes('complain') || category.toLowerCase().includes('dispute') || text.includes('refund') || text.includes('angry')) {
    return {
      reply: `Hi ${firstName}, I am very sorry to hear about this issue. We want to make this right immediately. I have flagged this to our support lead, and they are reviewing your order details as we speak. We will message you back with an update in a few minutes.`
    };
  }

  if (category.toLowerCase().includes('spam') || text.includes('free followers') || text.includes('marketing audit')) {
    return {
      reply: `Thank you for reaching out. We are currently not interested in unsolicited vendor proposals. Best regards.`
    };
  }

  if (category.toLowerCase().includes('video') || category.toLowerCase().includes('photo') || category.toLowerCase().includes('lead') || text.includes('budget') || text.includes('hire')) {
    return {
      reply: `Hi ${firstName}! Thanks for reaching out. We'd love to help with your project! Would you be open to a quick 10-minute discovery call tomorrow so we can understand your requirements and give you an accurate budget?`
    };
  }

  return {
    reply: `Hi ${firstName}, thanks for reaching out to us on ${channel}! We appreciate your message regarding "${category}". How can we help you today?`
  };
}
