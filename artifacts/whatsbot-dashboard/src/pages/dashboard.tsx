import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Bot,
  UserSquare2,
  ShoppingCart,
  FileText,
  PackageSearch,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { Link } from "wouter";
import { ConversationStatus } from "@workspace/api-client-react";

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Total de Conversas",
      value: stats.totalConversations,
      icon: MessageSquare,
      color: "text-blue-500",
    },
    {
      label: "Bot Ativo",
      value: stats.activeBot,
      icon: Bot,
      color: "text-green-500",
    },
    {
      label: "Aguardando Humano",
      value: stats.awaitingHuman,
      icon: UserSquare2,
      color: "text-orange-500",
      highlight: stats.awaitingHuman > 0,
    },
    {
      label: "Pedidos Pendentes",
      value: stats.pendingOrders,
      icon: ShoppingCart,
      color: "text-purple-500",
      highlight: stats.pendingOrders > 0,
    },
    {
      label: "Orçamentos Pendentes",
      value: stats.pendingBudgets,
      icon: FileText,
      color: "text-yellow-500",
      highlight: stats.pendingBudgets > 0,
    },
    {
      label: "Produtos Catálogo",
      value: stats.totalProducts,
      icon: PackageSearch,
      color: "text-slate-500",
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Painel de Controle
        </h1>
        <p className="text-muted-foreground mt-2">
          Resumo das operações e estado do atendimento.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={i}
              className={
                stat.highlight
                  ? "border-primary/50 shadow-md ring-1 ring-primary/20"
                  : ""
              }
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-4 bg-muted/50 rounded-full ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-xl">Conversas Recentes</CardTitle>
          <Link
            href="/conversations"
            className="text-sm text-primary font-semibold hover:underline"
          >
            Ver todas
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {stats.recentConversations?.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center text-secondary-foreground font-bold border">
                    {conv.customerName
                      ? conv.customerName.substring(0, 2).toUpperCase()
                      : "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {conv.customerName || conv.whatsappNumber}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-md">
                      {conv.lastMessage || "Nenhuma mensagem"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conv.updatedAt)}
                    </p>
                    <div className="mt-1">
                      {conv.status === ConversationStatus.bot && (
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-slate-700"
                        >
                          Bot Ativo
                        </Badge>
                      )}
                      {conv.status === ConversationStatus.human && (
                        <Badge className="bg-primary text-primary-foreground">
                          Aguardando Humano
                        </Badge>
                      )}
                      {conv.status === ConversationStatus.closed && (
                        <Badge variant="outline">Encerrado</Badge>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/conversations?id=${conv.id}`}
                    className="text-muted-foreground hover:text-primary p-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
            {(!stats.recentConversations ||
              stats.recentConversations.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma conversa recente encontrada.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
