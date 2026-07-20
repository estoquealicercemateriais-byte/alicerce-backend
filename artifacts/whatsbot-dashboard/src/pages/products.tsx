import { useState } from "react";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { Search, Plus, Edit, Trash2, ImageIcon, Tag } from "lucide-react";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useListProducts();

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Catálogo de Produtos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os produtos consultados pelo bot.
          </p>
        </div>
        <ProductFormDialog />
      </div>

      <div className="bg-card border rounded-lg shadow-sm flex flex-col">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[100px]">Cod.</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-center">Unidade</TableHead>
              <TableHead className="text-center">Oferta</TableHead>
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center p-8 text-muted-foreground"
                >
                  Carregando catálogo...
                </TableCell>
              </TableRow>
            ) : filteredProducts?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center p-8 text-muted-foreground"
                >
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {product.id.toString().padStart(4, "0")}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {product.imageUrl && (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {product.name}
                      {product.isOffer && (
                        <Badge variant="default" className="bg-primary text-xs">
                          <Tag className="h-3 w-3 mr-1" /> OFERTA
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-semibold uppercase">
                      {product.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    {formatCurrency(product.price)}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm">
                    {product.unit}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.isOffer ? (
                      <Badge variant="default" className="bg-primary">Oferta</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.inStock ? (
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                    ) : (
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <ProductFormDialog product={product} />
                      <DeleteProductButton
                        id={product.id}
                        name={product.name}
                      />
                    </div>
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

function ProductFormDialog({ product }: { product?: any }) {
  const [open, setOpen] = useState(false);
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "",
    price: product?.price?.toString() || "",
    unit: product?.unit || "un",
    description: product?.description || "",
    imageUrl: product?.imageUrl || "",
    isOffer: product?.isOffer ?? false,
    inStock: product?.inStock ?? true,
  });

  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      imageUrl: formData.imageUrl.trim() || undefined,
      price: parseFloat(formData.price.replace(",", ".")) || 0,
    };

    if (isEditing) {
      updateProduct.mutate(
        { id: product.id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListProductsQueryKey(),
            });
            setOpen(false);
          },
        },
      );
    } else {
      createProduct.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListProductsQueryKey(),
            });
            setOpen(false);
            setFormData({
              name: "",
              category: "",
              price: "",
              unit: "un",
              description: "",
              imageUrl: "",
              isOffer: false,
              inStock: true,
            });
          },
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Novo Produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Produto" : "Adicionar Novo Produto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Nome do Produto</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Cimento CP II 50kg"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="Ex: Básico"
              />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <div className="flex items-center justify-between border rounded-md p-2 px-3 h-10">
                <Label className="cursor-pointer font-normal">
                  Disponível em Estoque
                </Label>
                <Switch
                  checked={formData.inStock}
                  onCheckedChange={(c) =>
                    setFormData({ ...formData, inStock: c })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                required
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="35.90"
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input
                required
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                placeholder="Ex: un, kg, m, saco"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Descrição (Opcional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Detalhes que o bot pode usar para responder clientes..."
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>URL da Imagem da Oferta</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://exemplo.com/imagem-produto.jpg"
              />
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="mt-2 h-24 w-24 object-cover rounded border"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>
            <div className="space-y-2 col-span-2 flex items-center justify-between border rounded-md p-3">
              <div>
                <Label className="cursor-pointer font-medium">Marcar como Oferta</Label>
                <p className="text-xs text-muted-foreground">
                  Ofertas aparecem no catálogo do bot com imagem e preço.
                </p>
              </div>
              <Switch
                checked={formData.isOffer}
                onCheckedChange={(c) => setFormData({ ...formData, isOffer: c })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {isEditing ? "Salvar Alterações" : "Adicionar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProductButton({ id, name }: { id: number; name: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const deleteProduct = useDeleteProduct();

  const handleDelete = () => {
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey(),
          });
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Produto</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            Tem certeza que deseja excluir <strong>{name}</strong>?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Esta ação não pode ser desfeita. O bot não poderá mais oferecer este
            produto.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
          >
            Sim, excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
