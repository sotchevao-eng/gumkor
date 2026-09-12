import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type StaffMember = {
  userId: string;
  email: string;
  role: "admin" | "tester" | "none";
  createdAt: string;
  lastSignInAt: string | null;
};

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>;
  };
  const { data } = await supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Доступ только для координатора");
}

/** Список служебных аккаунтов. Только для координатора. */
export const listStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StaffMember[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roleByUser = new Map<string, "admin" | "tester">();
    for (const row of roles ?? []) {
      if (row.role === "admin") roleByUser.set(row.user_id, "admin");
      else if (row.role === "tester" && roleByUser.get(row.user_id) !== "admin") {
        roleByUser.set(row.user_id, "tester");
      }
    }

    return users.users.map((user) => ({
      userId: user.id,
      email: user.email ?? "—",
      role: roleByUser.get(user.id) ?? "none",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
    }));
  });

/** Создаёт временный тестовый аккаунт с ролью tester. Пароль задаёт координатор. */
export const createTester = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; password: string }) => {
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Укажите корректную почту");
    if (input.password.length < 10) throw new Error("Пароль должен быть не короче 10 символов");
    return { email, password: input.password };
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    const userId = created.user?.id;
    if (!userId) throw new Error("Не удалось создать аккаунт");

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "tester" });
    if (roleError) throw new Error(roleError.message);

    return { userId, email: data.email };
  });

/** Меняет служебную роль аккаунта: tester или полное отключение доступа. */
export const setStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "tester" | "none" }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) {
      throw new Error("Нельзя менять собственную роль");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((existing ?? []).some((row) => row.role === "admin")) {
      throw new Error("Это аккаунт координатора — роль меняется только в базе");
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (data.role === "tester") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: "tester" });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Полностью удаляет тестовый аккаунт (перед запуском сайта). */
export const deleteTester = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Нельзя удалить собственный аккаунт");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if ((existing ?? []).some((row) => row.role === "admin")) {
      throw new Error("Аккаунт координатора удалить нельзя");
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
