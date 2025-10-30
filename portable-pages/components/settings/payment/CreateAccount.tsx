import { ArrowLeft } from "lucide-react";
import { Button } from "../../ui/button";

interface CreateAccountProps {
  onBack: () => void;
  onConnect: (email: string) => void;
}

const CreateAccount = ({ onBack, onConnect }: CreateAccountProps) => {
  const handleOpenStripe = () => {
    window.open("https://dashboard.stripe.com/register", "_blank");
  };
  const handleCompleted = () => {
    onConnect("demo@example.com");
  };
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="max-w-2xl rounded-xl border border-border bg-card p-8">
        <div className="space-y-3">
          <Button onClick={handleOpenStripe} variant="outline" className="w-full" size="lg">
            Open Stripe Registration
          </Button>
          <Button onClick={handleCompleted} className="w-full" size="lg">
            Registration Completed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;


