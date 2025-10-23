import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import Papa from 'papaparse';

export default function KnowledgeUploader() {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { t } = useLanguage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: t('common.error'),
        description: 'Please select a valid CSV file',
        variant: 'destructive',
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      // Parse CSV
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const knowledgeItems = results.data.map((row: any) => ({
            question: row.question || row.Question || '',
            answer: row.answer || row.Answer || '',
            category: row.category || row.Category || 'general',
            importance: row.importance || row.Importance || 'medium',
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
            source_name: file.name,
          }));

          // Upload to HeartBridge
          const { data, error } = await supabase.functions.invoke('heartbridge-upload-knowledge', {
            body: { knowledgeItems }
          });

          if (error) {
            throw error;
          }

          if (data.successCount > 0) {
            toast({
              title: t('upload.success'),
              description: `Successfully uploaded ${data.successCount} knowledge items`,
            });
          }

          if (data.errorCount > 0) {
            toast({
              title: t('common.error'),
              description: `${data.errorCount} items failed to upload`,
              variant: 'destructive',
            });
          }

          setFile(null);
        },
        error: (error) => {
          throw new Error(`CSV parsing error: ${error.message}`);
        }
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: t('upload.error'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
          <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
          <span className="truncate">{t('upload.title')}</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t('upload.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-4">
            Upload CSV file with columns: question, answer, category, importance
          </p>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="max-w-xs mx-auto"
          />
        </div>

        {file && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              size="sm"
            >
              {uploading ? t('upload.processing') : t('upload.button')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
