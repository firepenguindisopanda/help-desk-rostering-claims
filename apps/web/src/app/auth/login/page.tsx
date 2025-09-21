"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { routes } from "@/lib/routes";

import { Banner } from "@/components/ui/banner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bannerState, setBannerState] = useState<{
    show: boolean;
    variant: 'pending' | 'rejected' | 'approved' | 'error';
    message: string;
    details?: any;
  } | null>(null);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBannerState(null);
    setLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        // Redirect based on user role (this will be handled by the auth provider)
        router.push(routes.root);
      } else {
        // Handle different error codes based on registration state
        const errorCode = result.errorCode;
        
        switch (errorCode) {
          case 'REG_PENDING':
            setBannerState({
              show: true,
              variant: 'pending',
              message: 'Your registration is pending review. You\'ll be notified once approved.',
              details: result.errorDetails
            });
            break;
            
          case 'REG_REJECTED':
            setBannerState({
              show: true,
              variant: 'rejected',
              message: 'Your registration was rejected.',
              details: result.errorDetails
            });
            break;
            
          case 'REG_APPROVED_NOT_PROVISIONED':
            setBannerState({
              show: true,
              variant: 'approved',
              message: 'Approved, provisioning in progress. Please try again shortly.',
              details: result.errorDetails
            });
            break;
            
          case 'INVALID_CREDENTIALS':
          default:
            // For invalid credentials or unknown errors, show inline error
            setError(result.error || "Invalid username or password");
            break;
        }
      }
    } catch (err) {
      console.error("Login submit error", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 min-h-screen">
      {/* Left column: title + image */}
      <div className="bg-[#0066cc] text-white p-8 flex flex-col justify-start relative">
        <Image
          src="/images/UwiFrontPage.jpg"
          alt="UWI Campus"
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Help Desk Rostering System</h1>
          <p className="text-xl md:text-2xl opacity-90 mb-3">
            University of the West Indies
          </p>
          <p className="text-base md:text-lg opacity-75 mt-2">
            Manage your schedule and availability with ease
          </p>
        </div>
      </div>
      
      {/* Right column: form */}
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-xl shadow-lg w-full max-w-md space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center mb-2">Welcome Back</h2>
          <p className="text-slate-600 text-center text-base mb-6">Sign in to access your dashboard</p>
          
          {bannerState?.show && (
            <Banner
              variant={bannerState.variant}
              message={bannerState.message}
              onClose={() => setBannerState(null)}
            >
              {bannerState.variant === 'rejected' && (
                <div className="space-y-2">
                  <p>Contact support if you think this is a mistake.</p>
                  <Link 
                    href={routes.auth.register} 
                    className="inline-block font-medium hover:underline"
                  >
                    Resubmit registration →
                  </Link>
                </div>
              )}
              {bannerState.variant === 'pending' && bannerState.details?.requested_at && (
                <p className="text-sm opacity-75">
                  Requested: {new Date(bannerState.details.requested_at).toLocaleDateString()}
                </p>
              )}
            </Banner>
          )}
          
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          
          <div>
            <Label className="block text-slate-700 mb-2 text-base font-medium">ID Number</Label>
            <Input
              type="text"
              className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-[#0066cc] focus:border-transparent"
              placeholder="Enter your ID number"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <Label className="block text-slate-700 mb-2 text-base font-medium">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                className="w-full border rounded-lg px-4 py-3 pr-12 text-base focus:ring-2 focus:ring-[#0066cc] focus:border-transparent"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit"
            className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-lg py-3 text-base font-semibold transition-colors"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-b-transparent" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
          
          <div className="text-center text-base text-slate-600 mt-6">
            Don&apos;t have an account?{" "}
            <Link 
              href={routes.auth.register} 
              className="font-semibold text-[#0066cc] hover:underline transition-colors"
            >
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}