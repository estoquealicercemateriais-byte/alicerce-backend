import { useState, useEffect } from "react";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Store, Webhook, BotMessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    storeName: "",
    address: "",
    phone: "",
    whatsappNumber: "",
    openingHours: "",
    evolutionApiUrl: "",
    evolutionApiKey: "",
    evolutionInstance: "",
    botWelcomeMessage: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        storeName: settings.storeName || "",
        address: settings.address || "",
        phone: settings.phone || "",
        whatsappNumber: settings.whatsappNumber || "",
        openingHours: settings.openingHours || "",
        evolutionApiUrl: settings.evolutionApiUrl || "",
        evolutionApiKey: settings.evolutionApiKey || "",
        evolutionInstance: settings.evolutionInstance || "",
        botWelcomeMessage: settings.botWelcomeMessage || "",
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(
      { data: formData },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({
            title: "Configurações salvas",
            description: "As configurações foram atualizadas com sucesso.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erro ao salvar",
            description: "Não foi possível atualizar as configurações.",
          });
        },
      },
    );
  };

  if (isLoading)
    return (
      <div className="p-8">
        <div className="animate-pulse h-8 w-64 bg-muted rounded mb-8"></div>
      </div>
    );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as informações da loja e as credenciais do bot.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>Dados da Loja</CardTitle>
            </div>
            <CardDescription>
              Informações utilizadas pelo bot para responder clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nome da Loja</Label>
              <Input
                required
                value={formData.storeName}
                onChange={(e) =>
                  setFormData({ ...formData, storeName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ / Telefone Fixo</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço Completo</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Rua, Número, Bairro, Cidade - Estado"
              />
            </div>
            <div className="space-y-2">
              <Label>Número do WhatsApp</Label>
              <Input
                value={formData.whatsappNumber}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappNumber: e.target.value })
                }
                placeholder="Ex: 5511999999999"
              />
            </div>
            <div className="space-y-2">
              <Label>Horário de Funcionamento</Label>
              <Input
                value={formData.openingHours}
                onChange={(e) =>
                  setFormData({ ...formData, openingHours: e.target.value })
                }
                placeholder="Seg a Sex 08:00 às 18:00, Sáb 08:00 às 12:00"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <BotMessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Comportamento do Bot</CardTitle>
            </div>
            <CardDescription>
              Configure como o bot interage inicialmente com os clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label>Mensagem de Boas-vindas</Label>
              <Textarea
                className="min-h-[100px] font-mono text-sm"
                value={formData.botWelcomeMessage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    botWelcomeMessage: e.target.value,
                  })
                }
                placeholder="Olá! Sou o assistente virtual da Alicerce..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Esta mensagem será enviada sempre que um cliente iniciar uma
                nova conversa.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 shadow-sm">
          <CardHeader className="border-b bg-red-50/50">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">
                Integração Evolution API
              </CardTitle>
            </div>
            <CardDescription className="text-red-700/80">
              Credenciais para conexão com o WhatsApp. Altere com cuidado.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-red-50/20">
            <div className="space-y-2 md:col-span-2">
              <Label>URL da API</Label>
              <Input
                type="url"
                value={formData.evolutionApiUrl}
                disabled
                placeholder="https://evolution.sua-api.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome da Instância</Label>
              <Input
                value={formData.evolutionInstance}
                disabled
                placeholder="alicerce-principal"
              />
            </div>
            <div className="space-y-2">
              <Label>Global API Key</Label>
              <Input
                type="password"
                value={formData.evolutionApiKey}
                disabled
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={updateSettings.isPending}
            className="font-bold px-8"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
