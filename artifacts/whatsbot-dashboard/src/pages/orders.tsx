import { useState } from "react";
import {
  useListOrders,
  useUpdateOrderStatus,
  getListOrdersQueryKey,
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
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { OrderStatus } from "@workspace/api-client-react";
import { Eye, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const { data: orders, isLoading } = useListOrders(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Pedidos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerenciamento de pedidos recebidos via WhatsApp.
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
              <SelectItem value="all">Todos os Pedidos</SelectItem>
              <SelectItem value={OrderStatus.pending}>Pendentes</SelectItem>
              <SelectItem value={OrderStatus.confirmed}>Confirmados</SelectItem>
              <SelectItem value={OrderStatus.delivered}>Entregues</SelectItem>
              <SelectItem value={OrderStatus.cancelled}>Cancelados</SelectItem>
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
              <TableHead>Total</TableHead>
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
                  Carregando pedidos...
                </TableCell>
              </TableRow>
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center p-8 text-muted-foreground"
                >
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs font-bold text-muted-foreground">
                    #{order.id.toString().padStart(4, "0")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {order.customerName || "-"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {formatPhone(order.whatsappNumber)}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <OrderDialog order={order} />
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

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  switch (status) {
    case OrderStatus.pending:
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <Clock className="mr-1 h-3 w-3" /> Pendente
        </Badge>
      );
    case OrderStatus.confirmed:
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmado
        </Badge>
      );
    case OrderStatus.delivered:
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <Truck className="mr-1 h-3 w-3" /> Entregue
        </Badge>
      );
    case OrderStatus.cancelled:
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="mr-1 h-3 w-3" /> Cancelado
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}

function OrderDialog({ order }: { order: any }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = (status: OrderStatus) => {
    updateStatus.mutate(
      { id: order.id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
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
            <span>Pedido #{order.id.toString().padStart(4, "0")}</span>
            <OrderStatusBadge status={order.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 my-4">
          <div className="space-y-1 bg-muted/30 p-3 rounded-md border">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              Cliente
            </p>
            <p className="font-medium">
              {order.customerName || "Não informado"}
            </p>
            <p className="text-sm font-mono text-muted-foreground">
              {formatPhone(order.whatsappNumber)}
            </p>
          </div>
          <div className="space-y-1 bg-muted/30 p-3 rounded-md border">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
              Resumo
            </p>
            <p className="text-sm">Data: {formatDate(order.createdAt)}</p>
            <p className="font-bold text-lg text-primary">
              {formatCurrency(order.total)}
            </p>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Preço Un.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.productName}
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </TableCell>
                </TableRow>
              ))}
              {!order.items?.length && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-4"
                  >
                    Sem itens detalhados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {order.notes && (
          <div className="mt-4 p-4 bg-yellow-50/50 border border-yellow-100 rounded-md">
            <p className="text-xs text-yellow-800 font-bold uppercase mb-1">
              Observações do Cliente
            </p>
            <p className="text-sm text-yellow-900">{order.notes}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t">
          <p className="w-full text-sm font-semibold mb-2">Alterar Status:</p>
          <Button
            variant="outline"
            className="flex-1 bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
            disabled={
              order.status === OrderStatus.pending || updateStatus.isPending
            }
            onClick={() => handleStatusChange(OrderStatus.pending)}
          >
            Pendente
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
            disabled={
              order.status === OrderStatus.confirmed || updateStatus.isPending
            }
            onClick={() => handleStatusChange(OrderStatus.confirmed)}
          >
            Confirmar
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-green-50 hover:bg-green-100 border-green-200"
            disabled={
              order.status === OrderStatus.delivered || updateStatus.isPending
            }
            onClick={() => handleStatusChange(OrderStatus.delivered)}
          >
            Entregue
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
            disabled={
              order.status === OrderStatus.cancelled || updateStatus.isPending
            }
            onClick={() => handleStatusChange(OrderStatus.cancelled)}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
