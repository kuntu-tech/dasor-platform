import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";

interface DisconnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const DisconnectModal = ({ open, onOpenChange, onConfirm }: DisconnectModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle>Disconnect Payment Account?</DialogTitle>
          <DialogDescription>
            You will stop receiving payments for your ChatAPP until a new account is connected. Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" className="text-white" onClick={handleConfirm}>
            Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisconnectModal;


