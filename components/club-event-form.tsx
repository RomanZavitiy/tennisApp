"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CLUB_EVENT_BODY_MAX,
  CLUB_EVENT_TITLE_MAX,
} from "@/lib/validation/club-event";

type PostResult = { ok: true } | { ok: false; message: string };

// Club news from the staff panel (slice PD5, task PD5.1). postClubEvent
// validates again and checks the daily limit; this only collects the two
// fields. Stays open after a post (cleared), so staff can post the next one.
export function ClubEventForm({
  action,
  labels,
}: {
  action: (input: unknown) => Promise<PostResult>;
  labels: {
    title: string;
    body: string;
    submit: string;
    submitting: string;
    done: string;
  };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  return (
    <form
      ref={formRef}
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPosted(false);
        setMessage(null);
        startTransition(async () => {
          const result = await action({
            title: form.get("title"),
            body: form.get("body"),
          });
          if (result.ok) {
            formRef.current?.reset();
            setPosted(true);
          } else {
            setMessage(result.message);
          }
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="club-event-title">{labels.title}</Label>
        <Input
          id="club-event-title"
          name="title"
          required
          maxLength={CLUB_EVENT_TITLE_MAX}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="club-event-body">{labels.body}</Label>
        <Textarea
          id="club-event-body"
          name="body"
          rows={4}
          required
          maxLength={CLUB_EVENT_BODY_MAX}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? labels.submitting : labels.submit}
      </Button>
      {posted && (
        <p role="status" className="text-sm text-muted-foreground">
          {labels.done}
        </p>
      )}
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </form>
  );
}
