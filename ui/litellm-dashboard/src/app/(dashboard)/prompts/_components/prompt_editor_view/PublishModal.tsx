import React from "react";
import { LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface PublishModalProps {
  visible: boolean;
  promptName: string;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onPublish: () => void;
  onCancel: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({
  visible,
  promptName,
  isSaving,
  onNameChange,
  onPublish,
  onCancel,
}) => {
  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Опубликовать промпт</DialogTitle>
          <DialogDescription>Опубликованные промпты версионируются и доступны в вызовах API.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="publish-prompt-name" className="mb-2 block">
            Название
          </label>
          <Input
            id="publish-prompt-name"
            value={promptName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Введите имя промпта"
            onKeyDown={(event) => event.key === "Enter" && onPublish()}
            autoFocus
          />
          <p className="text-muted-foreground text-xs mt-2">
            Опубликованные промпты доступны в вызовах API и версионируются для удобного отслеживания.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={onPublish} disabled={isSaving}>
            {isSaving && <LoaderCircleIcon className="animate-spin" />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishModal;
