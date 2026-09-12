import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Проверяет роль администратора на сервере (SECURITY DEFINER функция в базе).
 * Первый созданный аккаунт координатора получает роль администратора.
 */
export function useAdminGate() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data } = await supabase.rpc("claim_first_admin");
        if (active) setIsAdmin(Boolean(data));
      } catch {
        if (active) setIsAdmin(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return isAdmin;
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
