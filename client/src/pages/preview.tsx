import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Building2, 
  Calculator, 
  Search, 
  Shield, 
  Clock, 
  FileText,
  TrendingUp,
  Download,
  ArrowLeft,
  User,
  Mail,
  Phone
} from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { useI18n } from "@/lib/i18n";

export default function PreviewPage() {
  const { tx } = useI18n();

  return (
    <PublicLayout>
      <section className="py-16 px-4 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {tx("Descubra o Potencial de Crédito", "Discover Your Credit Potential")}
          </h2>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
            {tx("da Sua Folha", "for Your Company")}
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
            {tx(
              "Faca sua pre-analise gratuita e estime oportunidades de recuperacao de credito previdenciario de forma rapida e confiavel.",
              "Get your free pre-analysis and estimate social security credit recovery opportunities quickly and reliably."
            )}
          </p>
        </div>

        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: tx("Seguro", "Secure"), desc: tx("Seus dados protegidos", "Your data protected") },
            { icon: Clock, title: tx("Rapido", "Fast"), desc: tx("Resultado em segundos", "Results in seconds") },
            { icon: FileText, title: tx("PDF Completo", "Complete PDF"), desc: tx("Estimativa Prévia", "Previous Estimate") },
          ].map((feature, i) => (
            <Card key={i} className="text-center card-elevated">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-background">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-t-4 border-t-primary card-elevated">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">
                {tx("Calculadora Previdenciaria", "Social Security Calculator")}
              </CardTitle>
              <CardDescription>
                {tx(
                  "Preencha os dados abaixo para estimar sua oportunidade de credito",
                  "Fill in the details below to estimate your credit opportunity"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Building2 className="h-4 w-4" />
                  <span>{tx("Dados da Empresa", "Company Data")}</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label>CNPJ</Label>
                    <div className="flex gap-2 mt-1">
                      <Input placeholder="00.000.000/0001-00" className="flex-1" />
                      <Button><Search className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>{tx("Razao Social", "Company Name")}</Label>
                    <Input placeholder={tx("Nome da empresa", "Company name")} className="mt-1" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{tx("Segmento", "Segment")}</Label>
                      <Input placeholder={tx("Ex: Comercio", "Ex: Commerce")} className="mt-1" />
                    </div>
                    <div>
                      <Label>{tx("Enquadramento FPAS", "FPAS Classification")}</Label>
                      <Input placeholder="515" className="mt-1" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 flex items-center justify-between bg-muted">
                      <Label>{tx("Empresa Desonerada?", "Tax Exempt?")}</Label>
                      <Switch />
                    </Card>
                    <div>
                      <Label>{tx("Qtd. Colaboradores", "Employees")}</Label>
                      <Input type="number" placeholder="10" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <User className="h-4 w-4" />
                  <span>{tx("Dados para Contato", "Contact Information")}</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label>{tx("Nome Completo", "Full Name")}</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder={tx("Seu nome", "Your name")} className="pl-10" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>E-mail</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="seu@email.com" className="pl-10" />
                      </div>
                    </div>
                    <div>
                      <Label>{tx("Telefone", "Phone")}</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="(00) 00000-0000" className="pl-10" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full py-6 text-lg font-semibold shadow-lg shadow-primary/25">
                <Calculator className="mr-2 h-5 w-5" />
                {tx("Calcular Credito Estimado", "Calculate Estimated Credit")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-muted py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">
            {tx("Preview do Resultado", "Result Preview")}
          </h3>
          
          <Card className="shadow-xl border-t-4 border-t-primary card-elevated">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                {tx("Diagnostico Previdenciario", "Social Security Diagnostic")}
              </CardTitle>
              <CardDescription>
                {tx("Resultado da sua pre-analise de credito", "Result of your credit pre-analysis")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg p-4 space-y-3 bg-muted">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Building2 className="h-4 w-4" />
                  <span>{tx("Dados da Empresa", "Company Data")}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">CNPJ:</span>
                    <span className="ml-2 font-medium">00.000.000/0001-91</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{tx("Razao Social:", "Company:")}:</span>
                    <span className="ml-2 font-medium">EMPRESA EXEMPLO LTDA</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{tx("Colaboradores:", "Employees:")}:</span>
                    <span className="ml-2 font-medium">50</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">FPAS:</span>
                    <span className="ml-2 font-medium">515</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Calculator className="h-4 w-4" />
                  <span>{tx("Resumo do Calculo", "Calculation Summary")}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">{tx("Base Estimada da Folha", "Payroll Base")}</div>
                      <div className="text-xl font-bold">R$ 70.600,00</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">{tx("Imposto Mensal", "Monthly Tax")}</div>
                      <div className="text-xl font-bold">R$ 5.295,00</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">{tx("Total Projetado (65 meses)", "Projected Total (65 months)")}</div>
                      <div className="text-xl font-bold">R$ 344.175,00</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-primary text-primary-foreground">
                    <CardContent className="p-4">
                      <div className="text-sm opacity-90">{tx("Credito Estimado Total", "Total Estimated Credit")}</div>
                      <div className="text-2xl font-bold">R$ 68.835,00</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="font-medium text-lg">
                  {tx("Distribuicao por Nivel de Risco", "Risk Level Distribution")}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <Card className="text-center border-t-4" style={{ borderTopColor: '#22c55e' }}>
                    <CardContent className="p-4">
                      <div className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: '#dcfce7' }}>
                        <Shield className="h-5 w-5" style={{ color: '#22c55e' }} />
                      </div>
                      <div className="text-xs font-medium mb-1" style={{ color: '#22c55e' }}>{tx("Baixo Risco", "Low Risk")}</div>
                      <div className="text-lg font-bold">R$ 10.325,25</div>
                      <Badge variant="secondary" className="mt-1">15%</Badge>
                    </CardContent>
                  </Card>
                  
                  <Card className="text-center border-t-4" style={{ borderTopColor: '#eab308' }}>
                    <CardContent className="p-4">
                      <div className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: '#fef9c3' }}>
                        <Clock className="h-5 w-5" style={{ color: '#eab308' }} />
                      </div>
                      <div className="text-xs font-medium mb-1" style={{ color: '#eab308' }}>{tx("Medio Risco", "Medium Risk")}</div>
                      <div className="text-lg font-bold">R$ 24.092,25</div>
                      <Badge variant="secondary" className="mt-1">35%</Badge>
                    </CardContent>
                  </Card>
                  
                  <Card className="text-center border-t-4" style={{ borderTopColor: '#ef4444' }}>
                    <CardContent className="p-4">
                      <div className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: '#fee2e2' }}>
                        <TrendingUp className="h-5 w-5" style={{ color: '#ef4444' }} />
                      </div>
                      <div className="text-xs font-medium mb-1" style={{ color: '#ef4444' }}>{tx("Alto Risco", "High Risk")}</div>
                      <div className="text-lg font-bold">R$ 34.417,50</div>
                      <Badge variant="secondary" className="mt-1">50%</Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button variant="outline" className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {tx("Nova Simulacao", "New Simulation")}
                </Button>
                <Button className="flex-1 shadow-lg shadow-primary/25">
                  <Download className="mr-2 h-4 w-4" />
                  {tx("Baixar PDF do Diagnostico", "Download Diagnostic PDF")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">
            {tx("Paleta de Cores Aplicada", "Applied Color Palette")}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="h-20 rounded-lg mb-2" style={{ background: '#00513B' }}></div>
              <p className="font-medium">{tx("Primaria", "Primary")}</p>
              <p className="text-sm text-muted-foreground">#00513B</p>
            </div>
            <div className="text-center">
              <div className="h-20 rounded-lg mb-2" style={{ background: '#D7AE81' }}></div>
              <p className="font-medium">{tx("Secundaria", "Secondary")}</p>
              <p className="text-sm text-muted-foreground">#D7AE81</p>
            </div>
            <div className="text-center">
              <div className="h-20 rounded-lg mb-2" style={{ background: '#1C1C1C' }}></div>
              <p className="font-medium">{tx("Texto", "Text")}</p>
              <p className="text-sm text-muted-foreground">#1C1C1C</p>
            </div>
            <div className="text-center">
              <div className="h-20 rounded-lg mb-2 border" style={{ background: '#F2F2F2' }}></div>
              <p className="font-medium">Background</p>
              <p className="text-sm text-muted-foreground">#F2F2F2</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
