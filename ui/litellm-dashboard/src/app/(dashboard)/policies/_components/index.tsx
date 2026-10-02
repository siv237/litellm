import React, { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle, AlertAction } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from "@/lib/toast";
import { Info, TriangleAlert, X } from "lucide-react";
import { isAdminRole } from "@/utils/roles";
import PolicyTable from "./PolicyTable";
import PolicyInfoView from "./policy_info";
import AddPolicyForm from "./add_policy_form";
import { FlowBuilderPage } from "./pipeline_flow_builder";
import AttachmentTable from "./AttachmentTable";
import AddAttachmentForm from "./add_attachment_form";
import PolicyTestPanel from "./policy_test_panel";
import PolicyTemplates from "./policy_templates";
import GuardrailSelectionModal from "./guardrail_selection_modal";
import TemplateParameterModal from "./template_parameter_modal";
import AiSuggestionModal from "./ai_suggestion_modal";
import { useDeletePolicyAttachment } from "@/hooks/policies/useDeletePolicyAttachment";
import {
  getPoliciesList,
  deletePolicyCall,
  getPolicyAttachmentsList,
  getGuardrailsList,
  getPolicyInfo,
  createPolicyCall,
  updatePolicyCall,
  createPolicyAttachmentCall,
  createGuardrailCall,
  enrichPolicyTemplate,
} from "@/components/networking";
import { Policy, PolicyAttachment } from "@/components/policies/types";
import { Guardrail } from "@/components/guardrails/types";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";

interface DismissibleAlertProps {
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

const DismissibleAlert: React.FC<DismissibleAlertProps> = ({ title, icon, children }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <Alert className="mb-6">
      {icon}
      <AlertTitle>{title}</AlertTitle>
      {children && <AlertDescription>{children}</AlertDescription>}
      <AlertAction>
        <Button variant="ghost" size="icon-sm" onClick={() => setIsDismissed(true)} aria-label={`Dismiss ${title}`}>
          <X />
        </Button>
      </AlertAction>
    </Alert>
  );
};

const AboutPoliciesAlert = () => (
  <DismissibleAlert title="О политиках" icon={<Info />}>
    <p className="mb-3">
      Политики группируют гардрейлы и позволяют управлять тем, какие из них применяются для конкретных команд, ключей или моделей.
    </p>
    <p className="mb-2 font-semibold">Зачем нужны политики?</p>
    <ul className="mb-3 ml-2 list-inside list-disc space-y-1">
      <li>Включение/отключение конкретных гардрейлов для команд, ключей или моделей</li>
      <li>Группировка гардрейлов в одну политику</li>
      <li>Наследование от существующих политик с переопределением нужных настроек</li>
    </ul>
    <a
      href="https://docs.litellm.ai/docs/proxy/guardrails/guardrail_policies"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-block text-primary underline underline-offset-4"
    >
      Подробнее в документации -&gt;
    </a>
  </DismissibleAlert>
);

interface PoliciesPanelProps {
  accessToken: string | null;
  userRole?: string;
}

const PoliciesPanel: React.FC<PoliciesPanelProps> = ({ accessToken, userRole }) => {
  const [policiesList, setPoliciesList] = useState<Policy[]>([]);
  const [attachmentsList, setAttachmentsList] = useState<PolicyAttachment[]>([]);
  const [guardrailsList, setGuardrailsList] = useState<Guardrail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
  const [isAddPolicyModalVisible, setIsAddPolicyModalVisible] = useState(false);
  const [isAddAttachmentModalVisible, setIsAddAttachmentModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("templates");
  const [isDeleting, setIsDeleting] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<PolicyAttachment | null>(null);
  const [isDeleteAttachmentModalOpen, setIsDeleteAttachmentModalOpen] = useState(false);
  const [isGuardrailSelectionModalOpen, setIsGuardrailSelectionModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [existingGuardrailNames, setExistingGuardrailNames] = useState<Set<string>>(new Set());
  const [isCreatingGuardrails, setIsCreatingGuardrails] = useState(false);
  const [showFlowBuilder, setShowFlowBuilder] = useState(false);
  const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);
  const [isEnrichingTemplate, setIsEnrichingTemplate] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<any>(null);
  const [isAiSuggestionModalOpen, setIsAiSuggestionModalOpen] = useState(false);
  const [loadedTemplates, setLoadedTemplates] = useState<any[]>([]);
  const [templateQueue, setTemplateQueue] = useState<any[]>([]);
  const [templateQueueProgress, setTemplateQueueProgress] = useState<{ current: number; total: number } | null>(null);

  const isAdmin = userRole ? isAdminRole(userRole) : false;

  const fetchPolicies = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const response = await getPoliciesList(accessToken);
      setPoliciesList(response.policies || []);
    } catch (error) {
      console.error("Error fetching policies:", error);
      toast.error("Не удалось загрузить политики");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const fetchAttachments = useCallback(async () => {
    if (!accessToken) return;

    setIsAttachmentsLoading(true);
    try {
      const response = await getPolicyAttachmentsList(accessToken);
      setAttachmentsList(response.attachments || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      toast.error("Не удалось загрузить привязки");
    } finally {
      setIsAttachmentsLoading(false);
    }
  }, [accessToken]);

  const fetchGuardrails = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await getGuardrailsList(accessToken);
      setGuardrailsList(response.guardrails || []);
    } catch (error) {
      console.error("Error fetching guardrails:", error);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchPolicies();
    fetchAttachments();
    fetchGuardrails();
  }, [fetchPolicies, fetchAttachments, fetchGuardrails]);

  const handleAddPolicy = () => {
    if (selectedPolicyId) {
      setSelectedPolicyId(null);
    }
    setEditingPolicy(null);
    setIsAddPolicyModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddPolicyModalVisible(false);
    setEditingPolicy(null);
  };

  const handleSuccess = () => {
    fetchPolicies();
    setEditingPolicy(null);
  };

  const handleDeleteClick = (policyId: string, policyName: string) => {
    const policy = policiesList.find((p) => p.policy_id === policyId) || null;
    setPolicyToDelete(policy);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!policyToDelete || !accessToken) return;

    setIsDeleting(true);
    try {
      await deletePolicyCall(accessToken, policyToDelete.policy_id);
      toast.success(`Политика «${policyToDelete.policy_name}» удалена`);
      await fetchPolicies();
    } catch (error) {
      console.error("Error deleting policy:", error);
      toast.error("Не удалось удалить политику");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setPolicyToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setPolicyToDelete(null);
  };

  const deleteAttachmentMutation = useDeletePolicyAttachment({
    accessToken,
    onSuccess: fetchAttachments,
  });

  const handleDeleteAttachmentClick = (attachmentId: string) => {
    const attachment = attachmentsList.find((a) => a.attachment_id === attachmentId) || null;
    setAttachmentToDelete(attachment);
    setIsDeleteAttachmentModalOpen(true);
  };

  const handleAttachmentDeleteCancel = () => {
    setIsDeleteAttachmentModalOpen(false);
    setAttachmentToDelete(null);
  };

  const handleAttachmentDeleteConfirm = () => {
    if (!attachmentToDelete) return;
    deleteAttachmentMutation.mutate(attachmentToDelete.attachment_id, {
      onSettled: () => {
        setIsDeleteAttachmentModalOpen(false);
        setAttachmentToDelete(null);
      },
    });
  };

  const handleAttachmentSuccess = () => {
    fetchAttachments();
  };

  const handleUseTemplate = async (template: any) => {
    if (!accessToken) {
      toast.error("Требуется авторизация");
      return;
    }

    // If template has parameters, show parameter modal first
    if (template.parameters && template.parameters.length > 0) {
      setPendingTemplate(template);
      setIsParameterModalOpen(true);
      return;
    }

    await proceedWithTemplate(template);
  };

  const proceedWithTemplate = async (template: any) => {
    if (!accessToken) return;

    try {
      const existingGuardrailsResponse = await getGuardrailsList(accessToken);
      const existingNames = new Set<string>(
        existingGuardrailsResponse.guardrails?.map((g: any) => g.guardrail_name as string) || [],
      );

      setExistingGuardrailNames(existingNames);
      setSelectedTemplate(template);
      setIsGuardrailSelectionModalOpen(true);
    } catch (error) {
      console.error("Error fetching guardrails:", error);
      toast.error("Не удалось загрузить гардрейлы. Повторите попытку.");
    }
  };

  const substituteParameters = (template: any, parameters: Record<string, string>): any => {
    let templateStr = JSON.stringify(template);
    for (const [key, value] of Object.entries(parameters)) {
      templateStr = templateStr.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return JSON.parse(templateStr);
  };

  const handleParameterConfirm = async (
    parameters: Record<string, string>,
    enrichmentOptions?: { model?: string; competitors?: string[] },
  ) => {
    if (!accessToken || !pendingTemplate) return;

    setIsEnrichingTemplate(true);

    try {
      let enrichedTemplate = pendingTemplate;

      if (pendingTemplate.llm_enrichment) {
        // Call backend to enrich template with LLM-discovered data (or user-provided competitors)
        const enrichResult = await enrichPolicyTemplate(
          accessToken,
          pendingTemplate.id,
          parameters,
          enrichmentOptions?.model,
          enrichmentOptions?.competitors,
        );
        // The backend returns the enriched guardrailDefinitions + discovered competitors
        enrichedTemplate = {
          ...pendingTemplate,
          guardrailDefinitions: enrichResult.guardrailDefinitions,
          discoveredCompetitors: enrichResult.competitors || [],
        };
      }

      // Substitute parameters in template
      enrichedTemplate = substituteParameters(enrichedTemplate, parameters);

      setIsParameterModalOpen(false);
      setIsEnrichingTemplate(false);
      setPendingTemplate(null);

      await proceedWithTemplate(enrichedTemplate);
    } catch (error) {
      console.error("Error enriching template:", error);
      toast.error("Не удалось настроить шаблон. Повторите попытку.");
      setIsEnrichingTemplate(false);
    }
  };

  const handleParameterCancel = () => {
    setIsParameterModalOpen(false);
    setPendingTemplate(null);
  };

  const handleGuardrailSelectionConfirm = async (selectedGuardrailDefinitions: any[]) => {
    if (!accessToken || !selectedTemplate) return;

    setIsCreatingGuardrails(true);

    try {
      const createdGuardrails: string[] = [];
      const failedGuardrails: string[] = [];

      // Create selected guardrails
      for (const guardrailDef of selectedGuardrailDefinitions) {
        const guardrailName = guardrailDef.guardrail_name;

        try {
          await createGuardrailCall(accessToken, guardrailDef);
          createdGuardrails.push(guardrailName);
        } catch (error) {
          console.error(`Failed to create guardrail "${guardrailName}":`, error);
          failedGuardrails.push(guardrailName);
        }
      }

      // Refresh guardrails list
      await fetchGuardrails();

      // Close modal
      setIsGuardrailSelectionModalOpen(false);
      setIsCreatingGuardrails(false);

      // Pre-fill the add policy form with template data
      setEditingPolicy(selectedTemplate.templateData as Policy);
      setIsAddPolicyModalVisible(true);
      setActiveTab("policies");

      // Show success message
      if (createdGuardrails.length > 0) {
        toast.success(
          `Создано гардрейлов: ${createdGuardrails.length}. Заполните форму политики, чтобы сохранить.`,
        );
      } else {
        toast.success("Шаблон готов. Заполните форму политики, чтобы сохранить.");
      }

      if (failedGuardrails.length > 0) {
        toast.warning(
          `Failed to create ${failedGuardrails.length} guardrail(s): ${failedGuardrails.join(", ")}. You may need to create them manually.`,
        );
      }

      // Process next template in queue if any
      if (templateQueue.length > 0) {
        const [nextTemplate, ...remaining] = templateQueue;
        setTemplateQueue(remaining);
        setTemplateQueueProgress((prev) => (prev ? { ...prev, current: prev.current + 1 } : null));
        // Small delay so user can see the success message
        setTimeout(() => handleUseTemplate(nextTemplate), 500);
      } else {
        setTemplateQueueProgress(null);
      }
    } catch (error) {
      setIsCreatingGuardrails(false);
      setTemplateQueue([]);
      setTemplateQueueProgress(null);
      console.error("Error creating guardrails:", error);
      toast.error("Не удалось создать гардрейлы. Повторите попытку.");
    }
  };

  const handleGuardrailSelectionCancel = () => {
    setIsGuardrailSelectionModalOpen(false);
    setSelectedTemplate(null);
    setTemplateQueue([]);
    setTemplateQueueProgress(null);
  };

  if (showFlowBuilder) {
    return (
      <FlowBuilderPage
        onBack={() => {
          setShowFlowBuilder(false);
          setEditingPolicy(null);
        }}
        onSuccess={() => {
          fetchPolicies();
          setEditingPolicy(null);
        }}
        accessToken={accessToken}
        editingPolicy={editingPolicy}
        availableGuardrails={guardrailsList}
        createPolicy={createPolicyCall}
        updatePolicy={updatePolicyCall}
        onVersionCreated={(newPolicy) => {
          setEditingPolicy(newPolicy);
          fetchPolicies();
        }}
        onSelectVersion={(policy) => {
          setEditingPolicy(policy);
        }}
        onVersionStatusUpdated={(updatedPolicy) => {
          setEditingPolicy(updatedPolicy);
          fetchPolicies();
        }}
      />
    );
  }

  return (
    <div className="m-8 mx-auto w-full flex-auto overflow-y-auto p-2">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="mb-4 h-auto w-full justify-start rounded-none border-b p-0">
          <TabsTrigger value="templates" className="flex-none rounded-none px-4 py-2">
            Шаблоны
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex-none rounded-none px-4 py-2">
            Политики
          </TabsTrigger>
          <TabsTrigger value="attachments" className="flex-none rounded-none px-4 py-2">
            Привязки
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex-none rounded-none px-4 py-2">
            Симулятор политик
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" keepMounted>
          <AboutPoliciesAlert />
          <PolicyTemplates
            onUseTemplate={handleUseTemplate}
            onOpenAiSuggestion={() => setIsAiSuggestionModalOpen(true)}
            onTemplatesLoaded={setLoadedTemplates}
            accessToken={accessToken}
          />
        </TabsContent>

        <TabsContent value="policies" keepMounted>
          <AboutPoliciesAlert />

          <div className="mb-4 flex items-center justify-between">
            <Button onClick={handleAddPolicy} disabled={!accessToken}>
              + Создать политику
            </Button>
          </div>

          {selectedPolicyId ? (
            <PolicyInfoView
              policyId={selectedPolicyId}
              onClose={() => setSelectedPolicyId(null)}
              onEdit={(policy) => {
                setEditingPolicy(policy);
                setSelectedPolicyId(null);
                setShowFlowBuilder(true);
              }}
              accessToken={accessToken}
              isAdmin={isAdmin}
              getPolicy={getPolicyInfo}
            />
          ) : (
            <PolicyTable
              policies={policiesList}
              isLoading={isLoading}
              onDeleteClick={handleDeleteClick}
              onEditClick={(policy) => {
                setEditingPolicy(policy);
                setShowFlowBuilder(true);
              }}
              onViewClick={(policyId) => setSelectedPolicyId(policyId)}
              isAdmin={isAdmin}
            />
          )}

          <AddPolicyForm
            visible={isAddPolicyModalVisible}
            onClose={handleCloseModal}
            onSuccess={handleSuccess}
            onOpenFlowBuilder={() => {
              setIsAddPolicyModalVisible(false);
              setShowFlowBuilder(true);
            }}
            accessToken={accessToken}
            editingPolicy={editingPolicy}
            existingPolicies={policiesList}
            availableGuardrails={guardrailsList}
            createPolicy={createPolicyCall}
            updatePolicy={updatePolicyCall}
          />

          <DeleteResourceModal
            isOpen={isDeleteModalOpen}
            title="Удалить политику"
            message={`Are you sure you want to delete policy: ${policyToDelete?.policy_name}? This action cannot be undone.`}
            resourceInformationTitle="Policy Information"
            resourceInformation={[
              { label: "Название", value: policyToDelete?.policy_name },
              { label: "ID", value: policyToDelete?.policy_id, code: true },
              { label: "Описание", value: policyToDelete?.description || "-" },
              { label: "Наследует от", value: policyToDelete?.inherit || "-" },
            ]}
            onCancel={handleDeleteCancel}
            onOk={handleDeleteConfirm}
            confirmLoading={isDeleting}
          />
        </TabsContent>

        <TabsContent value="attachments" keepMounted>
          <DismissibleAlert title="О привязках политик" icon={<Info />}>
            <p className="mb-3">
              Привязки определяют, где применяются политики. Пока политика не привязана к конкретным командам,
              ключам, моделям, тегам или не сделана глобальной, она ничего не делает.
            </p>
            <p className="mb-2 font-semibold">Области привязки:</p>
            <ul className="mb-3 ml-2 list-inside list-disc space-y-1">
              <li>
                <strong>Глобально (*)</strong> — применяется ко всем запросам
              </li>
              <li>
                <strong>Команды</strong> — применяется только к выбранным командам
              </li>
              <li>
                <strong>Ключи</strong> — применяется только к определённым API-ключам (поддерживаются маски вида dev-*)
              </li>
              <li>
                <strong>Модели</strong> — применяется только при использовании определённых моделей
              </li>
              <li>
                <strong>Теги</strong> — совпадение с тегами из key/team <code>metadata.tags</code> или тегами,
                передаваемыми динамически в теле запроса (<code>metadata.tags</code>). Используйте, чтобы применять
                политики к группам, например «все ключи с тегом <code>healthcare</code> получают HIPAA-гардрейлы».
                Поддерживаются маски (<code>prod-*</code>).
              </li>
            </ul>
            <a
              href="https://docs.litellm.ai/docs/proxy/guardrails/guardrail_policies#attachments"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-primary underline underline-offset-4"
            >
              Подробнее о привязках -&gt;
            </a>
          </DismissibleAlert>

          <DismissibleAlert title="Функция Enterprise" icon={<TriangleAlert />}>
            Часть функциональности привязок политик будет доступна в ruLiteLLM Enterprise в будущих версиях.
          </DismissibleAlert>

          <div className="mb-4 flex items-center justify-between">
            <Button
              onClick={() => setIsAddAttachmentModalVisible(true)}
              disabled={!accessToken || policiesList.length === 0}
            >
              + Создать привязку
            </Button>
          </div>

          <AttachmentTable
            attachments={attachmentsList}
            isLoading={isAttachmentsLoading}
            onDeleteClick={handleDeleteAttachmentClick}
            isAdmin={isAdmin}
            accessToken={accessToken}
          />

          <AddAttachmentForm
            visible={isAddAttachmentModalVisible}
            onClose={() => setIsAddAttachmentModalVisible(false)}
            onSuccess={handleAttachmentSuccess}
            accessToken={accessToken}
            policies={policiesList}
            createAttachment={createPolicyAttachmentCall}
          />
        </TabsContent>

        <TabsContent value="simulator" keepMounted>
          <PolicyTestPanel accessToken={accessToken} />
        </TabsContent>
      </Tabs>

      <DeleteResourceModal
        isOpen={isDeleteAttachmentModalOpen}
        title="Удалить привязку"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        resourceInformationTitle="Attachment Information"
        resourceInformation={[
          { label: "ID привязки", value: attachmentToDelete?.attachment_id, code: true },
          { label: "Политика", value: attachmentToDelete?.policy_name ?? "-" },
          { label: "Область", value: attachmentToDelete?.scope ?? "-" },
        ]}
        onCancel={handleAttachmentDeleteCancel}
        onOk={handleAttachmentDeleteConfirm}
        confirmLoading={deleteAttachmentMutation.isPending}
      />

      <GuardrailSelectionModal
        visible={isGuardrailSelectionModalOpen}
        template={selectedTemplate}
        existingGuardrails={existingGuardrailNames}
        onConfirm={handleGuardrailSelectionConfirm}
        onCancel={handleGuardrailSelectionCancel}
        isLoading={isCreatingGuardrails}
        progressInfo={templateQueueProgress}
      />

      <TemplateParameterModal
        visible={isParameterModalOpen}
        template={pendingTemplate}
        onConfirm={handleParameterConfirm}
        onCancel={handleParameterCancel}
        isLoading={isEnrichingTemplate}
        accessToken={accessToken || ""}
      />

      <AiSuggestionModal
        visible={isAiSuggestionModalOpen}
        onSelectTemplates={(selectedTemplates) => {
          setIsAiSuggestionModalOpen(false);
          if (selectedTemplates.length > 0) {
            // Queue all templates: process first immediately, queue the rest
            const [first, ...rest] = selectedTemplates;
            setTemplateQueue(rest);
            setTemplateQueueProgress(
              selectedTemplates.length > 1 ? { current: 1, total: selectedTemplates.length } : null,
            );
            handleUseTemplate(first);
          }
        }}
        onCancel={() => setIsAiSuggestionModalOpen(false)}
        accessToken={accessToken}
        allTemplates={loadedTemplates}
      />
    </div>
  );
};

export default PoliciesPanel;
