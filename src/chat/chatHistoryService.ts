/**
 * Chat History Service
 * Manages multiple chat conversations
 */

// Browser API type declaration
declare const localStorage: Storage;

export interface ChatConversation {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export class ChatHistoryService {
  private conversations: Map<string, ChatConversation> = new Map();

  /**
   * Create new conversation
   */
  createConversation(firstMessage?: string): ChatConversation {
    const conversation: ChatConversation = {
      id: `chat_${Date.now()}`,
      title: this.generateTitle(firstMessage),
      preview: firstMessage?.substring(0, 50) || 'New conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0
    };

    this.conversations.set(conversation.id, conversation);
    this.saveToStorage();
    
    return conversation;
  }

  /**
   * Get all conversations
   */
  getAllConversations(): ChatConversation[] {
    this.loadFromStorage();
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get conversation by ID
   */
  getConversation(id: string): ChatConversation | null {
    return this.conversations.get(id) || null;
  }

  /**
   * Update conversation
   */
  updateConversation(id: string, updates: Partial<ChatConversation>): void {
    const conversation = this.conversations.get(id);
    if (conversation) {
      Object.assign(conversation, updates, { updatedAt: new Date() });
      this.saveToStorage();
    }
  }

  /**
   * Delete conversation
   */
  deleteConversation(id: string): void {
    this.conversations.delete(id);
    this.saveToStorage();
  }

  /**
   * Rename conversation
   */
  renameConversation(id: string, newTitle: string): void {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.title = newTitle;
      conversation.updatedAt = new Date();
      this.saveToStorage();
    }
  }

  // Helper methods

  private generateTitle(firstMessage?: string): string {
    if (!firstMessage) return 'New Chat';
    
    // Extract key words for title
    const words = firstMessage.split(' ').slice(0, 5);
    return words.join(' ') + (firstMessage.split(' ').length > 5 ? '...' : '');
  }

  private saveToStorage(): void {
    const data = Array.from(this.conversations.entries());
    localStorage.setItem('chatHistory', JSON.stringify(data));
  }

  private loadFromStorage(): void {
    const data = localStorage.getItem('chatHistory');
    if (data) {
      try {
        const entries = JSON.parse(data);
        this.conversations = new Map(entries.map(([id, conv]: [string, any]) => [
          id,
          {
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt)
          }
        ]));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }
}
