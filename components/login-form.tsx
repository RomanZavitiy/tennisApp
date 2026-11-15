"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  continueIfSignedIn,
  sendMagicLink,
  verifyLoginCode,
} from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginCodeSchema,
  type LoginCodeValues,
  loginSchema,
  type LoginValues,
} from "@/lib/validation/login";

// Email form for the magic link. Zod runs in the browser first, so an empty
// or malformed email never reaches the server; the action re-checks anyway.
// Once the email is sent, the same spot asks for the code from it, so the
// player can finish signing in right here instead of in the new window the
// email's button opens.
export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("LoginForm");
  const tValidation = useTranslations("Validation.login");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema(tValidation)),
    defaultValues: { email: "" },
  });

  async function onSubmit({ email }: LoginValues) {
    const result = await sendMagicLink({ email, next });
    if (result.ok) {
      setSentTo(email.trim());
    } else {
      setError("root", { message: result.message });
    }
  }

  if (sentTo) {
    return (
      <CodeForm
        email={sentTo}
        next={next}
        onDifferentEmail={() => {
          setSentTo(null);
        }}
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}

function CodeForm({
  email,
  next,
  onDifferentEmail,
}: {
  email: string;
  next: string;
  onDifferentEmail: () => void;
}) {
  const t = useTranslations("LoginForm");
  const tValidation = useTranslations("Validation.login");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginCodeValues>({
    resolver: zodResolver(loginCodeSchema(tValidation)),
    defaultValues: { code: "" },
  });

  // The player may press the email's button instead, which signs them in in
  // another tab. Coming back to this one then moves it on as well.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void continueIfSignedIn(next);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [next]);

  async function onSubmit({ code }: LoginCodeValues) {
    // Returns only when the code was refused; success is a redirect.
    const result = await verifyLoginCode({ email, code, next });
    setError("code", { message: result.message });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="space-y-4"
    >
      <div role="status" className="space-y-2">
        <h2 className="text-lg font-semibold">{t("checkEmailTitle")}</h2>
        <p className="text-muted-foreground">
          {t.rich("checkEmailBody", {
            email,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">{t("codeLabel")}</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={14}
          className="h-12 text-center font-mono text-xl tracking-[0.4em]"
          aria-invalid={errors.code ? true : undefined}
          aria-describedby={errors.code ? "code-error" : undefined}
          {...register("code")}
        />
        {errors.code && (
          <p id="code-error" role="alert" className="text-sm text-destructive">
            {errors.code.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("verifying") : t("verify")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onDifferentEmail}
      >
        {t("differentEmail")}
      </Button>
    </form>
  );
}
