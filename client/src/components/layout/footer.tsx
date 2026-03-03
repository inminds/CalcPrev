import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { tx } = useI18n();

  return (
    <footer className="bg-primary py-3 mt-auto" data-testid="footer">
      <div className="mx-auto w-full max-w-6xl px-4 text-primary-foreground">
        <div className="text-[11px] text-primary-foreground/70 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <span>
            {tx(
              "\u00A9 Machado Schutz Advogados e Associados | Calculadora Previdenciaria",
              "\u00A9 Machado Schutz Attorneys | Social Security Calculator",
            )}
          </span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a
              className="hover:text-primary-foreground text-primary-foreground/75"
              href="https://msh.adv.br/politica-de-privacidade/"
              target="_blank"
              rel="noreferrer"
              data-testid="link-privacy"
            >
              {tx("Privacidade", "Privacy")}
            </a>
            <a
              className="hover:text-primary-foreground text-primary-foreground/75"
              href="https://msh.adv.br/politica-de-cookies/"
              target="_blank"
              rel="noreferrer"
              data-testid="link-cookies"
            >
              Cookies
            </a>
            <a
              className="hover:text-primary-foreground text-primary-foreground/75"
              href="https://msh.adv.br/contato/"
              target="_blank"
              rel="noreferrer"
              data-testid="link-contact"
            >
              {tx("Contato", "Contact")}
            </a>
          </div>
          <span className="text-primary-foreground/50">
            <a
              href="https://inminds.com.br"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary-foreground transition-colors"
            >
              InMinds Technology
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
