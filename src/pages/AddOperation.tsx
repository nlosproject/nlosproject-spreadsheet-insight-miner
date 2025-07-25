import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Save, Check, ChevronsUpDown, X, Download } from "lucide-react";
import { useProductStore } from "@/lib/productStore";
import { usePackagingStore } from "@/lib/packagingStore";
import { useWarehouseStore } from "@/lib/warehouseStore";
import { useOperationHistory } from "@/hooks/useOperationHistory";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

type ProductEntry = {
  productId: string;
  packaging: {type: string, count: number}[];
};

export default function AddOperation() {
  const { products } = useProductStore();
  const { packagingOptions, addPackagingOption } = usePackagingStore();
  const { warehouses } = useWarehouseStore();
  const { addOperation } = useOperationHistory();
  const [operationType, setOperationType] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedDestinationWarehouse, setSelectedDestinationWarehouse] = useState("");
  const [batchName, setBatchName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<ProductEntry[]>([]);
  const [currentProduct, setCurrentProduct] = useState("");
  const [currentPackaging, setCurrentPackaging] = useState<{type: string, count: number}[]>([]);
  const [notes, setNotes] = useState("");
  const [packagingOpen, setPackagingOpen] = useState(false);
  const [customPackaging, setCustomPackaging] = useState("");
  const [currentPackagingType, setCurrentPackagingType] = useState("");
  const [currentPackageCount, setCurrentPackageCount] = useState("");

  const getCurrentProductTotalQuantity = () => {
    return currentPackaging.reduce((total, item) => {
      const packagingSize = parseInt(item.type.split(/[+()]/)[0]);
      if (isNaN(packagingSize) || isNaN(item.count)) return total;
      return total + (packagingSize * item.count);
    }, 0);
  };

  const getProductTotalQuantity = (packaging: {type: string, count: number}[]) => {
    return packaging.reduce((total, item) => {
      const packagingSize = parseInt(item.type.split(/[+()]/)[0]);
      if (isNaN(packagingSize) || isNaN(item.count)) return total;
      return total + (packagingSize * item.count);
    }, 0);
  };

  const handleAddPackaging = () => {
    if (currentPackagingType && currentPackageCount) {
      const countNum = parseInt(currentPackageCount);
      if (!isNaN(countNum) && countNum > 0) {
        setCurrentPackaging(prev => [...prev, { type: currentPackagingType, count: countNum }]);
        setCurrentPackagingType("");
        setCurrentPackageCount("");
        setPackagingOpen(false);
      }
    }
  };

  const handleRemovePackaging = (index: number) => {
    setCurrentPackaging(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomPackaging = () => {
    if (customPackaging.trim() && !packagingOptions.includes(customPackaging.trim())) {
      addPackagingOption(customPackaging.trim());
      setCurrentPackagingType(customPackaging.trim());
      setCustomPackaging("");
    }
  };

  const handleAddProduct = () => {
    if (currentProduct && currentPackaging.length > 0) {
      setSelectedProducts(prev => [...prev, {
        productId: currentProduct,
        packaging: [...currentPackaging]
      }]);
      // Reset only packaging, keep product selection for easy adding of more packaging
      setCurrentPackaging([]);
      setCurrentPackagingType("");
      setCurrentPackageCount("");
    }
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.article})` : "";
  };

  const generateOperationPDF = (operationTitle: string, operationDate: string, productName: string, quantity: number) => {
    const doc = new jsPDF();
    
    // PDF başlığı
    doc.setFontSize(20);
    doc.text('Əməliyyat Qaimə', 20, 30);
    
    // Əməliyyat məlumatları
    doc.setFontSize(12);
    doc.text(`Əməliyyat: ${operationTitle}`, 20, 50);
    doc.text(`Tarix: ${operationDate}`, 20, 65);
    
    // Məhsul məlumatları
    doc.setFontSize(14);
    doc.text('Məhsul Məlumatları:', 20, 85);
    doc.setFontSize(12);
    doc.text(`Məhsul: ${productName}`, 20, 100);
    doc.text(`Miqdar: ${quantity}`, 20, 115);
    
    return doc;
  };

  const handleDownloadPDF = (operationTitle: string, operationDate: string, productName: string, quantity: number) => {
    const doc = generateOperationPDF(operationTitle, operationDate, productName, quantity);
    doc.save(`${operationTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  };

  const handlePrint = (operationTitle: string, operationDate: string, productName: string, quantity: number) => {
    const doc = generateOperationPDF(operationTitle, operationDate, productName, quantity);
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(url);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        URL.revokeObjectURL(url);
      };
    }
  };

  const handleSaveOperation = () => {
    if (!operationType || selectedProducts.length === 0) {
      toast({
        title: "Natamam məlumat",
        description: "Əməliyyat növü və ən azı bir məhsul seçilməlidir",
        variant: "destructive",
      });
      return;
    }

    // Add operations to history for each product
    selectedProducts.forEach(productEntry => {
      const product = products.find(p => p.id === productEntry.productId);
      if (product) {
        const totalQuantity = getProductTotalQuantity(productEntry.packaging);
        addOperation({
          type: operationType as 'daxil' | 'xaric' | 'satış' | 'transfer',
          productName: product.name,
          quantity: totalQuantity,
          warehouse: selectedWarehouse || 'Anbar 1'
        });
      }
    });

    toast({
      title: "Əməliyyat saxlanıldı",
      description: `${operationType} əməliyyatı uğurla saxlanıldı və tarixçəyə əlavə edildi`,
    });

    // Clear form after save
    setSelectedProducts([]);
    setCurrentProduct("");
    setCurrentPackaging([]);
    setNotes("");
    setOperationType("");
    setSelectedWarehouse("");
    setSelectedDestinationWarehouse("");
    setBatchName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Yeni Əməliyyat</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Əməliyyat Məlumatları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="operation-type">Əməliyyat Növü</Label>
              <Select value={operationType} onValueChange={setOperationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Əməliyyat növünü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">Daxil olma</SelectItem>
                  <SelectItem value="outgoing">Çıxış</SelectItem>
                  <SelectItem value="sale">Satış</SelectItem>
                  <SelectItem value="return">Geri qaytarma</SelectItem>
                  <SelectItem value="transfer">Yerdəyişmə</SelectItem>
                  <SelectItem value="adjustment">Düzəliş</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {operationType === "incoming" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="warehouse">Anbar</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Anbar seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-name">Partiya adı</Label>
                  <Input
                    id="batch-name"
                    placeholder="Partiya adını daxil edin"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                  />
                </div>
              </>
            )}

            {operationType === "transfer" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="source-warehouse">Mənbə Anbar</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mənbə anbarı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination-warehouse">Təyinat Anbar</Label>
                  <Select value={selectedDestinationWarehouse} onValueChange={setSelectedDestinationWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Təyinat anbarı seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="product">Məhsul əlavə et</Label>
              <Select value={currentProduct} onValueChange={setCurrentProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Məhsul seçin" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.article})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentProduct && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Paketləşdirmə növü əlavə et</Label>
                  <div className="flex gap-2">
                    <Popover open={packagingOpen} onOpenChange={setPackagingOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={packagingOpen}
                          className="flex-1 justify-between"
                        >
                          {currentPackagingType
                            ? `${currentPackagingType} metr`
                            : "Paketləşdirmə seçin"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Paketləşdirmə axtarın və ya yeni əlavə edin..." 
                            value={customPackaging}
                            onValueChange={setCustomPackaging}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customPackaging.trim()) {
                                e.preventDefault();
                                handleAddCustomPackaging();
                              }
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="text-center py-2">
                                <p className="text-sm text-muted-foreground mb-2">
                                  Nəticə tapılmadı
                                </p>
                                {customPackaging.trim() && (
                                  <Button 
                                    size="sm" 
                                    onClick={handleAddCustomPackaging}
                                    className="text-xs"
                                  >
                                    "{customPackaging}" əlavə et
                                  </Button>
                                )}
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {packagingOptions
                                .filter((option) =>
                                  option.toLowerCase().includes(customPackaging.toLowerCase())
                                )
                                .map((option) => (
                                  <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={(currentValue) => {
                                      setCurrentPackagingType(currentValue);
                                      setPackagingOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        currentPackagingType === option ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {option} metr
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="number"
                      placeholder="Sayı"
                      value={currentPackageCount}
                      onChange={(e) => setCurrentPackageCount(e.target.value)}
                      className="w-20"
                    />
                    <Button onClick={handleAddPackaging} disabled={!currentPackagingType || !currentPackageCount}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {currentPackaging.length > 0 && (
                  <div className="space-y-2">
                    <Label>Seçilmiş paketləşdirmələr</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                       {currentPackaging.map((item, index) => (
                        <div key={`packaging-${item.type}-${item.count}-${index}`} className="flex items-center justify-between bg-muted p-2 rounded">
                          <span className="text-sm">
                            {item.count} ədəd × {item.type} metr = {parseInt(item.type.split(/[+()]/)[0]) * item.count} metr
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePackaging(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Məhsul üçün ümumi: {getCurrentProductTotalQuantity()} metr
                    </div>
                  </div>
                )}

                {currentPackaging.length > 0 && (
                  <Button onClick={handleAddProduct} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Məhsulu siyahıya əlavə et
                  </Button>
                )}
              </div>
            )}

            {selectedProducts.length > 0 && (
              <div className="space-y-2">
                <Label>Əlavə edilmiş məhsullar</Label>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                   {selectedProducts.map((productEntry, index) => (
                    <div key={`selected-product-${productEntry.productId}-${index}`} className="border p-3 rounded bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {getProductName(productEntry.productId)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                         {productEntry.packaging.map((pkg, pkgIndex) => (
                          <div key={`product-packaging-${pkg.type}-${pkg.count}-${pkgIndex}`} className="text-xs text-muted-foreground">
                            {pkg.count} ədəd × {pkg.type} metr
                          </div>
                        ))}
                        <div className="text-xs font-medium">
                          Ümumi: {getProductTotalQuantity(productEntry.packaging)} metr
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Qeydlər</Label>
              <Textarea
                id="notes"
                placeholder="Əlavə qeydlər (ixtiyari)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1" 
                disabled={!operationType || selectedProducts.length === 0}
                onClick={handleSaveOperation}
                title={!operationType ? "Əməliyyat növünü seçin" : selectedProducts.length === 0 ? "Ən azı bir məhsul əlavə edin" : "Əməliyyatı saxla"}
              >
                <Save className="mr-2 h-4 w-4" />
                Əməliyyatı saxla
              </Button>
              
              {selectedProducts.length > 0 && (
                <>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      const operationTitle = `${operationType} əməliyyatı`;
                      const operationDate = new Date().toLocaleDateString('az-AZ');
                      const productName = selectedProducts.map(p => getProductName(p.productId)).join(', ');
                      const totalQuantity = selectedProducts.reduce((total, p) => total + getProductTotalQuantity(p.packaging), 0);
                      handleDownloadPDF(operationTitle, operationDate, productName, totalQuantity);
                    }}
                    title="PDF formatında yüklə"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF İxrac
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => {
                      const operationTitle = `${operationType} əməliyyatı`;
                      const operationDate = new Date().toLocaleDateString('az-AZ');
                      const productName = selectedProducts.map(p => getProductName(p.productId)).join(', ');
                      const totalQuantity = selectedProducts.reduce((total, p) => total + getProductTotalQuantity(p.packaging), 0);
                      handlePrint(operationTitle, operationDate, productName, totalQuantity);
                    }}
                    title="Çap et"
                  >
                    Print
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedProducts([]);
                  setCurrentProduct("");
                  setCurrentPackaging([]);
                  setNotes("");
                  setOperationType("");
                  setSelectedWarehouse("");
                  setSelectedDestinationWarehouse("");
                  setBatchName("");
                }}
                title="Bütün sahələri təmizlə"
              >
                Təmizlə
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Əməliyyatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Hələ ki heç bir əməliyyat yoxdur</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}