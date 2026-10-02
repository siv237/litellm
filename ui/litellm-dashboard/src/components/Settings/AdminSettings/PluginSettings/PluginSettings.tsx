"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { getConfigFieldSetting, updateConfigFieldSetting } from "@/components/networking";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";
import { pluginSchema, type PluginFormValues } from "./schema";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const INLINE_CODE_CLASS = "rounded-sm bg-muted px-1 py-0.5 font-mono text-xs";

interface Plugin {
  name: string;
  display_name: string;
  url: string;
  plugin_key?: string;
}

const BLANK_PLUGIN: PluginFormValues = { name: "", display_name: "", url: "", plugin_key: undefined };

export default function PluginSettings() {
  const { accessToken } = useAuthorized();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const form = useZodForm(pluginSchema, { defaultValues: BLANK_PLUGIN });

  useEffect(() => {
    if (!accessToken) return;
    getConfigFieldSetting(accessToken, "plugins")
      .then((data) => {
        const val = data?.field_value;
        setPlugins(Array.isArray(val) ? val : []);
      })
      .catch(() => setPlugins([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const save = async (updated: Plugin[]) => {
    if (!accessToken) return;
    setSaving(true);
    try {
      await updateConfigFieldSetting(accessToken, "plugins", updated);
      setPlugins(updated);
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditingIndex(null);
    setKeyVisible(false);
    form.reset(BLANK_PLUGIN);
    setModalOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditingIndex(idx);
    setKeyVisible(false);
    // plugin_key arrives redacted ("***"); start it blank so an untouched save
    // keeps the stored credential instead of overwriting it with the placeholder.
    form.reset({ ...plugins[idx], plugin_key: "" });
    setModalOpen(true);
  };

  const handleDelete = (idx: number) => {
    const updated = plugins.filter((_, i) => i !== idx);
    save(updated);
  };

  const handleOk = async (values: PluginFormValues) => {
    const updated =
      editingIndex !== null ? plugins.map((p, i) => (i === editingIndex ? values : p)) : [...plugins, values];
    await save(updated);
    setModalOpen(false);
  };

  const renderRows = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="py-6 text-center">
            <UiLoadingSpinner className="mx-auto size-6 text-muted-foreground" />
          </TableCell>
        </TableRow>
      );
    }

    if (plugins.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
            Нет данных
          </TableCell>
        </TableRow>
      );
    }

    return plugins.map((plugin, idx) => (
      <TableRow key={plugin.name}>
        <TableCell>
          <code className={INLINE_CODE_CLASS}>{plugin.name}</code>
        </TableCell>
        <TableCell>{plugin.display_name}</TableCell>
        <TableCell>
          <a href={plugin.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {plugin.url}
          </a>
        </TableCell>
        <TableCell>
          {plugin.plugin_key ? (
            <code className={INLINE_CODE_CLASS}>{"•".repeat(8)}</code>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" aria-label={`Edit ${plugin.name}`} onClick={() => openEdit(idx)}>
              <Pencil />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              aria-label={`Delete ${plugin.name}`}
              onClick={() => handleDelete(idx)}
            >
              <Trash2 />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <h4 className="text-base font-semibold text-foreground">Плагины</h4>
        <p className="text-sm text-foreground">
          Зарегистрируйте внешние сервисы как плагины. После добавления пользователи смогут переключаться на плагин в переключателе режимов в левом верхнем углу панели.
        </p>
        <p className="text-xs text-muted-foreground">
          Каждый плагин должен предоставлять <code className={INLINE_CODE_CLASS}>GET /api/plugin-manifest</code> , возвращая пункты навигации и возможности.
        </p>
      </CardHeader>
      <CardContent>
        <Button className="mb-4" onClick={openAdd}>
          <Plus />
          Добавить плагин
        </Button>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Отображаемое название</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Ключ плагина</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderRows()}</TableBody>
        </Table>
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && setModalOpen(false)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Plugin" : "Add Plugin"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => event.preventDefault()} noValidate style={{ marginTop: 16 }}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="name"
                label="Имя (идентификатор)"
                description="Используется в URL и конфиге. Без пробелов. Напр. litellm-platform-plugin"
              >
                {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="litellm-platform-plugin" />}
              </FormField>
              <FormField control={form.control} name="display_name" label="Отображаемое название">
                {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="Плоскость управления агентами" />}
              </FormField>
              <FormField control={form.control} name="url" label="URL" description="Базовый URL сервиса плагина">
                {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="https://your-plugin.example.com" />}
              </FormField>
              <FormField
                control={form.control}
                name="plugin_key"
                label="Ключ плагина"
                description="Optional. The plugin's own credential, injected as Authorization: Bearer <key> только когда ruLiteLLM реверс-проксирует вызовы API в бэкенд плагина (/plugin-proxy/<name>/*). Leave blank for plugins that use the forwarded litellm user token (e.g. iframe plugins) — that path uses the user's token, not this key."
              >
                {({ ref, ...field }) => (
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      ref={ref}
                      type={keyVisible ? "text" : "password"}
                      value={field.value ?? ""}
                      placeholder={editingIndex !== null ? "Leave blank to keep current key" : "sk-... (optional)"}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        onClick={() => setKeyVisible(!keyVisible)}
                        aria-label={keyVisible ? "Hide plugin key" : "Show plugin key"}
                      >
                        {keyVisible ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                )}
              </FormField>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={form.handleSubmit(handleOk)} disabled={saving} aria-busy={saving}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
