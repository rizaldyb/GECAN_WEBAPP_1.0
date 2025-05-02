import { useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { userLoginSchema, userRegistrationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  useEffect(() => {
    // Redirect if user is already logged in
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<z.infer<typeof userLoginSchema>>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onLoginSubmit(values: z.infer<typeof userLoginSchema>) {
    loginMutation.mutate(values);
  }

  // Registration form
  const registerForm = useForm<z.infer<typeof userRegistrationSchema>>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      companyName: "",
      memberType: [],
      phone: "",
      position: "",
    },
  });

  function onRegisterSubmit(values: z.infer<typeof userRegistrationSchema>) {
    registerForm.setValue('memberType', registerForm.getValues('memberType').filter(Boolean));
    registerMutation.mutate(values);
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col sm:flex-row items-center">
      {/* Hero Section - Right Side */}
      <div className="w-full sm:w-1/2 bg-primary p-8 sm:p-16 min-h-[30vh] sm:min-h-screen flex flex-col justify-center">
        <div className="max-w-md mx-auto text-white">
          <div className="mb-6 flex items-center">
            <div className="h-12 w-12 bg-white text-primary font-montserrat font-bold text-2xl flex items-center justify-center rounded">
              G
            </div>
            <span className="ml-3 font-montserrat font-semibold text-2xl tracking-tight">GECAN</span>
          </div>
          
          <h1 className="font-montserrat font-bold text-3xl sm:text-4xl mb-4">
            Global Energy & Commodities Alliance Network
          </h1>
          
          <p className="mb-8 text-primary-foreground/90">
            The exclusive platform connecting verified high-net-worth buyers, sellers, and intermediaries in premium commodity markets.
          </p>
          
          <div className="space-y-4 text-sm text-primary-foreground/80">
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <i className="ri-shield-check-line text-lg text-accent"></i>
              </div>
              <p>Rigorous vetting process for all participants ensures trust and security</p>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <i className="ri-exchange-line text-lg text-accent"></i>
              </div>
              <p>Seamless marketplace for Gold, Petroleum, Crypto, Cash Pallets, SBLCs, and more</p>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <i className="ri-tools-line text-lg text-accent"></i>
              </div>
              <p>Premium toolkits and standardized templates for efficient transaction processes</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Forms - Left Side */}
      <div className="w-full sm:w-1/2 p-6 sm:p-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In to GECAN</CardTitle>
                  <CardDescription>
                    Access your exclusive GECAN member account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <div className="flex items-center">
                            <span className="mr-2">Signing in</span>
                            <i className="ri-loader-4-line animate-spin"></i>
                          </div>
                        ) : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center text-sm text-muted-foreground">
                  <p>Forgot your password? Please contact GECAN administration.</p>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Apply for GECAN Membership</CardTitle>
                  <CardDescription>
                    Submit your application for review by GECAN administrators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="At least 8 characters" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Company Ltd." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 555 123 4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="CEO" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={registerForm.control}
                        name="memberType"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel>Member Type (Select all that apply)</FormLabel>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {["Buyer", "Seller", "Broker", "Intermediary", "Strategic_Partner"].map((type) => (
                                <FormField
                                  key={type}
                                  control={registerForm.control}
                                  name="memberType"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={type}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(type as any)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, type])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== type
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                          {type.replace('_', ' ')}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-center space-x-2 mt-4">
                        <Checkbox id="terms" required />
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to GECAN's Terms of Service and Privacy Policy
                        </label>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <div className="flex items-center">
                            <span className="mr-2">Submitting</span>
                            <i className="ri-loader-4-line animate-spin"></i>
                          </div>
                        ) : "Submit Application"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col text-center text-sm text-muted-foreground">
                  <p>
                    All applications are subject to review and approval by GECAN administration.
                  </p>
                  <p className="mt-1">
                    Due diligence process may require additional documentation.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
