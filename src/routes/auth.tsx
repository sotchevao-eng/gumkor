import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход координатора — РяZань ZA ВДВ" },
      {
        name: "description",
        content:
          "Служебный вход для координатора группы «РяZань ZA ВДВ»: управление разделом потребностей.",
      },
      { property: "og:title", content: "Вход координатора — РяZань ZA ВДВ" },
      { property: "og:description", content: "Служебная страница входа для координатора группы." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error("Укажите почту и пароль не короче 6 символов");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Аккаунт создан", {
            description: "Подтвердите адрес по ссылке из письма, затем войдите.",
          });
          setMode("signin");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      await supabase.rpc("claim_first_admin");
      navigate({ to: "/admin" });
    } catch (error) {
      toast.error("Не удалось войти", {
        description: error instanceof Error ? error.message : "Проверьте почту и пароль.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Служебный раздел"
        title="Вход координатора"
        description="Доступ к управлению потребностями. Обычным посетителям сайта вход не нужен."
      />
      <section className="mx-auto w-full max-w-md px-4 py-12">
        <form onSubmit={submit} className="card-elevated grid gap-4 p-6" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="email">Почта</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {mode === "signin" ? "Войти" : "Создать аккаунт"}
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin"
              ? "Первый вход: создать аккаунт координатора"
              : "У меня уже есть аккаунт"}
          </button>
        </form>
      </section>
    </>
  );
}
