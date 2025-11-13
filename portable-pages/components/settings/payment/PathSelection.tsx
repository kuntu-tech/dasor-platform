import { CheckCircle2, PlusCircle } from "lucide-react";

interface PathSelectionProps {
  onSelect: (hasAccount: boolean) => void;
}

const PathSelection = ({ onSelect }: PathSelectionProps) => {
  return (
    <div>
      <div className="mb-6">
        <div className="grid gap-8 md:grid-cols-2">
          <button
            onClick={() => onSelect(true)}
            className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 text-left transition-all hover:scale-[1.02] hover:border-primary hover:shadow-lg active:scale-[0.98]"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold"> I have a Stripe account</h4>
            </div>
          </button>

          <button
            onClick={() => onSelect(false)}
            className="group relative overflow-hidden rounded-xl border-2 border-border bg-card p-6 text-left transition-all hover:scale-[1.02] hover:border-primary hover:shadow-lg active:scale-[0.98]"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-lg font-semibold">I need to create</h4>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PathSelection;


