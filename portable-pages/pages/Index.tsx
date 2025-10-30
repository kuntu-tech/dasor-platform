import { Button } from "../components/ui/button";
import { Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import Settings from "../components/settings/Settings";

const Index = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Payment Settings Demo</h1>
        <p className="mb-8 text-xl text-muted-foreground">A comprehensive payment account setup flow</p>
        <Button onClick={() => setSettingsOpen(true)} size="lg" className="gap-2">
          <SettingsIcon className="h-5 w-5" />
          Open Settings
        </Button>
      </div>
      <Settings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;


