import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, type AppLanguage } from "@/lib/i18n";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { language, setLanguage } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          data-testid="button-language-switcher"
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">
            {language === "pt-BR" ? "Trocar idioma" : "Change language"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLanguage("pt-BR")}
          data-testid="option-pt-br"
          className={language === "pt-BR" ? "font-semibold" : ""}
        >
          Portugues (Brasil)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("en-US")}
          data-testid="option-en-us"
          className={language === "en-US" ? "font-semibold" : ""}
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
