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

    startTransition(async () => {
      if (IS_MOCK) {
        const res = await fetch("/api/mock/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, faccion: faccion || null }),
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
        .update({ nombre, faccion: faccion || null })
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
      className="max-w-lg space-y-4 rounded-xl border border-neutral-200 bg-white p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
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
