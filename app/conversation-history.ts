export type ConversationRecord<Message> = { id: string; messages: Message[]; updatedAt: number; repository?: string };

export function upsertConversation<Message>(conversations: ConversationRecord<Message>[], entry: ConversationRecord<Message>, maximum = 30) {
  return [entry, ...conversations.filter((conversation) => conversation.id !== entry.id)]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, maximum);
}
