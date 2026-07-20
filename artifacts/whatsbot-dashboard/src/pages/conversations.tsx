import { useState, useRef, useEffect } from "react";
import {
  useListConversations,
  useGetConversation,
  useSendMessage,
  useUpdateConversationStatus,
  useMarkConversationRead,
  getGetConversationQueryKey,
  getListConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, formatPhone } from "@/lib/format";
import {
  Search,
  Send,
  UserSquare2,
  Bot,
  CheckSquare,
  Clock,
  MessageSquare,
} from "lucide-react";
import {
  ConversationStatus,
  MessageDirection,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";

export default function ConversationsPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialId = searchParams.get("id")
    ? parseInt(searchParams.get("id")!)
    : null;

  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  const [filter, setFilter] = useState<ConversationStatus | "">("");
  const [search, setSearch] = useState("");

  const { data: conversations, isLoading } = useListConversations(
    filter ? { status: filter as any } : undefined,
  );

  const filteredConversations = conversations?.filter(
    (c) =>
      search === "" ||
      c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      c.whatsappNumber.includes(search),
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* List Sidebar */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col min-h-0 border-r bg-background ${selectedId ? "hidden md:flex" : "flex"}`}
      >
        <div className="p-4 border-b space-y-4">
          <h2 className="text-xl font-bold">Conversas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar número ou nome..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Badge
              variant={filter === "" ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setFilter("")}
            >
              Todas
            </Badge>
            <Badge
              variant={
                filter === ConversationStatus.human ? "default" : "outline"
              }
              className={`cursor-pointer whitespace-nowrap ${filter === ConversationStatus.human ? "" : "text-orange-600 border-orange-200"}`}
              onClick={() => setFilter(ConversationStatus.human)}
            >
              Humano
            </Badge>
            <Badge
              variant={
                filter === ConversationStatus.bot ? "default" : "outline"
              }
              className="cursor-pointer whitespace-nowrap text-blue-600 border-blue-200"
              onClick={() => setFilter(ConversationStatus.bot)}
            >
              Bot
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-muted animate-pulse rounded-md"
                />
              ))}
            </div>
          ) : filteredConversations?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhuma conversa encontrada.
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations?.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedId === conv.id ? "bg-muted border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm truncate pr-2">
                      {conv.customerName || formatPhone(conv.whatsappNumber)}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(conv.updatedAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    {conv.lastMessage || "..."}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    {conv.status === ConversationStatus.bot && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Bot className="h-3 w-3" /> Bot
                      </span>
                    )}
                    {conv.status === ConversationStatus.human && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 flex items-center gap-1">
                        <UserSquare2 className="h-3 w-3" /> Humano
                      </span>
                    )}
                    {conv.status === ConversationStatus.closed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" /> Encerrado
                      </span>
                    )}

                    {(conv.unreadCount ?? 0) > 0 && (
                      <span className="h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Pane */}
      <div
        className={`flex-1 min-h-0 bg-muted/10 flex flex-col ${!selectedId ? "hidden md:flex" : "flex"}`}
      >
        {selectedId ? (
          <ConversationDetail
            id={selectedId}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <p>Selecione uma conversa para visualizar</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationDetail({
  id,
  onBack,
}: {
  id: number;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: conv, isLoading } = useGetConversation(id, {
    query: {
      enabled: !!id,
      queryKey: getGetConversationQueryKey(id),
      refetchInterval: 5000,
    },
  });

  const sendMessage = useSendMessage();
  const updateStatus = useUpdateConversationStatus();
  const markRead = useMarkConversationRead();

  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conv?.messages]);

  useEffect(() => {
    if (id && (conv?.unreadCount ?? 0) > 0) {
      markRead.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListConversationsQueryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: getGetConversationQueryKey(id),
            });
          },
        },
      );
    }
  }, [id, conv?.unreadCount, markRead, queryClient]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessage.mutate(
      { id, data: { content: message } },
      {
        onSuccess: () => {
          setMessage("");
          queryClient.invalidateQueries({
            queryKey: getGetConversationQueryKey(id),
          });
          queryClient.invalidateQueries({
            queryKey: getListConversationsQueryKey(),
          });
        },
      },
    );
  };

  const handleStatusChange = (status: ConversationStatus) => {
    updateStatus.mutate(
      { id, data: { status: status as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetConversationQueryKey(id),
          });
          queryClient.invalidateQueries({
            queryKey: getListConversationsQueryKey(),
          });
        },
      },
    );
  };

  if (isLoading || !conv) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-16 border-b bg-background flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2 -ml-2" onClick={onBack}>
            <span className="sr-only">Voltar</span>
            &larr;
          </button>
          <div>
            <h3 className="font-bold text-lg leading-tight">
              {conv.customerName || formatPhone(conv.whatsappNumber)}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              {formatPhone(conv.whatsappNumber)}
            </p>
          </div>
        </div>
        <div className="flex bg-muted rounded-md p-1">
          <button
            onClick={() => handleStatusChange(ConversationStatus.bot)}
            className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors flex items-center gap-1 ${conv.status === ConversationStatus.bot ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Bot className="h-3 w-3" /> Bot
          </button>
          <button
            onClick={() => handleStatusChange(ConversationStatus.human)}
            className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors flex items-center gap-1 ${conv.status === ConversationStatus.human ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <UserSquare2 className="h-3 w-3" /> Humano
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {conv.messages?.map((msg, idx) => {
          const isOutbound = msg.direction === MessageDirection.outbound;
          const showTime =
            idx === 0 ||
            new Date(msg.createdAt).getTime() -
              new Date(conv.messages[idx - 1].createdAt).getTime() >
              300000; // 5 min gap

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
            >
              {showTime && (
                <div className="text-[10px] text-muted-foreground font-medium mb-2 my-1 bg-muted/50 px-2 py-1 rounded-full self-center">
                  {formatDate(msg.createdAt)}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm ${
                  isOutbound
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-card border text-card-foreground rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap font-mono leading-relaxed">
                  {msg.content}
                </div>
                <div
                  className={`text-[10px] mt-1 text-right opacity-70 ${isOutbound ? "text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        {conv.messages?.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm opacity-50">
            Nenhuma mensagem registrada
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-background border-t">
        {conv.status === ConversationStatus.bot ? (
          <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span>O Bot está no controle desta conversa.</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-white"
              onClick={() => handleStatusChange(ConversationStatus.human)}
            >
              Assumir
            </Button>
          </div>
        ) : conv.status === ConversationStatus.closed ? (
          <div className="bg-slate-50 text-slate-600 text-sm p-3 rounded-md border border-slate-200 text-center font-medium">
            Esta conversa está encerrada.
            <Button
              size="sm"
              variant="link"
              onClick={() => handleStatusChange(ConversationStatus.human)}
            >
              Reabrir
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 font-mono text-sm"
              disabled={sendMessage.isPending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessage.isPending}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
