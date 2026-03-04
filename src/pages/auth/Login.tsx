import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { toast } from "sonner";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
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
      
      localStorage.setItem("docshield_token", data.token);
      localStorage.setItem("docshield_user", JSON.stringify(data.user));
      
      toast.success("Logged in successfully");
      const route = data.user.role === 'admin' ? 'admin' : 'employee';
      navigate(`/${route}`);
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
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
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
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access the secure portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="#" className="text-sm text-slate-500 hover:text-slate-900">
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role (Demo purposes)</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-100 pt-6">
        <p className="text-sm text-slate-500">
          Don't have an account?{" "}
          <Link to="/auth/signup" className="text-slate-900 font-medium hover:underline">
            Request access
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
