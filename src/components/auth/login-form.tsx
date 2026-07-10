"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup";

interface LoginFormProps {
  authError?: boolean;
}

export function LoginForm({ authError }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    authError ? "No se pudo completar el inicio de sesión. Inténtalo de nuevo." : null
  );
  const [info, setInfo] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    const supabase = createClient();

    if (mode === "signup") {
      if (nombre.trim().length === 0) {
        setError("Introduce tu nombre.");
        setIsSubmitting(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: nombre.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(
          signUpError.message.toLowerCase().includes("already registered") ||
            signUpError.message.toLowerCase().includes("already been registered")
            ? "Ya existe una cuenta con ese email."
            : signUpError.message
        );
        setIsSubmitting(false);
        return;
      }

      if (!data.session) {
        setInfo("Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.");
        setIsSubmitting(false);
        return;
      }

      router.push("/");
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes("invalid login credentials")
          ? "Email o contraseña incorrectos."
          : signInError.message
      );
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1 rounded-md bg-[var(--surface-muted)] p-1 text-sm">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`rounded-sm py-1.5 font-medium transition-colors ${
            mode === "signin"
              ? "bg-[var(--background)] text-[var(--foreground)]"
              : "text-[var(--muted)]"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`rounded-sm py-1.5 font-medium transition-colors ${
            mode === "signup"
              ? "bg-[var(--background)] text-[var(--foreground)]"
              : "text-[var(--muted)]"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6}
            required
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-center text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {info && (
          <p className="rounded-md border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-center text-sm text-emerald-300">
            {info}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? "Procesando…"
            : mode === "signup"
              ? "Crear cuenta"
              : "Iniciar sesión"}
        </Button>
      </form>
    </div>
  );
}
