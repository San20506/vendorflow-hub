import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Upload, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mockPreviewData = [
  { skuId: 'SKU-NEW-001', name: 'Bamboo Water Bottle', category: 'Home & Kitchen', price: 699 },
  { skuId: 'SKU-NEW-002', name: 'Wireless Mouse Pro', category: 'Electronics', price: 1299 },
  { skuId: 'SKU-NEW-003', name: 'Cotton Polo Shirt', category: 'Apparel', price: 899 },
];

export function ExcelProductUpload({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const { toast } = useToast();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0].name);
      setTimeout(() => setUploaded(true), 800);
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <label>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">Upload Excel file with product data</p>
            <p className="text-sm text-muted-foreground mt-1">Supports .xlsx, .xls, .csv</p>
            <p className="text-xs text-muted-foreground mt-2">Also usable for SKU Mapping bulk import</p>
          </div>
        </label>
      ) : (
        <>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-sm flex-1">{file}</span>
            {uploaded ? (
              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
                <CheckCircle2 className="w-3 h-3" />Uploaded
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-blue-500/15 text-blue-600 border-blue-500/30">Processing...</Badge>
            )}
          </div>
          {uploaded && (
            <>
              <p className="text-sm font-medium">Preview (3 rows detected)</p>
              <Table>
                <TableHeader><TableRow className="bg-muted/50"><TableHead>SKU</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Price</TableHead></TableRow></TableHeader>
                <TableBody>
                  {mockPreviewData.map(r => (
                    <TableRow key={r.skuId}><TableCell className="font-mono text-sm">{r.skuId}</TableCell><TableCell>{r.name}</TableCell><TableCell>{r.category}</TableCell><TableCell className="text-right">₹{r.price}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={() => { toast({ title: 'Products Imported', description: '3 products added from Excel.' }); onClose(); }}>Import Products</Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
