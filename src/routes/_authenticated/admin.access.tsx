import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTester, deleteTester, listStaff, setStaffRole } from "@/lib/staff.functions";
import { formatDateTime } from "@/lib/admin-types";
import { useCurrentStaffRole } from "@/lib/staff-context";

export const Route = createFileRoute("/_authenticated/admin/access")({
  component: AdminAccess,
});

const ROLE_LABEL: Record<string, string> = {
  admin: "Координатор",
  tester: "Tester / Developer",
  none: "Без доступа",
};

function AdminAccess() {
  const role = useCurrentStaffRole();
  const queryClient = useQueryClient();
  const fetchStaff = useServerFn(listStaff);
  const addTester = useServerFn(createTester);
  const changeRole = useServerFn(setStaffRole);
  const removeUser = useServerFn(deleteTester);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const staff = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: () => fetchStaff({ data: undefined as never }),
    enabled: role === "admin",
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
  }

  const create = useMutation({
    mutationFn: () => addTester({ data: { email, password } }),
    onSuccess: () => {
      toast.success("Тестовый аккаунт создан");
      setEmail("");
      setPassword("");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: (input: { userId: string; role: "tester" | "none" }) => changeRole({ data: input }),
    onSuccess: () => {
      toast.success("Доступ обновлён");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Аккаунт удалён");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (role !== "admin") {
    return (
      <div className="card-elevated p-6">
        <h1 className="text-2xl">Доступы</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Управление доступами доступно только координатору.
        </p>
      </div>
    );
  }

  const list = staff.data ?? [];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl">Доступы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Роль «Tester / Developer» нужна только на время разработки: потребности, отчёты,
          категории и просмотр настроек. Заявки и любые персональные данные тестировщику
          недоступны. Перед запуском сайта отключите или удалите тестовый аккаунт.
        </p>
      </div>

      <div className="card-elevated grid gap-4 p-5">
        <h2 className="text-lg">Создать временный тестовый аккаунт</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="tester-email">Почта</Label>
            <Input
              id="tester-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tester-password">Пароль (не короче 10 символов)</Label>
            <Input
              id="tester-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Пароль задаёте вы и передаёте разработчику лично. Он не сохраняется в коде сайта и нигде
          не показывается повторно.
        </p>
        <div>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            Создать аккаунт Tester
          </Button>
        </div>
      </div>

      <div className="card-elevated p-5">
        <h2 className="text-lg">Служебные аккаунты</h2>
        {staff.isPending ? (
          <p className="mt-3 text-sm text-muted-foreground">Загружаем список…</p>
        ) : staff.isError ? (
          <p className="mt-3 text-sm text-destructive">
            {(staff.error as Error).message}
          </p>
        ) : (
          <div className="mt-3 grid gap-3">
            {list.map((member) => (
              <div
                key={member.userId}
                className="grid gap-2 rounded-lg border border-border p-4 sm:flex sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{member.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABEL[member.role]} · создан {formatDateTime(member.createdAt)}
                    {member.lastSignInAt
                      ? ` · вход ${formatDateTime(member.lastSignInAt)}`
                      : " · ещё не входил"}
                  </p>
                </div>
                {member.role === "admin" ? null : (
                  <div className="flex flex-wrap gap-2">
                    {member.role === "tester" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => update.mutate({ userId: member.userId, role: "none" })}
                      >
                        Отключить доступ
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => update.mutate({ userId: member.userId, role: "tester" })}
                      >
                        Выдать роль Tester
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove.mutate(member.userId)}
                    >
                      Удалить аккаунт
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
