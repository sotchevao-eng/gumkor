import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type Settings = {
  coordinator_name: string;
  phone: string;
  vk_url: string;
  max_contact: string;
  email: string;
  donation_details: string;
  footer_text: string;
};

const empty: Settings = {
  coordinator_name: "",
  phone: "",
  vk_url: "",
  max_contact: "",
  email: "",
  donation_details: "",
  footer_text: "",
};

function AdminSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Settings>(empty);

  const settings = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select(
          "coordinator_name, phone, vk_url, max_contact, email, donation_details, footer_text",
        )
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? empty) as Settings;
    },
  });

  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ id: true, ...form }, { onConflict: "id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Настройки сохранены");
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function field(key: keyof Settings, label: string, placeholder?: string) {
    return (
      <div className="grid gap-2">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          value={form[key]}
          placeholder={placeholder}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl">Настройки сайта</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Изменения применяются только после нажатия «Сохранить».
        </p>
      </div>

      <div className="card-elevated grid gap-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("coordinator_name", "ФИО координатора")}
          {field("phone", "Телефон", "+7 ___ ___-__-__")}
          {field("vk_url", "ВКонтакте", "https://vk.ru/...")}
          {field("max_contact", "MAX", "ссылка или номер в MAX")}
          {field("email", "E-mail", "почта для обращений")}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="donation_details">Реквизиты для помощи</Label>
          <Textarea
            id="donation_details"
            rows={4}
            value={form.donation_details}
            onChange={(e) => setForm({ ...form, donation_details: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="footer_text">Текст в footer</Label>
          <Textarea
            id="footer_text"
            rows={3}
            value={form.footer_text}
            onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => save.mutate()} disabled={save.isPending}>
            Сохранить
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => settings.data && setForm(settings.data)}
            disabled={save.isPending}
          >
            Отменить изменения
          </Button>
        </div>
      </div>
    </div>
  );
}
