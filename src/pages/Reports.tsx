import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Download, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { useProductStore } from "@/lib/productStore";
import { useOperationHistory } from "@/hooks/useOperationHistory";
import { toast } from "@/hooks/use-toast";

export default function Reports() {
  const { products } = useProductStore();
  const { operations, formatTimestamp, getOperationIcon, getOperationColor } = useOperationHistory();
  
  // Calculate real statistics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => p.stock < 50 && p.stock > 0).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  
  const handleDateSelect = () => {
    toast({
      title: "Tarix seçimi",
      description: "Tarix seçimi funksiyası tezliklə əlavə ediləcək",
    });
  };

  const handleExport = () => {
    toast({
      title: "İxrac edilir",
      description: "Hesabat məlumatları export edilir...",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Hesabatlar</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDateSelect}>
            <Calendar className="mr-2 h-4 w-4" />
            Tarix seç
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            İxrac et
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ümumi Məhsul</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Fərqli məhsul növü
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İşarələnmiş</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              Aktiv məhsullar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Az Qalan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Diqqət tələb edir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qalan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">
              Anbarda qalan məhsul
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Məhsul Statusu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Aktiv</span>
                <span className="font-medium">{activeProducts} ədəd</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-success h-2 rounded-full" 
                  style={{ width: `${totalProducts > 0 ? (activeProducts / totalProducts) * 100 : 0}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Az qalan</span>
                <span className="font-medium">{lowStockProducts} ədəd</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-warning h-2 rounded-full" 
                  style={{ width: `${totalProducts > 0 ? (lowStockProducts / totalProducts) * 100 : 0}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Bitib</span>
                <span className="font-medium">{outOfStockProducts} ədəd</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-destructive h-2 rounded-full" 
                  style={{ width: `${totalProducts > 0 ? (outOfStockProducts / totalProducts) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Əməliyyatlar</CardTitle>
          </CardHeader>
          <CardContent>
            {operations.length > 0 ? (
              <div className="space-y-3">
                {operations.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">
                        {getOperationIcon(operation.type)} {operation.productName} - {operation.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTimestamp(operation.timestamp)}
                      </p>
                    </div>
                    <span className={`font-medium ${getOperationColor(operation.type)}`}>
                      {operation.quantity} ədəd
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Hələ ki heç bir əməliyyat yoxdur</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}