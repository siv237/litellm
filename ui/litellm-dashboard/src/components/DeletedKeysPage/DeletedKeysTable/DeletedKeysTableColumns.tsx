"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, IdentityCell, MoneyCell } from "@/components/shared/table_cells";
import { DeletedKeyResponse } from "@/app/(dashboard)/hooks/keys/useKeys";
import { userDetailHref } from "@/utils/entityLinks";

function TruncatedTextCell({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="block max-w-60 truncate" title={value}>
      {value}
    </span>
  );
}

function UserLinkCell({ userId }: { userId: string | null | undefined }) {
  if (!userId) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="block max-w-60" title={userId}>
      <IdentityCell title={userId} titleClassName="font-normal" href={userDetailHref(userId)} />
    </span>
  );
}

export const getDeletedKeysTableColumns = (): ColumnDef<DeletedKeyResponse>[] => [
  {
    id: "token",
    accessorKey: "token",
    meta: { title: "ID ключа" },
    header: "ID ключа",
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.token} variant="plain" />,
  },
  {
    id: "key_alias",
    accessorKey: "key_alias",
    meta: { title: "Псевдоним ключа" },
    header: "Псевдоним ключа",
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const value = row.original.key_alias;
      if (!value) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className="block max-w-60 truncate font-mono text-xs" title={value}>
          {value}
        </span>
      );
    },
  },
  {
    id: "team_alias",
    accessorKey: "team_alias",
    meta: { title: "Псевдоним команды" },
    header: "Псевдоним команды",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <TruncatedTextCell value={row.original.team_alias} />,
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: { title: "Расход (USD)", numeric: true },
    header: ({ column }) => <DataTableSortHeader column={column} title="Расход (USD)" />,
    size: 100,
    enableSorting: true,
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    id: "max_budget",
    accessorKey: "max_budget",
    meta: { title: "Бюджет (USD)", numeric: true },
    header: "Бюджет (USD)",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.max_budget} decimals={0} emptyText="Без ограничений" showZero />,
  },
  {
    id: "user_email",
    accessorKey: "user_email",
    meta: { title: "E-mail пользователя" },
    header: "E-mail пользователя",
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <TruncatedTextCell value={row.original.user_email} />,
  },
  {
    id: "user_id",
    accessorKey: "user_id",
    meta: { title: "ID пользователя" },
    header: "ID пользователя",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <UserLinkCell userId={row.original.user_id} />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: { title: "Создан" },
    header: ({ column }) => <DataTableSortHeader column={column} title="Создан" />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "created_by",
    accessorKey: "created_by",
    meta: { title: "Автор" },
    header: "Автор",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <UserLinkCell userId={row.original.created_by} />,
  },
  {
    id: "deleted_at",
    accessorKey: "deleted_at",
    meta: { title: "Удалён" },
    header: ({ column }) => <DataTableSortHeader column={column} title="Удалён" />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.deleted_at} precision="date" />,
  },
  {
    id: "deleted_by",
    accessorKey: "deleted_by",
    meta: { title: "Удалил" },
    header: "Удалил",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <UserLinkCell userId={row.original.deleted_by} />,
  },
];
