import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings,
  Users,
  FileSpreadsheet,
  LogOut,
  Save,
  Loader2,
  Download,
  Plus,
  Trash2,
  Calculator,
  ChevronLeft,
  Webhook,
  Mail,
  Link2,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatCurrency, formatDate, formatPercentage } from "@/lib/formatters";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CalculationParams, Fpas, Lead, EmailSettings, WebhookSettings, AppSettings } from "@shared/schema";

const paramsSchema = z.object({
  salarioMinimo: z.string().min(1, "Obrigatório"),
  percentualCredito: z.string().min(1, "Obrigatório"),
  percentualVerde: z.string().min(1, "Obrigatório"),
  percentualAmarelo: z.string().min(1, "Obrigatório"),
  percentualVermelho: z.string().min(1, "Obrigatório"),
  mesesProjecao: z.string().min(1, "Obrigatório"),
});

const fpasSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  aliquotaTerceiros: z.string().min(1, "Alíquota é obrigatória"),
});

const emailSettingsSchema = z.object({
  enabled: z.boolean(),
  fromEmail: z.string().email("E-mail inválido"),
  fromName: z.string().min(1, "Nome é obrigatório"),
  subject: z.string().min(1, "Assunto é obrigatório"),
  bodyTemplate: z.string().min(1, "Template é obrigatório"),
});

const webhookSettingsSchema = z.object({
  enabled: z.boolean(),
  url: z.string().url("URL inválida").or(z.string().length(0)),
  headers: z.string().refine((val) => {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
    } catch {
      return false;
    }
  }, { message: "Headers deve ser um JSON válido (objeto)" }),
  retryCount: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 0 && num <= 10;
  }, { message: "Deve ser um número entre 0 e 10" }),
});

const appSettingsSchema = z.object({
  privacyPolicyUrl: z.string().url("URL inválida"),
});

type ParamsFormData = z.infer<typeof paramsSchema>;
type FpasFormData = z.infer<typeof fpasSchema>;
type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
type WebhookSettingsFormData = z.infer<typeof webhookSettingsSchema>;
type AppSettingsFormData = z.infer<typeof appSettingsSchema>;

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [fpasDialogOpen, setFpasDialogOpen] = useState(false);
  const [editingFpas, setEditingFpas] = useState<Fpas | null>(null);

  const token = sessionStorage.getItem("adminToken");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (token) {
      setIsAuthenticated(true);
      return;
    }

    fetch("/api/admin/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        setIsAuthenticated(Boolean(data?.authenticated));
      })
      .catch(() => {
        if (!isMounted) return;
        setIsAuthenticated(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (isAuthenticated === false) {
      setLocation("/admin");
    }
  }, [isAuthenticated, setLocation]);

  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders.Authorization = `Bearer ${token}`;
  }

  const fetchAdmin = (url: string, options: RequestInit = {}) => {
    const mergedHeaders = { ...authHeaders, ...(options.headers || {}) };
    return fetch(url, {
      ...options,
      headers: mergedHeaders,
      credentials: "include",
    });
  };

  const { data: params, isLoading: paramsLoading } = useQuery<CalculationParams>({
    queryKey: ["/api/admin/params"],
    queryFn: async () => {
      const res = await fetchAdmin("/api/admin/params");
      if (!res.ok) throw new Error("Failed to fetch params");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const { data: fpasData, isLoading: fpasLoading } = useQuery<Fpas[]>({
    queryKey: ["/api/fpas"],
    enabled: isAuthenticated === true,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<(Lead & { simulationsCount: number })[]>({
    queryKey: ["/api/admin/leads"],
    queryFn: async () => {
      const res = await fetchAdmin("/api/admin/leads");
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const { data: emailSettings, isLoading: emailSettingsLoading } = useQuery<EmailSettings>({
    queryKey: ["/api/admin/email-settings"],
    queryFn: async () => {
      const res = await fetchAdmin("/api/admin/email-settings");
      if (!res.ok) throw new Error("Failed to fetch email settings");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const { data: webhookSettings, isLoading: webhookSettingsLoading } = useQuery<WebhookSettings>({
    queryKey: ["/api/admin/webhook-settings"],
    queryFn: async () => {
      const res = await fetchAdmin("/api/admin/webhook-settings");
      if (!res.ok) throw new Error("Failed to fetch webhook settings");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const { data: appSettings, isLoading: appSettingsLoading } = useQuery<AppSettings>({
    queryKey: ["/api/admin/app-settings"],
    queryFn: async () => {
      const res = await fetchAdmin("/api/admin/app-settings");
      if (!res.ok) throw new Error("Failed to fetch app settings");
      return res.json();
    },
    enabled: isAuthenticated === true,
  });

  const paramsForm = useForm<ParamsFormData>({
    resolver: zodResolver(paramsSchema),
    defaultValues: {
      salarioMinimo: "",
      percentualCredito: "",
      percentualVerde: "",
      percentualAmarelo: "",
      percentualVermelho: "",
      mesesProjecao: "",
    },
  });

  const fpasForm = useForm<FpasFormData>({
    resolver: zodResolver(fpasSchema),
    defaultValues: {
      code: "",
      descricao: "",
      aliquotaTerceiros: "",
    },
  });

  const emailSettingsForm = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      enabled: false,
      fromEmail: "",
      fromName: "",
      subject: "",
      bodyTemplate: "",
    },
  });

  const webhookSettingsForm = useForm<WebhookSettingsFormData>({
    resolver: zodResolver(webhookSettingsSchema),
    defaultValues: {
      enabled: false,
      url: "",
      headers: "{}",
      retryCount: "3",
    },
  });

  const appSettingsForm = useForm<AppSettingsFormData>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      privacyPolicyUrl: "https://msh.adv.br/politica-de-privacidade/",
    },
  });

  useEffect(() => {
    if (params) {
      paramsForm.reset({
        salarioMinimo: params.salarioMinimo.toString(),
        percentualCredito: (parseFloat(params.percentualCredito) * 100).toString(),
        percentualVerde: (parseFloat(params.percentualVerde) * 100).toString(),
        percentualAmarelo: (parseFloat(params.percentualAmarelo) * 100).toString(),
        percentualVermelho: (parseFloat(params.percentualVermelho) * 100).toString(),
        mesesProjecao: params.mesesProjecao.toString(),
      });
    }
  }, [params, paramsForm]);

  useEffect(() => {
    if (emailSettings) {
      emailSettingsForm.reset({
        enabled: emailSettings.enabled,
        fromEmail: emailSettings.fromEmail,
        fromName: emailSettings.fromName,
        subject: emailSettings.subject,
        bodyTemplate: emailSettings.bodyTemplate,
      });
    }
  }, [emailSettings, emailSettingsForm]);

  useEffect(() => {
    if (webhookSettings) {
      webhookSettingsForm.reset({
        enabled: webhookSettings.enabled,
        url: webhookSettings.url || "",
        headers: webhookSettings.headers || "{}",
        retryCount: webhookSettings.retryCount?.toString() || "3",
      });
    }
  }, [webhookSettings, webhookSettingsForm]);

  useEffect(() => {
    if (appSettings) {
      appSettingsForm.reset({
        privacyPolicyUrl: appSettings.privacyPolicyUrl || "https://msh.adv.br/politica-de-privacidade/",
      });
    }
  }, [appSettings, appSettingsForm]);

  const updateParamsMutation = useMutation({
    mutationFn: async (data: ParamsFormData) => {
      const payload = {
        salarioMinimo: data.salarioMinimo,
        percentualCredito: (parseFloat(data.percentualCredito) / 100).toString(),
        percentualVerde: (parseFloat(data.percentualVerde) / 100).toString(),
        percentualAmarelo: (parseFloat(data.percentualAmarelo) / 100).toString(),
        percentualVermelho: (parseFloat(data.percentualVermelho) / 100).toString(),
        mesesProjecao: parseInt(data.mesesProjecao),
      };
      const res = await fetchAdmin("/api/admin/params", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update params");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Parâmetros atualizados com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/params"] });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar parâmetros", variant: "destructive" });
    },
  });

  const createFpasMutation = useMutation({
    mutationFn: async (data: FpasFormData) => {
      const payload = {
        code: data.code,
        descricao: data.descricao,
        aliquotaTerceiros: (parseFloat(data.aliquotaTerceiros) / 100).toString(),
      };
      const res = await fetchAdmin("/api/admin/fpas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create FPAS");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "FPAS criado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/fpas"] });
      setFpasDialogOpen(false);
      fpasForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar FPAS", variant: "destructive" });
    },
  });

  const updateFpasMutation = useMutation({
    mutationFn: async (data: FpasFormData & { id: string }) => {
      const payload = {
        code: data.code,
        descricao: data.descricao,
        aliquotaTerceiros: (parseFloat(data.aliquotaTerceiros) / 100).toString(),
      };
      const res = await fetchAdmin(`/api/admin/fpas/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update FPAS");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "FPAS atualizado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/fpas"] });
      setFpasDialogOpen(false);
      setEditingFpas(null);
      fpasForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar FPAS", variant: "destructive" });
    },
  });

  const deleteFpasMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchAdmin(`/api/admin/fpas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete FPAS");
    },
    onSuccess: () => {
      toast({ title: "FPAS excluído com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/fpas"] });
    },
    onError: () => {
      toast({ title: "Erro ao excluir FPAS", variant: "destructive" });
    },
  });

  const updateEmailSettingsMutation = useMutation({
    mutationFn: async (data: EmailSettingsFormData) => {
      const res = await fetchAdmin("/api/admin/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update email settings");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Configurações de e-mail atualizadas com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-settings"] });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar configurações de e-mail", variant: "destructive" });
    },
  });

  const updateWebhookSettingsMutation = useMutation({
    mutationFn: async (data: WebhookSettingsFormData) => {
      const payload = {
        ...data,
        retryCount: parseInt(data.retryCount) || 3,
      };
      const res = await fetchAdmin("/api/admin/webhook-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update webhook settings");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Configurações de webhook atualizadas com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhook-settings"] });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar configurações de webhook", variant: "destructive" });
    },
  });

  const updateAppSettingsMutation = useMutation({
    mutationFn: async (data: AppSettingsFormData) => {
      const res = await fetchAdmin("/api/admin/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update app settings");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Configurações do app atualizadas com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/app-settings"] });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar configurações do app", variant: "destructive" });
    },
  });

  const handleLogout = async () => {
    sessionStorage.removeItem("adminToken");
    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ returnTo: `${window.location.origin}/admin` }),
      });
      const data = await res.json().catch(() => null);
      if (data?.logoutUrl) {
        window.location.href = data.logoutUrl;
        return;
      }
    } catch {
      // Ignore logout failures and still redirect
    }
    setLocation("/admin");
  };

  const handleExportLeads = async () => {
    try {
      const res = await fetchAdmin("/api/admin/leads/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({ title: "Exportação realizada com sucesso" });
      }
    } catch {
      toast({ title: "Erro ao exportar leads", variant: "destructive" });
    }
  };

  const openEditFpas = (fpas: Fpas) => {
    setEditingFpas(fpas);
    fpasForm.reset({
      code: fpas.code,
      descricao: fpas.descricao,
      aliquotaTerceiros: (parseFloat(fpas.aliquotaTerceiros) * 100).toString(),
    });
    setFpasDialogOpen(true);
  };

  const openNewFpas = () => {
    setEditingFpas(null);
    fpasForm.reset({ code: "", descricao: "", aliquotaTerceiros: "" });
    setFpasDialogOpen(true);
  };

  const handleFpasSubmit = (data: FpasFormData) => {
    if (editingFpas) {
      updateFpasMutation.mutate({ ...data, id: editingFpas.id });
    } else {
      createFpasMutation.mutate(data);
    }
  };

  if (isAuthenticated === null) return null;
  if (isAuthenticated === false) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" data-testid="button-back-home">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-primary-foreground">Backoffice</h1>
              <p className="text-xs text-primary-foreground/80">Administração</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-primary-foreground hover:bg-white/10" />
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="params" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="params" data-testid="tab-params">
              <Calculator className="h-4 w-4 mr-2" />
              Parâmetros
            </TabsTrigger>
            <TabsTrigger value="fpas" data-testid="tab-fpas">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              FPAS
            </TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">
              <Users className="h-4 w-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="integrations" data-testid="tab-integrations">
              <Webhook className="h-4 w-4 mr-2" />
              Integrações
            </TabsTrigger>
          </TabsList>

          {/* Parâmetros Tab */}
          <TabsContent value="params">
            <Card>
              <CardHeader>
                <CardTitle>Parâmetros de Cálculo</CardTitle>
                <CardDescription>
                  Configure os valores base para os cálculos previdenciários
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paramsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Form {...paramsForm}>
                    <form
                      onSubmit={paramsForm.handleSubmit((data) =>
                        updateParamsMutation.mutate(data)
                      )}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={paramsForm.control}
                          name="salarioMinimo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salário Mínimo (R$)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  data-testid="input-salario-minimo"
                                />
                              </FormControl>
                              <FormDescription>
                                Valor do salário mínimo vigente
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={paramsForm.control}
                          name="mesesProjecao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meses de Projeção</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  data-testid="input-meses-projecao"
                                />
                              </FormControl>
                              <FormDescription>
                                Período para cálculo (padrão: 65 meses)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={paramsForm.control}
                          name="percentualCredito"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Percentual de Crédito (%)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.1"
                                  data-testid="input-percentual-credito"
                                />
                              </FormControl>
                              <FormDescription>
                                Percentual de crédito sobre o total (padrão: 20%)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="border-t pt-6">
                        <h4 className="font-medium mb-4">
                          Distribuição por Risco (Semáforo)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={paramsForm.control}
                            name="percentualVerde"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-emerald-600">
                                  Verde - Baixo Risco (%)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.1"
                                    data-testid="input-percentual-verde"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={paramsForm.control}
                            name="percentualAmarelo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-amber-600">
                                  Amarelo - Médio Risco (%)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.1"
                                    data-testid="input-percentual-amarelo"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={paramsForm.control}
                            name="percentualVermelho"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-red-600">
                                  Vermelho - Alto Risco (%)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.1"
                                    data-testid="input-percentual-vermelho"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={updateParamsMutation.isPending}
                        data-testid="button-save-params"
                      >
                        {updateParamsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Parâmetros
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FPAS Tab */}
          <TabsContent value="fpas">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Tabela FPAS</CardTitle>
                  <CardDescription>
                    Gerencie os códigos FPAS e suas alíquotas de terceiros
                  </CardDescription>
                </div>
                <Dialog open={fpasDialogOpen} onOpenChange={setFpasDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewFpas} data-testid="button-new-fpas">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo FPAS
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingFpas ? "Editar FPAS" : "Novo FPAS"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingFpas
                          ? "Atualize as informações do FPAS"
                          : "Adicione um novo código FPAS"}
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...fpasForm}>
                      <form
                        onSubmit={fpasForm.handleSubmit(handleFpasSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={fpasForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ex: 515"
                                  data-testid="input-fpas-code"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={fpasForm.control}
                          name="descricao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Descrição do FPAS"
                                  data-testid="input-fpas-descricao"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={fpasForm.control}
                          name="aliquotaTerceiros"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alíquota de Terceiros (%)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  placeholder="Ex: 5.8"
                                  data-testid="input-fpas-aliquota"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={
                              createFpasMutation.isPending ||
                              updateFpasMutation.isPending
                            }
                            data-testid="button-save-fpas"
                          >
                            {createFpasMutation.isPending ||
                            updateFpasMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Salvar
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {fpasLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : fpasData?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum FPAS cadastrado. Clique em "Novo FPAS" para adicionar.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Alíquota Terceiros</TableHead>
                        <TableHead className="w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fpasData?.map((fpas) => (
                        <TableRow key={fpas.id}>
                          <TableCell className="font-medium">
                            {fpas.code}
                          </TableCell>
                          <TableCell>{fpas.descricao}</TableCell>
                          <TableCell>
                            {formatPercentage(fpas.aliquotaTerceiros)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditFpas(fpas)}
                                data-testid={`button-edit-fpas-${fpas.code}`}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteFpasMutation.mutate(fpas.id)}
                                data-testid={`button-delete-fpas-${fpas.code}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle>Leads Capturados</CardTitle>
                  <CardDescription>
                    Lista de contatos gerados pela calculadora
                  </CardDescription>
                </div>
                <Button onClick={handleExportLeads} data-testid="button-export-leads">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : leads?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum lead capturado ainda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Simulações</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leads?.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">
                              {lead.name}
                            </TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell>{lead.phone || "-"}</TableCell>
                            <TableCell>{lead.simulationsCount}</TableCell>
                            <TableCell>{formatDate(lead.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrações Tab */}
          <TabsContent value="integrations">
            <div className="space-y-6">
              {/* Email Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle>Envio de E-mail</CardTitle>
                  </div>
                  <CardDescription>
                    Configure o envio automático de e-mail com PDF anexo após cada simulação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {emailSettingsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Form {...emailSettingsForm}>
                      <form
                        onSubmit={emailSettingsForm.handleSubmit((data) =>
                          updateEmailSettingsMutation.mutate(data)
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={emailSettingsForm.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Envio Automático de E-mail
                                </FormLabel>
                                <FormDescription>
                                  Enviar diagnóstico PDF automaticamente após simulação
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-email-enabled"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={emailSettingsForm.control}
                            name="fromName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Remetente</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Machado Schütz Advogados"
                                    data-testid="input-email-from-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={emailSettingsForm.control}
                            name="fromEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>E-mail do Remetente</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    placeholder="noreply@msh.adv.br"
                                    data-testid="input-email-from"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={emailSettingsForm.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assunto do E-mail</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Seu Diagnóstico Previdenciário"
                                  data-testid="input-email-subject"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailSettingsForm.control}
                          name="bodyTemplate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Template do E-mail</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  rows={5}
                                  placeholder="Use {{name}} para inserir o nome do lead"
                                  data-testid="input-email-body"
                                />
                              </FormControl>
                              <FormDescription>
                                Use {"{{name}}"} para incluir o nome do contato no texto
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={updateEmailSettingsMutation.isPending}
                          data-testid="button-save-email-settings"
                        >
                          {updateEmailSettingsMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar E-mail
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>

              {/* Webhook Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Webhook className="h-5 w-5 text-primary" />
                    <CardTitle>Webhook de Leads</CardTitle>
                  </div>
                  <CardDescription>
                    Configure o envio de leads para sistemas externos (CRM, automações)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {webhookSettingsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Form {...webhookSettingsForm}>
                      <form
                        onSubmit={webhookSettingsForm.handleSubmit((data) =>
                          updateWebhookSettingsMutation.mutate(data)
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={webhookSettingsForm.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Webhook Ativo
                                </FormLabel>
                                <FormDescription>
                                  Enviar dados do lead para URL externa
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-webhook-enabled"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={webhookSettingsForm.control}
                          name="url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL do Webhook</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="url"
                                  placeholder="https://api.exemplo.com/webhook"
                                  data-testid="input-webhook-url"
                                />
                              </FormControl>
                              <FormDescription>
                                Receberá POST com dados do lead e simulação
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={webhookSettingsForm.control}
                          name="headers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Headers (JSON)</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  rows={3}
                                  placeholder='{"Authorization": "Bearer seu-token", "X-API-Key": "chave"}'
                                  data-testid="input-webhook-headers"
                                />
                              </FormControl>
                              <FormDescription>
                                Headers customizados em formato JSON
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={webhookSettingsForm.control}
                          name="retryCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tentativas de Reenvio</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="0"
                                  max="5"
                                  data-testid="input-webhook-retries"
                                />
                              </FormControl>
                              <FormDescription>
                                Número de tentativas em caso de falha (máx: 5)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={updateWebhookSettingsMutation.isPending}
                          data-testid="button-save-webhook-settings"
                        >
                          {updateWebhookSettingsMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar Webhook
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>

              {/* App Settings - Privacy Policy */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    <CardTitle>Configurações LGPD</CardTitle>
                  </div>
                  <CardDescription>
                    Configure a URL da política de privacidade exibida no formulário
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {appSettingsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Form {...appSettingsForm}>
                      <form
                        onSubmit={appSettingsForm.handleSubmit((data) =>
                          updateAppSettingsMutation.mutate(data)
                        )}
                        className="space-y-4"
                      >
                        <FormField
                          control={appSettingsForm.control}
                          name="privacyPolicyUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL da Política de Privacidade</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="url"
                                  placeholder="https://msh.adv.br/politica-de-privacidade/"
                                  data-testid="input-privacy-policy-url"
                                />
                              </FormControl>
                              <FormDescription>
                                Link exibido no checkbox LGPD do formulário público
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={updateAppSettingsMutation.isPending}
                          data-testid="button-save-app-settings"
                        >
                          {updateAppSettingsMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar LGPD
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
