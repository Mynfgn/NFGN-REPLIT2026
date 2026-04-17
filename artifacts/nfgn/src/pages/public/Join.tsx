import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, useListProducts } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Users, TrendingUp, Loader2 } from "lucide-react";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  referralCode: z.string().min(1, "A sponsor referral code is required to join NFGN"),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function Join() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const { data: productsData } = useListProducts({ isProPackage: true });

  const proPackage = productsData?.products?.find((p: any) => p.isProPackage);

  const searchParams = new URLSearchParams(window.location.search);
  const refCode = searchParams.get("ref") ?? "";

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "", phone: "", referralCode: refCode },
  });

  function onSubmit(data: RegisterFormValues) {
    registerMutation.mutate({ data: { ...data, role: "customer" } }, {
      onSuccess: (response) => {
        login(response.token);
        toast({ title: "Welcome to NFGN!", description: "Your account has been created." });
        if (response.user.role === "customer") setLocation("/");
        else setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Registration failed", description: error.message || "Please try again." });
      },
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-foreground text-background py-20 px-4 text-center">
        <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-4 block">Join The Family</span>
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Start Your Wellness Journey</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          Join thousands of wellness entrepreneurs building health and wealth with NFGN.
        </p>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Registration Form */}
          <div>
            <h2 className="text-2xl font-serif font-bold mb-6">Create Your Account</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input placeholder="Jordan" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input placeholder="Rivers" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl><Input placeholder="+1 (555) 000-0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Min 8 characters" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Repeat password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="referralCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Referral Code <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input placeholder="e.g. jrivers-GOLD1" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground">You must have a sponsor referral code to join NFGN.</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full h-12" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : "Create Free Account"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
                </p>
              </form>
            </Form>
          </div>

          {/* Benefits */}
          <div className="space-y-6">
            {proPackage && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <Badge className="w-fit mb-2">Become a Pro Member</Badge>
                  <CardTitle className="font-serif text-xl">{proPackage.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">{proPackage.description.substring(0, 200)}...</p>
                  <div className="text-3xl font-bold mb-4">${proPackage.price}<span className="text-sm text-muted-foreground line-through ml-2">${proPackage.comparePrice}</span></div>
                  <Link href="/shop">
                    <Button variant="outline" className="w-full">View Pro Package</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg">Why Join NFGN?</h3>
              {[
                { icon: Star, title: "Premium Wellness Products", desc: "Access curated naturopathic formulas, soaps, candles, and educational resources." },
                { icon: TrendingUp, title: "3-Type Commission Plan", desc: "Earn Referral, Sales, and Level Commissions. Pro Members earn up to 22% via the multi-level power structure." },
                { icon: Users, title: "Thriving Community", desc: "Join a network of health-conscious entrepreneurs supporting each other's growth." },
                { icon: CheckCircle, title: "Your Own Store", desc: "Get a personalized replicated website to share with family and friends." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
