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
import { Link } from "wouter";

export default function PreviewPage() {
  return (
    <div className="msh-theme min-h-screen">
      <style>{`
        .msh-theme {
          --msh-primary: #1F5C4A;
          --msh-primary-dark: #163F34;
          --msh-text-primary: #1C1C1C;
          --msh-text-secondary: #4F4F4F;
          --msh-bg-card: #F2F2F2;
          --msh-bg-main: #FFFFFF;
          --msh-separator: #E0E0E0;
        }
        
        .msh-theme .msh-header {
          background: linear-gradient(135deg, var(--msh-primary) 0%, var(--msh-primary-dark) 100%);
        }
        
        .msh-theme .msh-btn-primary {
          background-color: var(--msh-primary);
          color: white;
        }
        
        .msh-theme .msh-btn-primary:hover {
          background-color: var(--msh-primary-dark);
        }
        
        .msh-theme .msh-text-primary {
          color: var(--msh-primary);
        }
        
        .msh-theme .msh-border-primary {
          border-color: var(--msh-primary);
        }
        
        .msh-theme .msh-bg-primary {
          background-color: var(--msh-primary);
        }
        
        .msh-theme .msh-bg-primary-light {
          background-color: rgba(31, 92, 74, 0.1);
        }
        
        .msh-theme .msh-card {
          background-color: var(--msh-bg-main);
          border: 1px solid var(--msh-separator);
        }
        
        .msh-theme .msh-section-bg {
          background-color: var(--msh-bg-card);
        }
      `}</style>

      {/* Header */}
      <header className="msh-header text-white py-4 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Machado Schutz</h1>
              <p className="text-sm opacity-90">Calculadora Previdenciária</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Site Atual
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="msh-section-bg py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--msh-text-primary)' }}>
            Descubra o Potencial de Crédito
          </h2>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 msh-text-primary">
            da Sua Empresa
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--msh-text-secondary)' }}>
            Faça sua pré-análise gratuita e estime oportunidades de recuperação de crédito 
            previdenciário de forma rápida e confiável.
          </p>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Seguro", desc: "Seus dados protegidos" },
            { icon: Clock, title: "Rápido", desc: "Resultado em segundos" },
            { icon: FileText, title: "PDF Completo", desc: "Diagnóstico detalhado" },
          ].map((feature, i) => (
            <Card key={i} className="msh-card text-center">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-full msh-bg-primary-light mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 msh-text-primary" />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--msh-text-primary)' }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--msh-text-secondary)' }}>
                  {feature.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Calculator Preview */}
      <section className="py-16 px-6" style={{ background: 'var(--msh-bg-main)' }}>
        <div className="max-w-2xl mx-auto">
          <Card className="msh-card shadow-xl border-t-4 msh-border-primary">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold" style={{ color: 'var(--msh-text-primary)' }}>
                Calculadora Previdenciária
              </CardTitle>
              <CardDescription style={{ color: 'var(--msh-text-secondary)' }}>
                Preencha os dados abaixo para estimar sua oportunidade de crédito
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 msh-text-primary font-medium">
                  <Building2 className="h-4 w-4" />
                  <span>Dados da Empresa</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label style={{ color: 'var(--msh-text-primary)' }}>CNPJ</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        placeholder="00.000.000/0001-00" 
                        className="flex-1"
                        style={{ borderColor: 'var(--msh-separator)' }}
                      />
                      <Button className="msh-btn-primary">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label style={{ color: 'var(--msh-text-primary)' }}>Razão Social</Label>
                    <Input 
                      placeholder="Nome da empresa" 
                      className="mt-1"
                      style={{ borderColor: 'var(--msh-separator)' }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: 'var(--msh-text-primary)' }}>Segmento</Label>
                      <Input 
                        placeholder="Ex: Comércio" 
                        className="mt-1"
                        style={{ borderColor: 'var(--msh-separator)' }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: 'var(--msh-text-primary)' }}>Enquadramento FPAS</Label>
                      <Input 
                        placeholder="515" 
                        className="mt-1"
                        style={{ borderColor: 'var(--msh-separator)' }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 flex items-center justify-between" style={{ background: 'var(--msh-bg-card)' }}>
                      <Label style={{ color: 'var(--msh-text-primary)' }}>Empresa Desonerada?</Label>
                      <Switch />
                    </Card>
                    <div>
                      <Label style={{ color: 'var(--msh-text-primary)' }}>Qtd. Colaboradores</Label>
                      <Input 
                        type="number" 
                        placeholder="10" 
                        className="mt-1"
                        style={{ borderColor: 'var(--msh-separator)' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator style={{ background: 'var(--msh-separator)' }} />

              {/* Contact Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 msh-text-primary font-medium">
                  <User className="h-4 w-4" />
                  <span>Dados para Contato</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label style={{ color: 'var(--msh-text-primary)' }}>Nome Completo</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--msh-text-secondary)' }} />
                      <Input 
                        placeholder="Seu nome" 
                        className="pl-10"
                        style={{ borderColor: 'var(--msh-separator)' }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: 'var(--msh-text-primary)' }}>E-mail</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--msh-text-secondary)' }} />
                        <Input 
                          placeholder="seu@email.com" 
                          className="pl-10"
                          style={{ borderColor: 'var(--msh-separator)' }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label style={{ color: 'var(--msh-text-primary)' }}>Telefone</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--msh-text-secondary)' }} />
                        <Input 
                          placeholder="(00) 00000-0000" 
                          className="pl-10"
                          style={{ borderColor: 'var(--msh-separator)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full msh-btn-primary py-6 text-lg font-semibold">
                <Calculator className="mr-2 h-5 w-5" />
                Calcular Crédito Estimado
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Result Preview */}
      <section className="msh-section-bg py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--msh-text-primary)' }}>
            Preview do Resultado
          </h3>
          
          <Card className="msh-card shadow-xl border-t-4 msh-border-primary">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full msh-bg-primary-light flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 msh-text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold" style={{ color: 'var(--msh-text-primary)' }}>
                Diagnóstico Previdenciário
              </CardTitle>
              <CardDescription style={{ color: 'var(--msh-text-secondary)' }}>
                Resultado da sua pré-análise de crédito
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Info */}
              <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--msh-bg-card)' }}>
                <div className="flex items-center gap-2 msh-text-primary font-medium">
                  <Building2 className="h-4 w-4" />
                  <span>Dados da Empresa</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span style={{ color: 'var(--msh-text-secondary)' }}>CNPJ:</span>
                    <span className="ml-2 font-medium" style={{ color: 'var(--msh-text-primary)' }}>00.000.000/0001-91</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--msh-text-secondary)' }}>Razão Social:</span>
                    <span className="ml-2 font-medium" style={{ color: 'var(--msh-text-primary)' }}>EMPRESA EXEMPLO LTDA</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--msh-text-secondary)' }}>Colaboradores:</span>
                    <span className="ml-2 font-medium" style={{ color: 'var(--msh-text-primary)' }}>50</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--msh-text-secondary)' }}>FPAS:</span>
                    <span className="ml-2 font-medium" style={{ color: 'var(--msh-text-primary)' }}>515</span>
                  </div>
                </div>
              </div>

              <Separator style={{ background: 'var(--msh-separator)' }} />

              {/* Calculation Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 msh-text-primary font-medium">
                  <Calculator className="h-4 w-4" />
                  <span>Resumo do Cálculo</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card className="msh-card">
                    <CardContent className="p-4">
                      <div className="text-sm" style={{ color: 'var(--msh-text-secondary)' }}>Base da Folha</div>
                      <div className="text-xl font-bold" style={{ color: 'var(--msh-text-primary)' }}>R$ 70.600,00</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="msh-card">
                    <CardContent className="p-4">
                      <div className="text-sm" style={{ color: 'var(--msh-text-secondary)' }}>Imposto Mensal</div>
                      <div className="text-xl font-bold" style={{ color: 'var(--msh-text-primary)' }}>R$ 5.295,00</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="msh-card">
                    <CardContent className="p-4">
                      <div className="text-sm" style={{ color: 'var(--msh-text-secondary)' }}>Total Projetado (65 meses)</div>
                      <div className="text-xl font-bold" style={{ color: 'var(--msh-text-primary)' }}>R$ 344.175,00</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="msh-bg-primary text-white">
                    <CardContent className="p-4">
                      <div className="text-sm opacity-90">Crédito Estimado Total</div>
                      <div className="text-2xl font-bold">R$ 68.835,00</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator style={{ background: 'var(--msh-separator)' }} />

              {/* Semáforo de Risco */}
              <div className="space-y-4">
                <div className="font-medium text-lg" style={{ color: 'var(--msh-text-primary)' }}>
                  Distribuição por Nível de Risco
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <Card className="text-center border-t-4" style={{ borderTopColor: '#22c55e' }}>
                    <CardContent className="p-4">
                      <div className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: '#dcfce7' }}>
                        <Shield className="h-5 w-5" style={{ color: '#22c55e' }} />
                      </div>
                      <div className="text-xs font-medium mb-1" style={{ color: '#22c55e' }}>Baixo Risco</div>
                      <div className="text-lg font-bold" style={{ color: 'var(--msh-text-primary)' }}>R$ 10.325,25</div>
                      <Badge variant="secondary" className="mt-1">15%</Badge>
                    </CardContent>
                  </Card>
                  
                  <Card className="text-center border-t-4" style={{ borderTopColor: '#eab308' }}>
                    <CardContent className="p-4">
                      <div className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: '#fef9c3' }}>
                        <Clock className="h-5 w-5" style={{ color: '#eab308' }} />
                      </div>
                      <div className="text-xs font-medium mb-1" style={{ color: '#eab308' }}>Médio Risco</div>
                      <div className="text-lg font-bold" style={{ color: 'var(--msh-text-primary)' }}>R$ 24.092,25</div>
                      <Badge variant="secondary" className="mt-1">35%</Badge>
                    </CardContent>
                  </Card>
                  
                  <Card className="text-center border-t-4" style={{ borderTopColor: '#ef4444' }}>
                    <CardContent className="p-4">
                      <div className="h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: '#fee2e2' }}>
                        <TrendingUp className="h-5 w-5" style={{ color: '#ef4444' }} />
                      </div>
                      <div className="text-xs font-medium mb-1" style={{ color: '#ef4444' }}>Alto Risco</div>
                      <div className="text-lg font-bold" style={{ color: 'var(--msh-text-primary)' }}>R$ 34.417,50</div>
                      <Badge variant="secondary" className="mt-1">50%</Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button variant="outline" className="flex-1" style={{ borderColor: 'var(--msh-primary)', color: 'var(--msh-primary)' }}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Nova Simulação
                </Button>
                <Button className="flex-1 msh-btn-primary">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF do Diagnóstico
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Color Palette Reference */}
      <section className="py-16 px-6" style={{ background: 'var(--msh-bg-main)' }}>
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--msh-text-primary)' }}>
            Paleta de Cores Aplicada
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="h-20 rounded-lg mb-2" style={{ background: '#1F5C4A' }}></div>
              <p className="font-medium" style={{ color: 'var(--msh-text-primary)' }}>Primária</p>
              <p className="text-sm" style={{ color: 'var(--msh-text-secondary)' }}>#1F5C4A</p>
            </div>
            <div className="text-center">
              <div className="h-20 rounded-lg mb-2" style={{ background: '#163F34' }}></div>
              <p className="font-medium" style={{ color: 'var(--msh-text-primary)' }}>Secundária</p>
              <p className="text-sm" style={{ color: 'var(--msh-text-secondary)' }}>#163F34</p>
            </div>
            <div className="text-center">
              <div className="h-20 rounded-lg mb-2" style={{ background: '#1C1C1C' }}></div>
              <p className="font-medium" style={{ color: 'var(--msh-text-primary)' }}>Texto</p>
              <p className="text-sm" style={{ color: 'var(--msh-text-secondary)' }}>#1C1C1C</p>
            </div>
            <div className="text-center">
              <div className="h-20 rounded-lg mb-2 border" style={{ background: '#F2F2F2', borderColor: 'var(--msh-separator)' }}></div>
              <p className="font-medium" style={{ color: 'var(--msh-text-primary)' }}>Background</p>
              <p className="text-sm" style={{ color: 'var(--msh-text-secondary)' }}>#F2F2F2</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="msh-header text-white py-6 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-medium">Machado Schutz Advogados e Associados - Calculadora Previdenciária V1</p>
          <p className="text-sm opacity-80 mt-2">
            Os cálculos apresentados têm caráter estimativo e não vinculante.
          </p>
        </div>
      </footer>
    </div>
  );
}
