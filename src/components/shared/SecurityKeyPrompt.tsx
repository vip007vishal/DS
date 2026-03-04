import React, { useState } from "react";
import { ShieldAlert, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";
import { MOCK_ACCESS_KEY } from "@/src/lib/mock-data";

interface SecurityKeyPromptProps {
  onUnlock: () => void;
  title: string;
  description: string;
}

export function SecurityKeyPrompt({ onUnlock, title, description }: SecurityKeyPromptProps) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate verification delay
    setTimeout(() => {
      setLoading(false);
      if (key === MOCK_ACCESS_KEY) {
        toast.success("Access granted");
        onUnlock();
      } else {
        toast.error("Invalid security key");
        setKey("");
      }
    }, 800);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-2 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <Input 
                type="password" 
                placeholder="Enter security key (hint: SECURE-123)" 
                className="pl-10 h-12 text-lg"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base gap-2" disabled={loading || !key}>
              {loading ? "Verifying..." : "Unlock Dashboard"}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500 text-center">
            This area contains highly sensitive information. <br/>
            All access attempts are logged.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
