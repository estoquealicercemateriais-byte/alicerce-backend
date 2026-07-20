import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Página não encontrada</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Button asChild>
        <Link href="/dashboard">Voltar para o Painel</Link>
      </Button>
    </div>
  );
}
