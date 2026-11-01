"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { sendMessage } from "@/app/offers/[id]/actions";
import { reportMessage } from "@/app/offers/[id]/report-actions";
import {
  reportClubMessage,
  sendClubMessage,
} from "@/app/clubs/[id]/chat-actions";
import { ReportButton } from "@/components/report-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isSystemMessageKey } from "@/lib/messages/system-message-keys";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { MESSAGE_MAX } from "@/lib/validation/message";

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

/** Which thread this is: a join's private one, or a club's chat (O.12). */
export type ThreadRef =
  { kind: "join"; id: string } | { kind: "club"; id: string };

function threadColumn(kind: ThreadRef["kind"]): "offer_join_id" | "club_id" {
  return kind === "join" ? "offer_join_id" : "club_id";
}

// A thread's messages (3.17, 3.18, generalized for O.12): server-rendered
// history, a compose box, and a Realtime subscription so a message sent
// from another browser shows up here without a reload. This browser's own
// sends are appended straight from the send action's result, not
// round-tripped through Realtime — `seen` only guards against the
// subscription later echoing the same row back. Losing the Realtime
// connection doesn't break anything here: there's nothing to undo, and the
// next reload re-reads history from the server. The join thread's own
// behaviour is unchanged — only the Realtime filter, channel name, and
// which send/report action fires now depend on `thread.kind`.
export function MessageThread({
  thread,
  viewerId,
  senderNames,
  initialMessages,
  writable,
}: {
  thread: ThreadRef;
  viewerId: string;
  /** Display name for every id that can send into this thread. */
  senderNames: Record<string, string>;
  initialMessages: ThreadMessage[];
  writable: boolean;
}) {
  const t = useTranslations("MessageThread");
  const tSystem = useTranslations("SystemMessages");
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
    const column = threadColumn(thread.kind);
    const channel = supabase
      .channel(`messages:${thread.kind}:${thread.id}`)
      .on<MessageRow>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `${column}=eq.${thread.id}`,
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
  }, [thread.kind, thread.id]);

  function submit() {
    const content = text.trim();
    if (!content || pending) return;
    setError(null);
    startTransition(async () => {
      const result =
        thread.kind === "join"
          ? await sendMessage(thread.id, content)
          : await sendClubMessage(thread.id, content);
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
          <li className="text-sm text-muted-foreground">
            {t("noMessagesYet")}
          </li>
        )}
        {messages.map((message) =>
          message.type === "SYSTEM" ? (
            <li
              key={message.id}
              className="text-center text-xs text-muted-foreground italic"
            >
              {/* A message from before task 1.20 stored the English
                  sentence itself (never rewritten) — only a recognized key
                  (isSystemMessageKey) goes through the viewer's own
                  language. */}
              {isSystemMessageKey(message.content)
                ? tSystem(message.content)
                : message.content}
            </li>
          ) : (
            <li key={message.id} className="text-sm">
              <span className="font-medium">
                {message.senderId === viewerId
                  ? t("you")
                  : (senderNames[message.senderId ?? ""] ?? t("aPlayer"))}
                :
              </span>{" "}
              {message.content}
              {/* Task 3.19: only beside someone else's message — reporting
                  your own message makes no sense, and createReport refuses
                  it anyway. */}
              {message.senderId !== viewerId && (
                <div className="mt-1">
                  <ReportButton
                    action={
                      thread.kind === "join"
                        ? reportMessage.bind(null, thread.id, message.id)
                        : reportClubMessage.bind(null, thread.id, message.id)
                    }
                    label={t("report")}
                  />
                </div>
              )}
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
            placeholder={t("writeAMessage")}
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
              {pending ? t("sending") : t("send")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("readOnly")}</p>
      )}
    </div>
  );
}
