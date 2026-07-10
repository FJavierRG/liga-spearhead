"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/types/database";
import {
  PLAYER_NAME_MAX_LENGTH,
  sanitizePlayerName,
  validatePlayerName,
} from "@/lib/validation/player-name";

interface ProfileEditFormProps {
  profile: User;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const supabase = IS_MOCK ? null : createClient();
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState(profile.nombre);
  const [faccion, setFaccion] = useState(profile.faccion ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nameCheck = validatePlayerName(nombre);
    if (!nameCheck.ok) {
      toast.error(nameCheck.error);
      return;
    }

    startTransition(async () => {
      if (IS_MOCK) {
        const res = await fetch("/api/mock/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nameCheck.value,
            faccion: faccion || null,
          }),
        });

        if (!res.ok) {
          toast.error("No se pudo actualizar el perfil");
          return;
        }

        toast.success("Perfil actualizado");
        router.push("/perfil");
        router.refresh();
        return;
      }

      const { error } = await supabase!
        .from("users")
        .update({ nombre: nameCheck.value, faccion: faccion || null })
        .eq("id", profile.id);

      if (error) {
        toast.error("No se pudo actualizar el perfil");
        return;
      }

      toast.success("Perfil actualizado");
      router.push("/perfil");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fantasy-panel space-y-4 p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(sanitizePlayerName(e.target.value))}
          maxLength={PLAYER_NAME_MAX_LENGTH}
          required
        />
        <p className="text-xs text-[var(--muted)]">
          Máximo {PLAYER_NAME_MAX_LENGTH} caracteres.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="faccion">Facción principal (opcional)</Label>
        <Input
          id="faccion"
          value={faccion}
          onChange={(e) => setFaccion(e.target.value)}
          placeholder="Ej. Stormcast Eternals"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
