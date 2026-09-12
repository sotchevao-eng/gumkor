import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StaffRole = "admin" | "tester" | "none";

export const STAFF_ROLE_LABEL: Record<Exclude<StaffRole, "none">, string> = {
  admin: "Координатор — полный доступ",
  tester: "Режим разработки — Tester",
};

/**
 * Проверяет роль на сервере (SECURITY DEFINER функции в базе).
 * Первый созданный аккаунт координатора получает роль администратора.
 * Роль tester — временный доступ разработчика без доступа к заявкам.
 */
export function useStaffRole() {
  const [role, setRole] = useState<StaffRole | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await supabase.rpc("claim_first_admin");
        const { data } = await supabase.rpc("my_admin_role");
        if (!active) return;
        setRole(data === "admin" || data === "tester" ? data : "none");
      } catch {
        if (active) setRole("none");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return role;
}

/** Автоматический выход при длительном бездействии. */
export function useIdleSignOut(onIdle: () => void, minutes = 30) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(onIdle, minutes * 60 * 1000);
    };
    const events = ["click", "keydown", "pointermove", "visibilitychange"] as const;
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [onIdle, minutes]);
}
