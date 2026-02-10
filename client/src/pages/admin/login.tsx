import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, KeyRound, LogIn } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [azureConfigured, setAzureConfigured] = useState(true);
  const [checkingAzure, setCheckingAzure] = useState(false);

  useEffect(() => {
    // Em desenvolvimento, sempre mostra o botão Azure (mesmo se não configurado)
    // O backend tratará o erro graciosamente
    // Em produção, verifica se está configurado
    if (import.meta.env.PROD) {
      fetch("/api/public/azure-config")
        .then(res => res.json())
        .then(data => setAzureConfigured(data.azureConfigured))
        .catch(() => setAzureConfigured(false))
        .finally(() => setCheckingAzure(false));
    }
  }, []);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        sessionStorage.setItem("adminToken", result.token);
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao Backoffice.",
        });
        setLocation("/admin/dashboard");
      } else {
        toast({
          title: "Senha incorreta",
          description: "Verifique a senha e tente novamente.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro no login",
        description: "Não foi possível realizar o login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAzureLogin = () => {
    window.location.href = "/admin/auth/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Backoffice Administrativo</CardTitle>
          <CardDescription>
            Digite a senha de administrador para acessar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {azureConfigured && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAzureLogin}
                data-testid="button-azure-login"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Entrar com Microsoft
              </Button>
              <Separator />
            </>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha de Administrador</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Digite a senha"
                          className="pl-10"
                          data-testid="input-admin-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-admin-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
