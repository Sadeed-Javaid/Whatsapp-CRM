"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Message } from "@/types";

interface UseRealtimeMessagesOptions {
  contactId: string | null;
  onMessage: (message: Message) => void;
}

export function useRealtimeMessages({ contactId, onMessage }: UseRealtimeMessagesOptions) {
  const supabase = createClient();

  useEffect(() => {
    if (!contactId) return;

    const channel = supabase
      .channel(`messages-${contactId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contactId]);
}

export function useRealtimeMessageStatus(onUpdate: (id: string, status: string) => void) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("message-status-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          onUpdate(payload.new.id, payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
