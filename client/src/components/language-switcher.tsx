import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n, type AppLanguage } from "@/lib/i18n";

type LanguageSwitcherProps = {
  placement?: "floating" | "inline";
};

export function LanguageSwitcher({ placement = "floating" }: LanguageSwitcherProps) {
  const { language, setLanguage, tx } = useI18n();

  const isFloating = placement === "floating";

  return (
    <div className={isFloating ? "fixed right-4 top-4 z-50" : "w-full"} data-testid="language-switcher">
      <div
        className={`flex items-center gap-2 rounded-lg border border-primary-foreground/20 px-2 py-1 ${
          isFloating ? "bg-white/95 shadow-sm backdrop-blur" : "bg-primary-foreground/10"
        }`}
      >
        <Globe className={`h-4 w-4 ${isFloating ? "text-muted-foreground" : "text-primary-foreground/80"}`} />
        <Select value={language} onValueChange={(value) => setLanguage(value as AppLanguage)}>
          <SelectTrigger
            className={`border-none bg-transparent shadow-none focus:ring-0 ${
              isFloating ? "w-[150px] text-foreground" : "w-full text-primary-foreground"
            }`}
            data-testid="select-language"
          >
            <SelectValue placeholder={tx("Idioma", "Language")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt-BR" data-testid="option-pt-br">{tx("Portugues (Brasil)", "Portuguese (Brazil)")}</SelectItem>
            <SelectItem value="en-US" data-testid="option-en-us">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
