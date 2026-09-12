import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HelpRequestForm } from "./help-request-form";

export function HelpRequestDialog({
  trigger,
  defaultWay,
  needId,
  needTitle,
  lockWay,
}: {
  trigger: ReactNode;
  defaultWay?: string;
  needId?: string;
  needTitle?: string;
  lockWay?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Могу помочь</DialogTitle>
          <DialogDescription>
            Оставьте контакты — координатор свяжется и подскажет, что нужно прямо сейчас.
          </DialogDescription>
        </DialogHeader>
        <HelpRequestForm
          {...(defaultWay ? { defaultWay } : {})}
          {...(needId ? { needId } : {})}
          {...(needTitle ? { needTitle } : {})}
          {...(lockWay ? { lockWay } : {})}
        />
      </DialogContent>
    </Dialog>
  );
}
