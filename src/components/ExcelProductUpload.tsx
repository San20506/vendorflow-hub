import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Upload, CheckCircle2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const sampleProductTemplate = [
  { SKU: 'SKU-001', 'Product Name': 'Wireless Earbuds Pro', Brand: 'SoundMax', Category: 'Electronics', 'MRP (₹)': 3999, 'Base Price (₹)': 2999, 'HSN Code': '85183000', 'GST %': 18, Status: 'active' },
  { SKU: 'SKU-002', 'Product Name': 'Cotton T-Shirt Classic', Brand: 'FashionHub', Category: 'Clothing', 'MRP (₹)': 999, 'Base Price (₹)': 599, 'HSN Code': '61091000', 'GST %': 5, Status: 'active' },
  { SKU: 'SKU-003', 'Product Name': 'Baby Gift Set Premium', Brand: 'LittleJoy', Category: 'Baby Care', 'MRP (₹)': 1999, 'Base Price (₹)': 1299, 'HSN Code': '95030090', 'GST %': 12, Status: 'active' },
];

const sampleSKUTemplate = [
  { 'Master SKU': 'MSK-001', 'Product Name': 'Wireless Earbuds Pro', Brand: 'SoundMax', 'Amazon SKU': 'AMZ-WEP-001', 'Flipkart SKU': 'FLK-WEP-001', 'Meesho SKU': 'MSH-WEP-001', 'FirstCry SKU': '', 'Own Website SKU': 'OWN-WEP-001' },
  { 'Master SKU': 'MSK-002', 'Product Name': 'Cotton T-Shirt', Brand: 'FashionHub', 'Amazon SKU': 'AMZ-CTS-002', 'Flipkart SKU': 'FLK-CTS-002', 'Meesho SKU': '', 'FirstCry SKU': 'FC-CTS-002', 'Own Website SKU': '' },
];

const mockPreviewData: any[] = [];

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

  const downloadTemplate = (name: string, data: any[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${name}_template.xlsx`);
    toast({ title: 'Template Downloaded', description: `${name} template with ${data.length} sample rows` });
  };

  return (
    <div className="space-y-4">
      {/* Sample Template Downloads */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <Download className="w-4 h-4 text-primary" />
          Download Sample Templates
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => downloadTemplate('products', sampleProductTemplate)}>
            <FileSpreadsheet className="w-3.5 h-3.5" />Products Template
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => downloadTemplate('sku_mapping', sampleSKUTemplate)}>
            <FileSpreadsheet className="w-3.5 h-3.5" />SKU Mapping Template
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">Templates include sample data — replace with your own data before uploading</p>
      </div>

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
