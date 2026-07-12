/** Bot-hub message shape consumed by ThreeJSScenePure (see COMPATIBLE_MESSAGES.md). */
export interface HubMessage {
  id: string;
  fromBot: string;
  toBot: string;
  channel: string;
  content?: string;
  timestamp?: number;
  type?: 'bot-to-center' | 'center-to-bot' | 'bot-to-bot' | string;
}

export interface Message {
  id: string;
  timestamp: Date;
  channel: string;
  type: string;
  content: string;
  source?: string;
  target?: string;
}

export interface MessageFilter {
  channels: string[];
  types: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface MessageStats {
  total: number;
  byChannel: Record<string, number>;
  byType: Record<string, number>;
}
