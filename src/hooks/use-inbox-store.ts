import { create } from "zustand";
import { Contact, Message } from "@/types";

interface InboxStore {
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;

  unreadCounts: Record<string, number>;
  setUnreadCount: (contactId: string, count: number) => void;
  clearUnread: (contactId: string) => void;

  messages: Record<string, Message[]>;
  addMessage: (contactId: string, message: Message) => void;
  setMessages: (contactId: string, messages: Message[]) => void;
}

export const useInboxStore = create<InboxStore>((set) => ({
  selectedContactId: null,
  setSelectedContactId: (id) => set({ selectedContactId: id }),

  unreadCounts: {},
  setUnreadCount: (contactId, count) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [contactId]: count },
    })),
  clearUnread: (contactId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [contactId]: 0 },
    })),

  messages: {},
  addMessage: (contactId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [contactId]: [...(state.messages[contactId] ?? []), message],
      },
    })),
  setMessages: (contactId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [contactId]: messages },
    })),
}));
