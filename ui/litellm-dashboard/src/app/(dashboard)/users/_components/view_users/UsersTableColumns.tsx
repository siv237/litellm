"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, Info, KeyRound, MoreHorizontal, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

import { UserInfo, userUpdateUserCall } from "@/components/networking";
import { createSelectionColumn, DataTableSortHeader } from "@/components/shared/DataTable";
import { CellTooltip, DateCell, IdentityCell, MoneyCell, StatusBadge } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

const SSO_ID_HINT =
  "SSO ID — это ID пользователя у SSO-провайдера. Если пользователь не использует SSO, значение отсутствует.";

const SCIM_INACTIVE_HINT = "Деактивирован через SCIM (внешний провайдер идентичности). Виртуальные ключи пользователя заблокированы.";

const DURATION_LABELS: Record<string, string> = {
  "30m": "каждые 30 мин",
  "1h": "ежечасно",
  "6h": "каждые 6 часов",
  "12h": "каждые 12 часов",
  "24h": "ежедневно",
  "1d": "ежедневно",
  "7d": "еженедельно",
  "1w": "еженедельно",
  "14d": "раз в 2 недели",
  "28d": "ежемесячно",
  "30d": "ежемесячно",
  "1mo": "ежемесячно",
  "3mo": "ежеквартально",
  "6mo": "раз в полгода",
  "12mo": "ежегодно",
  "1y": "ежегодно",
};

function isScimInactive(user: UserInfo): boolean {
  return (user.metadata as Record<string, unknown> | null | undefined)?.scim_active === false;
}

interface UserRowActionsProps {
  user: UserInfo;
  onUserClick: (userId: string, openInEditMode?: boolean) => void;
  onDeleteUser: (user: UserInfo) => void;
  onResetPassword: (userId: string) => void;
}

function UserRowActions({ user, onUserClick, onDeleteUser, onResetPassword }: UserRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Действия пользователя"
        data-testid={`user-actions-${user.user_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onUserClick(user.user_id, true)} data-testid="user-action-edit">
          <Pencil />
          Изменить пользователя
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResetPassword(user.user_id)} data-testid="user-action-reset-password">
          <KeyRound />
          Сбросить пароль
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void copyToClipboard(user.user_id, "ID пользователя скопирован")}
          data-testid="user-action-copy"
        >
          <Copy />
          Копировать ID пользователя
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDeleteUser(user)} data-testid="user-action-delete">
          <Trash2 />
          Удалить пользователя
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface UsersTableColumnsDeps {
  possibleUIRoles: Record<string, Record<string, string>> | null;
  includeSelection: boolean;
  accessToken: string | null;
  canEdit: boolean;
  onQuotaChanged: () => void;
  onUserClick: (userId: string, openInEditMode?: boolean) => void;
  onDeleteUser: (user: UserInfo) => void;
  onResetPassword: (userId: string) => void;
}

async function patchUser(accessToken: string | null, body: Record<string, unknown>, okMessage: string): Promise<boolean> {
  if (!accessToken) return false;
  try {
    await userUpdateUserCall(accessToken, body, null);
    toast.success(okMessage);
    return true;
  } catch (error) {
    toast.fromError(error instanceof Error ? error.message : "Не удалось обновить");
    return false;
  }
}

const DURATION_MENU_OPTIONS: { value: string | null; label: string }[] = [
  { value: null, label: "Без сброса (фикс.)" },
  { value: "1h", label: "Ежечасно" },
  { value: "6h", label: "Каждые 6 часов" },
  { value: "12h", label: "Каждые 12 часов" },
  { value: "1d", label: "Ежедневно" },
  { value: "7d", label: "Еженедельно" },
  { value: "1mo", label: "Ежемесячно" },
];

function QuotaModeCell({
  user,
  accessToken,
  canEdit,
  onQuotaChanged,
}: {
  user: UserInfo;
  accessToken: string | null;
  canEdit: boolean;
  onQuotaChanged: () => void;
}) {
  const { max_budget: maxBudget, budget_duration: budgetDuration, budget_reset_at: budgetResetAt } = user;
  const resetLabel = budgetDuration
    ? DURATION_LABELS[budgetDuration.toLowerCase()] ?? `${budgetDuration} reset`
    : null;
  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-normal",
        resetLabel
          ? "border-info/30 bg-info/10 text-info"
          : "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
        canEdit && "cursor-pointer hover:border-primary/50",
      )}
    >
      {maxBudget == null ? "Нет бюджета" : (resetLabel ?? "Фикс.")}
    </Badge>
  );
  const hint =
    maxBudget == null
      ? "Бюджет не задан, окно сброса не действует. Нажмите «Бюджет», чтобы задать его."
      : budgetDuration
        ? budgetResetAt
          ? `Бюджет сбрасывается ${budgetDuration}; следующий сброс: ${new Date(budgetResetAt).toLocaleString()}`
          : `Бюджет сбрасывается ${budgetDuration}`
        : null;

  if (!canEdit) {
    return hint ? <CellTooltip content={hint} trigger={<span>{badge}</span>} /> : badge;
  }

  const currentVal = budgetDuration?.toLowerCase() ?? null;
  const matchesMenu = DURATION_MENU_OPTIONS.some((option) => option.value === currentVal);
  const customLabel =
    currentVal && !matchesMenu ? (DURATION_LABELS[currentVal] ?? `${currentVal} reset`) : null;

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Edit quota window for ${user.user_email || user.user_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "h-auto w-auto p-0 hover:bg-transparent")}
      >
        {badge}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {DURATION_MENU_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value ?? "fixed"}
            onClick={async () => {
              if (option.value === currentVal) return;
              const ok = await patchUser(
                accessToken,
                { user_id: user.user_id, budget_duration: option.value },
                `Quota window: ${option.label}`,
              );
              if (ok) onQuotaChanged();
            }}
          >
            <span className="flex-1">{option.label}</span>
            {option.value === currentVal && <span className="text-xs text-primary">current</span>}
          </DropdownMenuItem>
        ))}
        {customLabel && (
          <DropdownMenuItem disabled>
            <span className="flex-1">{customLabel}</span>
            <span className="text-xs text-primary">current</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return hint ? <CellTooltip content={hint} trigger={<span>{menu}</span>} /> : menu;
}

function BudgetCell({
  user,
  accessToken,
  canEdit,
  onQuotaChanged,
}: {
  user: UserInfo;
  accessToken: string | null;
  canEdit: boolean;
  onQuotaChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (!canEdit) {
    return <MoneyCell value={user.max_budget} decimals={2} emptyText="Без ограничений" showZero />;
  }

  const save = async (next: number | null) => {
    const ok = await patchUser(accessToken, { user_id: user.user_id, max_budget: next }, "Бюджет обновлён");
    if (ok) {
      setOpen(false);
      onQuotaChanged();
    }
  };

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) setValue(user.max_budget == null ? "" : String(user.max_budget)); }}>
      <PopoverTrigger
        aria-label={`Edit budget for ${user.user_email || user.user_id}`}
        className="rounded px-1 -mx-1 cursor-pointer hover:bg-muted"
        title="Нажмите, чтобы изменить бюджет"
      >
        <MoneyCell value={user.max_budget} decimals={2} emptyText="Без ограничений" showZero />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = value.trim();
            if (trimmed === "") {
              void save(null);
              return;
            }
            const parsed = Number.parseFloat(trimmed.replace(",", "."));
            if (!Number.isFinite(parsed) || parsed < 0) {
              toast.fromError("Введите корректную сумму");
              return;
            }
            void save(parsed === 0 ? null : parsed);
          }}
        >
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Сумма ($)"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <button type="button" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))} onClick={() => void save(null)}>
              Без ограничений
            </button>
            <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
              Сохранить
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function UsageCell({
  user,
  accessToken,
  canEdit,
  onQuotaChanged,
}: {
  user: UserInfo;
  accessToken: string | null;
  canEdit: boolean;
  onQuotaChanged: () => void;
}) {
  const [resetting, setResetting] = useState(false);
  const { spend, max_budget: maxBudget } = user;

  if (maxBudget == null || maxBudget <= 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const pct = Math.max(0, (spend / maxBudget) * 100);
  const shown = pct >= 10 ? `${Math.round(pct)}%` : `${Math.round(pct * 10) / 10}%`;
  const barClass = pct >= 95 ? "bg-destructive" : pct >= 75 ? "bg-warning" : "bg-success";
  const textClass = pct >= 95 ? "text-destructive" : pct >= 75 ? "text-warning" : "text-muted-foreground";

  const bar = (
    <span className="flex items-center gap-2">
      <span className="inline-block h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", barClass)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </span>
      <span className={cn("text-xs tabular-nums", textClass)}>{shown}</span>
    </span>
  );

  if (!canEdit || spend <= 0) {
    return <CellTooltip content={`$${spend.toFixed(2)} из $${maxBudget.toFixed(2)}`} trigger={bar} />;
  }

  return (
    <span className="flex w-full items-center justify-between gap-2">
      <CellTooltip content={`$${spend.toFixed(2)} из $${maxBudget.toFixed(2)}`} trigger={bar} />
      <AlertDialog>
        <AlertDialogTrigger
          aria-label={`Reset usage for ${user.user_email || user.user_id}`}
          title="Экстренный сброс: обнулить расход сейчас"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground hover:text-destructive")}
        >
          <RotateCcw className="size-3.5" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сбросить использование до нуля?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Расход ${user.user_email || user.user_id} будет немедленно снижен с $${spend.toFixed(2)} до $0. Расписание окна квоты останется прежним; история запросов не удаляется.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetting}
              onClick={async () => {
                setResetting(true);
                const ok = await patchUser(accessToken, { user_id: user.user_id, spend: 0 }, "Использование сброшено до $0");
                setResetting(false);
                if (ok) onQuotaChanged();
              }}
            >
              {resetting ? "Сброс…" : "Сбросить сейчас"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </span>
  );
}

export const getUsersTableColumns = ({
  possibleUIRoles,
  includeSelection,
  accessToken,
  canEdit,
  onQuotaChanged,
  onUserClick,
  onDeleteUser,
  onResetPassword,
}: UsersTableColumnsDeps): ColumnDef<UserInfo>[] => {
  const baseColumns: ColumnDef<UserInfo>[] = [
    {
      id: "user_id",
      accessorKey: "user_id",
      meta: { title: "ID пользователя" },
      header: ({ column }) => <DataTableSortHeader column={column} title="ID пользователя" variant="header-cycle" />,
      size: 220,
      enableSorting: true,
      cell: ({ row }) => (
        <IdentityCell
          title={row.original.user_id}
          titleClassName="font-mono text-xs text-primary"
          onClick={() => onUserClick(row.original.user_id, false)}
        />
      ),
    },
    {
      id: "user_email",
      accessorKey: "user_email",
      meta: { title: "Эл. почта" },
      header: ({ column }) => <DataTableSortHeader column={column} title="Эл. почта" variant="header-cycle" />,
      size: 220,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="block max-w-60 truncate text-sm" title={row.original.user_email ?? undefined}>
          {row.original.user_email || "-"}
        </span>
      ),
    },
    {
      id: "status",
      meta: { title: "Статус", skeleton: "badge" },
      header: "Статус",
      size: 110,
      enableSorting: false,
      cell: ({ row }) => {
        if (isScimInactive(row.original)) {
          return (
            <StatusBadge
              tone="error"
              label="Неактивный"
              tooltip={SCIM_INACTIVE_HINT}
              dataTestId={`user-status-${row.original.user_id}`}
            />
          );
        }
        return <StatusBadge tone="success" label="Активный" dataTestId={`user-status-${row.original.user_id}`} />;
      },
    },
    {
      id: "user_role",
      accessorKey: "user_role",
      meta: { title: "Глобальная роль прокси" },
      header: ({ column }) => <DataTableSortHeader column={column} title="Глобальная роль прокси" variant="header-cycle" />,
      size: 160,
      enableSorting: true,
      cell: ({ row }) => <span className="text-sm">{possibleUIRoles?.[row.original.user_role]?.ui_label || "-"}</span>,
    },
    {
      id: "user_alias",
      accessorKey: "user_alias",
      meta: { title: "Псевдоним пользователя" },
      header: "Псевдоним пользователя",
      size: 150,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block max-w-40 truncate text-sm" title={row.original.user_alias ?? undefined}>
          {row.original.user_alias || "-"}
        </span>
      ),
    },
    {
      id: "spend",
      accessorKey: "spend",
      meta: { title: "Расход (USD)", numeric: true },
      header: ({ column }) => <DataTableSortHeader column={column} title="Расход (USD)" variant="header-cycle" />,
      size: 130,
      enableSorting: true,
      cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={2} />,
    },
    {
      id: "max_budget",
      accessorKey: "max_budget",
      meta: { title: "Бюджет (USD)", numeric: true },
      header: "Бюджет (USD)",
      size: 150,
      enableSorting: false,
      cell: ({ row }) => (
        <BudgetCell user={row.original} accessToken={accessToken} canEdit={canEdit} onQuotaChanged={onQuotaChanged} />
      ),
    },
    {
      id: "quota_mode",
      meta: { title: "Квота" },
      header: "Квота",
      size: 140,
      enableSorting: false,
      cell: ({ row }) => (
        <QuotaModeCell user={row.original} accessToken={accessToken} canEdit={canEdit} onQuotaChanged={onQuotaChanged} />
      ),
    },
    {
      id: "quota_used",
      meta: { title: "Использовано", numeric: true },
      header: "Использовано",
      size: 190,
      enableSorting: false,
      cell: ({ row }) => (
        <UsageCell user={row.original} accessToken={accessToken} canEdit={canEdit} onQuotaChanged={onQuotaChanged} />
      ),
    },
    {
      id: "sso_user_id",
      accessorKey: "sso_user_id",
      meta: { title: "SSO ID" },
      header: () => (
        <span className="flex items-center gap-1.5">
          SSO ID
          <CellTooltip
            content={SSO_ID_HINT}
            trigger={<Info className="size-3.5 shrink-0 text-muted-foreground" aria-label="О SSO ID" />}
          />
        </span>
      ),
      size: 160,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block max-w-40 truncate font-mono text-xs" title={row.original.sso_user_id ?? undefined}>
          {row.original.sso_user_id ?? "-"}
        </span>
      ),
    },
    {
      id: "key_count",
      accessorKey: "key_count",
      meta: { title: "Виртуальные ключи", skeleton: "badge" },
      header: "Виртуальные ключи",
      size: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const keyCount = row.original.key_count;
        if (keyCount > 0) {
          return (
            <Badge
              variant="outline"
              className="whitespace-nowrap border-indigo-200 bg-indigo-50 font-normal text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
            >
              {keyCount} {keyCount === 1 ? "ключ" : "ключей"}
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="whitespace-nowrap border-border bg-muted font-normal text-muted-foreground"
          >
            Нет ключей
          </Badge>
        );
      },
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      meta: { title: "Создан" },
      header: ({ column }) => <DataTableSortHeader column={column} title="Создан" variant="header-cycle" />,
      size: 130,
      enableSorting: true,
      cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
    },
    {
      id: "updated_at",
      accessorKey: "updated_at",
      meta: { title: "Обновлён" },
      header: "Обновлён",
      size: 130,
      enableSorting: false,
      cell: ({ row }) => <DateCell value={row.original.updated_at} precision="date" />,
    },
    {
      id: "actions",
      meta: { title: "Действия", className: "text-right", headerClassName: "text-right" },
      header: () => <span className="sr-only">Действия</span>,
      size: 60,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <UserRowActions
            user={row.original}
            onUserClick={onUserClick}
            onDeleteUser={onDeleteUser}
            onResetPassword={onResetPassword}
          />
        </div>
      ),
    },
  ];

  if (!includeSelection) {
    return baseColumns;
  }

  return [
    createSelectionColumn<UserInfo>({
      rowAriaLabel: (row) => `Select ${row.original.user_email || row.original.user_id}`,
    }),
    ...baseColumns,
  ];
};
