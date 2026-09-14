import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const IMPORT_URL = 'https://functions.poehali.dev/704cf8b2-42c2-4835-aa8e-ad16b91f60f0';
const TEMPLATE_URL = '/templates/property-import-template.xlsx';

interface ImportObjectsExcelProps {
  brokerId: number;
}

interface ImportResult {
  created: number;
  row_errors?: string[];
}

const ImportObjectsExcel = ({ brokerId }: ImportObjectsExcelProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toast({ title: 'Нужен файл в формате .xlsx', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(IMPORT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker_id: brokerId, file: base64 }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось загрузить файл');
      }

      setResult(data);
      setShowResultDialog(true);
      queryClient.invalidateQueries({ queryKey: ['objects'] });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Ошибка загрузки файла', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" asChild>
        <a href={TEMPLATE_URL} download>
          <Icon name="Download" size={16} className="mr-2" />
          Скачать шаблон
        </a>
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
        {uploading ? (
          <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
        ) : (
          <Icon name="Upload" size={16} className="mr-2" />
        )}
        {uploading ? 'Загрузка...' : 'Загрузить заполненный файл'}
      </Button>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="CheckCircle2" size={20} className="text-green-600" />
              Импорт завершён
            </DialogTitle>
            <DialogDescription>Результат загрузки объектов из файла</DialogDescription>
          </DialogHeader>
          {result && (
            <div className="space-y-3">
              <p className="text-sm">
                Успешно добавлено объектов: <span className="font-semibold">{result.created}</span>
              </p>
              {result.row_errors && result.row_errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-destructive">Пропущенные строки:</p>
                  <div className="max-h-48 overflow-y-auto rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive space-y-1">
                    {result.row_errors.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportObjectsExcel;
