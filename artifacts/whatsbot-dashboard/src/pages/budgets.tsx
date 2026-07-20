import { useState } from "react";
import {
  useListBudgetRequests,
  useUpdateBudgetRequest,
  getListBudgetRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatPhone } from "@/lib/format";
import { BudgetRequestStatus } from "@workspace/api-client-react";
import { Eye, FileText, CheckCircle2, Clock } from "lucide-react";

export default function BudgetsPage() {
  const [statusFilter, setStatusFilter] = useState<BudgetRequestStatus | "all">(
    "all",
  );
  const { data: budgets, isLoading } = useListBudgetRequests(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Orçamentos
          </h1>
          <p className="text-muted-foreground mt-2">
            Lista de materiais solicitados pelos clientes.
          </p>
        </div>
        <div className="w-full sm:w-64 bg-background rounded-md shadow-sm border">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
          >
            <SelectTrigger className="border-0 focus:ring-0">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Orçamentos</SelectItem>
              <SelectItem value={BudgetRequestStatus.pending}>
                Pendentes
              </SelectItem>
              <SelectItem value={BudgetRequestStatus.attended}>
                Em Atendimento
              </SelectItem>
              <SelectItem value={BudgetRequestStatus.closed}>
                Finalizados
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Descrição Curta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center p-8 text-muted-foreground"
                >
                  Carregando orçamentos...
                </TableCell>
              </TableRow>
            ) : budgets?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center p-8 text-muted-foreground"
                >
                  Nenhum orçamento encontrado.
                </TableCell>
              </TableRow>
            ) : (
              budgets?.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                    #{budget.id.toString().padStart(4, "0")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(budget.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {budget.customerName || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {formatPhone(budget.whatsappNumber)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm">
                    {budget.description}
                  </TableCell>
                  <TableCell>
                    <BudgetStatusBadge status={budget.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <BudgetDialog budget={budget} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BudgetStatusBadge({ status }: { status: BudgetRequestStatus }) {
  switch (status) {
    case BudgetRequestStatus.pending:
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <Clock className="mr-1 h-3 w-3" /> Pendente
        </Badge>
      );
    case BudgetRequestStatus.attended:
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <FileText className="mr-1 h-3 w-3" /> Em Atendimento
        </Badge>
      );
    case BudgetRequestStatus.closed:
      return (
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-700 border-slate-200"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" /> Finalizado
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

function BudgetDialog({ budget }: { budget: any }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(budget.notes || "");
  const queryClient = useQueryClient();
  const updateBudget = useUpdateBudgetRequest();

  const handleUpdate = (status?: BudgetRequestStatus) => {
    updateBudget.mutate(
      { id: budget.id, data: { status, notes } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListBudgetRequestsQueryKey(),
          });
          if (status) setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center pr-8">
            <span>Orçamento #{budget.id.toString().padStart(4, "0")}</span>
            <BudgetStatusBadge status={budget.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 my-4">
          <div className="space-y-1 bg-muted/30 p-3 rounded-md border">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              Cliente
            </p>
            <p className="font-medium">
              {budget.customerName || "Não informado"}
            </p>
            <p className="text-sm font-mono text-muted-foreground">
              {formatPhone(budget.whatsappNumber)}
            </p>
          </div>
          <div className="space-y-1 bg-muted/30 p-3 rounded-md border">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              Solicitado em
            </p>
            <p className="text-sm">{formatDate(budget.createdAt)}</p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <p className="text-sm font-semibold">Materiais Solicitados:</p>
          <div className="p-4 bg-muted/50 rounded-md border font-mono text-sm whitespace-pre-wrap leading-relaxed">
            {budget.description}
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <p className="text-sm font-semibold text-primary">Notas Internas:</p>
          <Textarea
            placeholder="Anotações sobre preços, disponibilidade, etc (visível apenas para equipe)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px] border-primary/20 bg-primary/5 focus-visible:ring-primary/50"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleUpdate()}
              disabled={updateBudget.isPending || notes === budget.notes}
            >
              Salvar Notas
            </Button>
          </div>
        </div>

        <div className="mt-6 flex gap-3 pt-4 border-t">
          <Button
            className="flex-1"
            variant="outline"
            disabled={
              budget.status === BudgetRequestStatus.attended ||
              updateBudget.isPending
            }
            onClick={() => handleUpdate(BudgetRequestStatus.attended)}
          >
            Marcar Em Atendimento
          </Button>
          <Button
            className="flex-1"
            disabled={
              budget.status === BudgetRequestStatus.closed ||
              updateBudget.isPending
            }
            onClick={() => handleUpdate(BudgetRequestStatus.closed)}
          >
            Finalizar Orçamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
