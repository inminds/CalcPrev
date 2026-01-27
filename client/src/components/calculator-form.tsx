import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Search, Building2, User, Mail, Phone } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { calculatorFormSchema, type CalculatorFormData, type SimulationResult, type Fpas } from "@shared/schema";
import { formatCNPJ, formatPhone, unformatCNPJ } from "@/lib/formatters";
import { apiRequest } from "@/lib/queryClient";

interface CalculatorFormProps {
  onSuccess: (result: SimulationResult) => void;
}

export function CalculatorForm({ onSuccess }: CalculatorFormProps) {
  const { toast } = useToast();
  const [cnpjInput, setCnpjInput] = useState("");
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);

  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: {
      cnpj: "",
      razaoSocial: "",
      segmento: "",
      fpasCode: "",
      isDesonerada: false,
      colaboradores: 1,
      name: "",
      email: "",
      phone: "",
    },
  });

  const { data: fpasOptions } = useQuery<Fpas[]>({
    queryKey: ["/api/fpas"],
  });

  const searchCnpj = async (cnpj: string) => {
    const cleanCnpj = unformatCNPJ(cnpj);
    if (cleanCnpj.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingCnpj(true);
    try {
      const response = await fetch(`/api/cnpj/${cleanCnpj}`);
      if (response.ok) {
        const data = await response.json();
        form.setValue("cnpj", cleanCnpj);
        form.setValue("razaoSocial", data.razaoSocial || "");
        form.setValue("segmento", data.segmento || "");
        if (data.fpasCode) {
          form.setValue("fpasCode", data.fpasCode);
        }
        toast({
          title: "Empresa encontrada",
          description: data.razaoSocial,
        });
      } else {
        toast({
          title: "CNPJ não encontrado",
          description: "Preencha os dados manualmente.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro na busca",
        description: "Não foi possível consultar o CNPJ. Preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const simulationMutation = useMutation({
    mutationFn: async (data: CalculatorFormData) => {
      const response = await apiRequest("POST", "/api/simulate", data);
      return response as SimulationResult;
    },
    onSuccess: (result) => {
      toast({
        title: "Simulação realizada com sucesso",
        description: "Confira o resultado abaixo.",
      });
      onSuccess(result);
    },
    onError: () => {
      toast({
        title: "Erro na simulação",
        description: "Não foi possível processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CalculatorFormData) => {
    simulationMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center">
          Calculadora Previdenciária
        </CardTitle>
        <CardDescription className="text-center">
          Preencha os dados abaixo para estimar sua oportunidade de crédito
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados da Empresa */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                <h3 className="font-semibold text-lg">Dados da Empresa</h3>
              </div>
              
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            placeholder="00.000.000/0000-00"
                            value={formatCNPJ(cnpjInput)}
                            onChange={(e) => {
                              setCnpjInput(e.target.value);
                              field.onChange(unformatCNPJ(e.target.value));
                            }}
                            data-testid="input-cnpj"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => searchCnpj(cnpjInput)}
                            disabled={isSearchingCnpj}
                            data-testid="button-search-cnpj"
                          >
                            {isSearchingCnpj ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nome da empresa"
                        data-testid="input-razao-social"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="segmento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segmento</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Segmento de atuação"
                          data-testid="input-segmento"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fpasCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enquadramento FPAS</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-fpas">
                            <SelectValue placeholder="Selecione o FPAS" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fpasOptions?.map((fpas) => (
                            <SelectItem
                              key={fpas.code}
                              value={fpas.code}
                              data-testid={`select-fpas-${fpas.code}`}
                            >
                              {fpas.code} - {fpas.descricao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isDesonerada"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Empresa Desonerada?
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-desonerada"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="colaboradores"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Colaboradores</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                          data-testid="input-colaboradores"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Dados do Lead */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <User className="h-5 w-5" />
                <h3 className="font-semibold text-lg">Dados para Contato</h3>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="Seu nome"
                          className="pl-10"
                          data-testid="input-name"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (opcional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="(00) 00000-0000"
                            className="pl-10"
                            value={formatPhone(field.value || "")}
                            onChange={(e) =>
                              field.onChange(e.target.value.replace(/\D/g, ""))
                            }
                            data-testid="input-phone"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={simulationMutation.isPending}
              data-testid="button-submit"
            >
              {simulationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : (
                "Calcular Crédito Previdenciário"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
