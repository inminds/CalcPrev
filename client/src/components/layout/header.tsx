import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const { tx } = useI18n();

  return (
    <header className="bg-primary shadow-lg sticky top-0 z-50" data-testid="header">
      <div className="mx-auto w-full max-w-6xl px-4 h-16 flex items-center justify-between">

        {/* Marca clicável */}
        <a
          href="https://msh.adv.br"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <div className="h-10 w-10 rounded-md bg-white/10 flex items-center justify-center overflow-hidden">
            <img
              src="/logo-light.png"
              alt="Machado Schutz"
              className="h-8 w-8 object-contain"
            />
          </div>

          <div className="leading-tight">
            <h1 className="font-semibold text-base text-primary-foreground">
              Machado Schutz
            </h1>
            <p className="text-primary-foreground/80 text-xs">
              {tx("Calculadora Previdenciária", "Social Security Calculator")}
            </p>
          </div>
        </a>

        {/* Controles à direita */}
        <div className="flex items-center gap-1">
          <LanguageSwitcher className="text-primary-foreground hover:bg-white/10" />
          <ThemeToggle className="text-primary-foreground hover:bg-white/10" />
        </div>

      </div>
    </header>
  );
}