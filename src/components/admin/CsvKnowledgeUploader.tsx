import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseCsvToJson } from '@/utils/csvParser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface KnowledgeUnit {
  content: string;
  category?: string;
  importance?: string;
  labels?: string[];
  keywords?: string[];
}

interface CsvKnowledgeUploaderProps {
  onUploadComplete?: () => void;
}

export default function CsvKnowledgeUploader({ onUploadComplete }: CsvKnowledgeUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    error: number;
    message: string;
  } | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "错误",
        description: "请选择要上传的 CSV 文件",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setUploadResult(null);
    
    try {
      // 解析CSV文件
      const knowledgeUnits = await parseCsvToJson<KnowledgeUnit>(file);
      
      if (knowledgeUnits.length === 0) {
        throw new Error('CSV 文件为空或格式不正确');
      }

      // 验证必要字段
      const invalidRows = knowledgeUnits.filter((unit, index) => {
        if (!unit.content || typeof unit.content !== 'string' || unit.content.trim() === '') {
          console.warn(`第 ${index + 1} 行缺少有效的content字段:`, unit);
          return true;
        }
        return false;
      });

      if (invalidRows.length > 0) {
        throw new Error(`发现 ${invalidRows.length} 行数据缺少有效的content字段`);
      }

      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;

      // 批量处理知识单元
      for (let i = 0; i < knowledgeUnits.length; i += batchSize) {
        const batch = knowledgeUnits.slice(i, i + batchSize);
        
        try {
          const response = await supabase.functions.invoke('process-csv', {
            body: batch,
          });

          if (response.error) {
            throw new Error(response.error.message);
          }

          successCount += batch.length;
        } catch (error) {
          console.error('批量插入知识单元失败:', error);
          errorCount += batch.length;
        }
      }

      setUploadResult({
        success: successCount,
        error: errorCount,
        message: `上传完成！成功: ${successCount}, 失败: ${errorCount}`
      });

      if (successCount > 0) {
        toast({
          title: "上传成功",
          description: `成功上传 ${successCount} 条知识单元`,
        });
        
        if (onUploadComplete) {
          onUploadComplete();
        }
      }

      if (errorCount > 0) {
        toast({
          title: "部分上传失败",
          description: `${errorCount} 条数据上传失败，请检查日志`,
          variant: "destructive",
        });
      }
      
      // 重置表单
      setFile(null);
      const fileInput = document.getElementById('csv-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('CSV 解析失败:', error);
      const errorMessage = error.message || '文件格式不正确，请确保文件为 UTF-8 编码的 CSV 格式';
      
      setUploadResult({
        success: 0,
        error: 1,
        message: `上传失败: ${errorMessage}`
      });

      toast({
        title: "上传失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV知识库上传</CardTitle>
        <CardDescription>
          上传包含知识内容的CSV文件，系统将自动处理并生成向量表示。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>CSV文件要求：</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>UTF-8编码</li>
              <li>必须包含 "content" 列（知识内容）</li>
              <li>可选列：category（类别: general, specific, technical, other）</li>
              <li>可选列：importance（重要性: high, medium, low）</li>
              <li>可选列：labels（标签，用逗号分隔）</li>
              <li>可选列：keywords（关键词，用逗号分隔）</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-4">
          <Input
            id="csv-upload-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="flex-1"
          />
          <Button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? '处理中...' : '上传CSV文件'}
          </Button>
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            选择的文件: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </div>
        )}

        {uploadResult && (
          <Alert className={uploadResult.error > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertDescription>
              {uploadResult.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
