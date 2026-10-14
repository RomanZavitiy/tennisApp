"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { sendMessage } from "@/app/offers/[id]/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_MAX } from "@/lib/validation/message";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type ThreadMessage = {
  id: string;
  type: "TEXT" | "SYSTEM";
  content: string;
  senderId: string | null;
  createdAt: string;
};

type MessageRow = {
  id: string;
  type: "TEXT" | "SYSTEM";
  content: string;
  sender_id: string | null;
  created_at: string;
};

// A join's private thread (3.17, 3.18): server-rendered history, a compose
// box, and a Realtime subscription so a message sent from another browser
// shows up here without a reload. This browser's own sends are appended
// straight from sendMessage's result, not round-tripped through Realtime —
// `seen` only guards against the subscription later echoing the same row
// back. Losing the Realtime connection doesn't break anything here: there's
// nothing to undo, and the next reload re-reads history from the server.
export function MessageThread({
  offerJoinId,
  viewerId,
  senderNames,
  initialMessages,
  writable,
}: {
  offerJoinId: string;
  viewerId: string;
  /** Display name for every id that can send into this thread. */
  senderNames: Record<string, string>;
  initialMessages: ThreadMessage[];
  writable: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const seen = useRef(new Set(initialMessages.map((message) => message.id)));

  function addMessage(message: ThreadMessage) {
    if (seen.current.has(message.id)) return;
    seen.current.add(message.id);
    setMessages((current) => [...current, message]);
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`messages:offer-join:${offerJoinId}`)
      .on<MessageRow>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `offer_join_id=eq.${offerJoinId}`,
        },
        (payload) => {
          addMessage({
            id: payload.new.id,
            type: payload.new.type,
            content: payload.new.content,
            senderId: payload.new.sender_id,
            createdAt: payload.new.created_at,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [offerJoinId]);

  function submit() {
    const content = text.trim();
    if (!content || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await sendMessage(offerJoinId, content);
      if (result.ok) {
        addMessage(result.sentMessage);
        setText("");
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {messages.length === 0 && (
          <li className="text-sm text-muted-foreground">No messages yet.</li>
        )}
        {messages.map((message) =>
          message.type === "SYSTEM" ? (
            <li
              key={message.id}
              className="text-center text-xs text-muted-foreground italic"
            >
              {message.content}
            </li>
          ) : (
            <li key={message.id} className="text-sm">
              <span className="font-medium">
                {message.senderId === viewerId
                  ? "You"
                  : (senderNames[message.senderId ?? ""] ?? "A player")}
                :
              </span>{" "}
              {message.content}
            </li>
          ),
        )}
      </ul>
      {writable ? (
        <div className="space-y-1">
          <Textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
            }}
            maxLength={MESSAGE_MAX}
            rows={2}
            placeholder="Write a message…"
            disabled={pending}
          />
          <div className="flex items-center justify-between gap-2">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="button"
              size="sm"
              disabled={pending || text.trim().length === 0}
              onClick={submit}
            >
              {pending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This conversation is read-only now.
        </p>
      )}
    </div>
  );
}
