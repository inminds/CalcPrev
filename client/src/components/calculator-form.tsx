import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Search, Building2, User, Mail, Phone, ExternalLink } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { calculatorFormSchema, type CalculatorFormData, type SimulationResult, type Fpas, type AppSettings } from "@shared/schema";
import { formatCNPJ, formatPhone, unformatCNPJ } from "@/lib/formatters";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";

interface CalculatorFormProps {
  onSuccess: (result: SimulationResult) => void;
}

export function CalculatorForm({ onSuccess }: CalculatorFormProps) {
  const { toast } = useToast();
  const { tx } = useI18n();
  const [cnpjInput, setCnpjInput] = useState("");
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [lastSearchedCnpj, setLastSearchedCnpj] = useState("");

  const form = useForm<CalculatorFormData>({
    resolver: zodResolver(calculatorFormSchema),
    defaultValues: {
      cnpj: "",
      razaoSocial: "",
      segmento: "",
      fpasCode: "",
      isDesonerada: false,
      baseInputType: "colaboradores",
      colaboradores: 100,
      folhaMedia: undefined,
      name: "",
      email: "",
      phone: "",
      lgpdConsent: false,
    },
  });

  const formatCurrencyBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);

  const [folhaMediaInput, setFolhaMediaInput] = useState(formatCurrencyBRL(15000));
  const baseInputType = form.watch("baseInputType");

  useEffect(() => {
    if (baseInputType === "colaboradores") {
      const current = form.getValues("colaboradores");
      const nextValue = current && current > 10 ? current : 100;
      form.setValue("colaboradores", nextValue);
    } else {
      const currentFolha = form.getValues("folhaMedia");
      const nextFolha = currentFolha && currentFolha > 0 ? currentFolha : 15000;
      form.setValue("folhaMedia", nextFolha);
      setFolhaMediaInput(formatCurrencyBRL(nextFolha));
    }
  }, [baseInputType, form]);

  const { data: fpasOptions } = useQuery<Fpas[]>({
    queryKey: ["/api/fpas"],
  });

  const { data: appSettings } = useQuery<AppSettings>({
    queryKey: ["/api/app-settings"],
  });

  const privacyPolicyUrl = appSettings?.privacyPolicyUrl || "https://msh.adv.br/politica-de-privacidade/";

  useEffect(() => {
    const cleanCnpj = cnpjInput.replace(/\D/g, "");
    
    if (cleanCnpj.length === 14 && cleanCnpj !== lastSearchedCnpj) {
      const debounceTimer = setTimeout(() => {
        searchCnpj(cnpjInput);
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [cnpjInput]);

  const searchCnpj = async (cnpj: string) => {
    const cleanCnpj = unformatCNPJ(cnpj);
    if (cleanCnpj.length !== 14) {
      toast({
        title: tx("CNPJ invalido", "Invalid CNPJ"),
        description: tx("Digite um CNPJ valido com 14 digitos.", "Enter a valid 14-digit CNPJ."),
        variant: "destructive",
      });
      return;
    }

    if (cleanCnpj === lastSearchedCnpj) {
      return;
    }

    setIsSearchingCnpj(true);
    setLastSearchedCnpj(cleanCnpj);
    
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
          title: tx("Empresa encontrada", "Company found"),
          description: data.razaoSocial,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: tx("CNPJ nao encontrado", "CNPJ not found"),
          description: errorData.error || tx("Preencha os dados manualmente.", "Fill in the data manually."),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: tx("Erro na busca", "Search error"),
        description: tx("Nao foi possivel consultar o CNPJ. Tente novamente ou preencha manualmente.", "Could not look up the CNPJ. Try again or fill in manually."),
        variant: "destructive",
      });
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const simulationMutation = useMutation({
    mutationFn: async (data: CalculatorFormData) => {
      const response = await apiRequest("POST", "/api/simulate", data);
      const result = await response.json();
      return result as SimulationResult;
    },
    onSuccess: (result) => {
      toast({
        title: tx("Simulacao realizada com sucesso", "Simulation completed successfully"),
        description: tx("Confira o resultado abaixo.", "Check the result below."),
      });
      onSuccess(result);
    },
    onError: () => {
      toast({
        title: tx("Erro na simulacao", "Simulation error"),
        description: tx("Nao foi possivel processar sua solicitacao. Tente novamente.", "Could not process your request. Please try again."),
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
          {tx("Calculadora Previdenciaria", "Social Security Calculator")}
        </CardTitle>
        <CardDescription className="text-center">
          {tx("Preencha os dados abaixo para estimar sua oportunidade de credito", "Fill in the data below to estimate your credit opportunity")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados da Empresa */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="h-5 w-5" />
                <h3 className="font-semibold text-lg">{tx("Dados da Empresa", "Company Data")}</h3>
              </div>
              
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>{tx("CNPJ", "CNPJ (Tax ID)")}</FormLabel>
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
                    <FormLabel>{tx("Razao Social", "Company Name")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={tx("Nome da empresa", "Company name")}
                        data-testid="input-razao-social"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="segmento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tx("Segmento", "Industry Segment")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={tx("Segmento de atuacao", "Industry segment")}
                          data-testid="input-segmento"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fpasCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tx("Enquadramento FPAS", "FPAS Classification")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-fpas">
                              <SelectValue placeholder={tx("Selecione o FPAS", "Select FPAS")} />
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

                  <FormField
                    control={form.control}
                    name="isDesonerada"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {tx("Empresa Desonerada?", "Tax-exempt Company?")}
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="baseInputType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tx("Base para o calculo", "Calculation basis")}</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "colaboradores") {
                              const current = form.getValues("colaboradores");
                              const nextValue = current && current > 10 ? current : 100;
                              form.setValue("colaboradores", nextValue);
                            } else {
                              const nextFolha = form.getValues("folhaMedia") || 15000;
                              form.setValue("folhaMedia", nextFolha);
                              setFolhaMediaInput(formatCurrencyBRL(nextFolha));
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-base-input">
                              <SelectValue placeholder={tx("Selecione a base", "Select basis")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="colaboradores">{tx("Quantidade de colaboradores", "Number of employees")}</SelectItem>
                            <SelectItem value="folha">{tx("Valor medio da folha (R$)", "Average payroll value (R$)")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {baseInputType === "colaboradores" ? (
                    <FormField
                      control={form.control}
                      name="colaboradores"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tx("Quantidade de colaboradores", "Number of employees")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={11}
                              onChange={(e) => {
                                const parsed = parseInt(e.target.value) || 0;
                                const safeValue = Math.max(11, parsed);
                                field.onChange(safeValue);
                              }}
                              data-testid="input-colaboradores"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="folhaMedia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tx("Valor medio mensal da folha (R$)", "Monthly average payroll (R$)")}</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={folhaMediaInput}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "");
                                const numeric = digits ? Number(digits) / 100 : 0;
                                const display = digits ? formatCurrencyBRL(numeric) : "";
                                setFolhaMediaInput(display || formatCurrencyBRL(15000));
                                field.onChange(numeric || 15000);
                              }}
                              data-testid="input-folha-media"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Dados do Lead */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <User className="h-5 w-5" />
                <h3 className="font-semibold text-lg">{tx("Dados para Contato", "Contact Information")}</h3>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tx("Nome Completo", "Full Name")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder={tx("Seu nome", "Your name")}
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
                      <FormLabel>{tx("E-mail", "Email")}</FormLabel>
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
                      <FormLabel>{tx("Telefone (opcional)", "Phone (optional)")}</FormLabel>
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

            <Separator />

            {/* LGPD Consent */}
            <FormField
              control={form.control}
              name="lgpdConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-lgpd"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      {tx("Li e concordo com a", "I have read and agree to the")}{" "}
                      <a
                        href={privacyPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                        data-testid="link-privacy-policy"
                      >
                        {tx("Politica de Privacidade", "Privacy Policy")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={simulationMutation.isPending || !form.watch("lgpdConsent")}
              data-testid="button-submit"
            >
              {simulationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tx("Calculando...", "Calculating...")}
                </>
              ) : (
                tx("Calcular Credito Previdenciario", "Calculate Social Security Credit")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
