import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { toast } from "sonner";

export function Signup() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }
      
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP");
      }
      
      toast.success("Account request submitted. Pending admin approval.");
      navigate("/auth/login");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Verify Email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input 
                id="otp" 
                type="text" 
                placeholder="123456" 
                required 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="pt-4 flex gap-2">
              <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Request Access</CardTitle>
        <CardDescription>
          Submit a request for an employee account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" required placeholder="Jane" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" required placeholder="Doe" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@company.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" placeholder="e.g. Finance, HR" required />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Request Access"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-100 pt-6">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-slate-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
