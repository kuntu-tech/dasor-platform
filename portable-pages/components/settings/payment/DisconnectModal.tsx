import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";

interface DisconnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const DisconnectModal = ({ open, onOpenChange, onConfirm, isLoading = false, error }: DisconnectModalProps) => {
  const handleConfirm = async () => {
    await onConfirm();
    // Don't close modal here - let the parent component handle it after success
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // 只有在非加载状态且用户主动关闭时才允许关闭
        if (!isLoading && !newOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent
        onInteractOutside={(e) => {
          // 加载中时阻止点击外部关闭
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // 加载中时阻止 ESC 关闭
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle>Disconnect Payout Account?</DialogTitle>
          <DialogDescription>
          Are you sure you want to disconnect your Stripe receiving account? This will revoke access to your Stripe receiving account. You can reconnect the same account later if needed.      
           </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            className="text-white" 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Disconnecting...
              </>
            ) : (
              "Disconnect"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisconnectModal;


