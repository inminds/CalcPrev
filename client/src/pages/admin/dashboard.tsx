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
import type { CalculationParams, Fpas, Lead, Simulation } from "@shared/schema";

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

type ParamsFormData = z.infer<typeof paramsSchema>;
type FpasFormData = z.infer<typeof fpasSchema>;

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [fpasDialogOpen, setFpasDialogOpen] = useState(false);
  const [editingFpas, setEditingFpas] = useState<Fpas | null>(null);

  const token = sessionStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin");
    }
  }, [token, setLocation]);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const { data: params, isLoading: paramsLoading } = useQuery<CalculationParams>({
    queryKey: ["/api/admin/params"],
    queryFn: async () => {
      const res = await fetch("/api/admin/params", { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to fetch params");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: fpasData, isLoading: fpasLoading } = useQuery<Fpas[]>({
    queryKey: ["/api/fpas"],
    enabled: !!token,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<(Lead & { simulationsCount: number })[]>({
    queryKey: ["/api/admin/leads"],
    queryFn: async () => {
      const res = await fetch("/api/admin/leads", { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
    enabled: !!token,
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
      const res = await fetch("/api/admin/params", {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
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
      const res = await fetch("/api/admin/fpas", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
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
      const res = await fetch(`/api/admin/fpas/${data.id}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "application/json" },
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
      const res = await fetch(`/api/admin/fpas/${id}`, {
        method: "DELETE",
        headers: authHeaders,
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

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    setLocation("/admin");
  };

  const handleExportLeads = async () => {
    try {
      const res = await fetch("/api/admin/leads/export", { headers: authHeaders });
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

  if (!token) return null;

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
          <TabsList className="grid w-full grid-cols-3 max-w-md">
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
        </Tabs>
      </main>
    </div>
  );
}
