import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, MapPin, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface TravelKnowledgeItem {
  question?: string;
  answer?: string;
  content?: string;
  category?: string;
  location?: string;
  tags?: string[];
  source_name?: string;
}

interface TravelKnowledgeUploaderProps {
  onUploadComplete?: () => void;
}

const categories = [
  { value: 'travel_guide', label: '旅行攻略' },
  { value: 'living_tips', label: '生活技巧' },
  { value: 'food_culture', label: '美食文化' },
  { value: 'transportation', label: '交通出行' },
  { value: 'accommodation', label: '住宿指南' },
  { value: 'emergency', label: '紧急情况' },
  { value: 'language', label: '语言沟通' },
  { value: 'shopping', label: '购物指南' },
  { value: 'sightseeing', label: '景点游览' },
  { value: 'general', label: '综合信息' }
];

export default function TravelKnowledgeUploader({ onUploadComplete }: TravelKnowledgeUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [defaultCategory, setDefaultCategory] = useState('travel_guide');
  const [defaultLocation, setDefaultLocation] = useState('');
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const parseCSV = async (file: File): Promise<TravelKnowledgeItem[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        encoding: 'UTF-8',
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(results.errors.map(error => error.message).join('\n')));
          } else {
            const typedData = results.data as TravelKnowledgeItem[];
            resolve(typedData);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  const processKnowledgeItems = (items: TravelKnowledgeItem[]): TravelKnowledgeItem[] => {
    return items.map(item => ({
      ...item,
      category: item.category || defaultCategory,
      location: item.location || defaultLocation || null,
      source_name: file?.name || 'CSV Upload',
      tags: item.tags || []
    })).filter(item => 
      (item.question && item.answer) || item.content
    );
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: '未选择文件',
        description: '请选择要上传的 CSV 文件。',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setProgress(10);

    try {
      // 1. 解析CSV文件
      const rawItems = await parseCSV(file);
      setProgress(30);

      // 2. 处理和验证数据
      const processedItems = processKnowledgeItems(rawItems);
      
      if (processedItems.length === 0) {
        throw new Error('CSV文件中没有有效的问答数据。请确保包含 question/answer 或 content 列。');
      }
      
      setProgress(50);

      // 3. 调用后端函数进行存储和向量化
      const { data, error } = await supabase.functions.invoke('formolly-upload-knowledge', {
        body: { knowledgeItems: processedItems }
      });

      if (error) {
        throw error;
      }

      setProgress(100);

      // 4. 显示结果
      const result = data;
      if (result.success) {
        const successMsg = result.successCount > 0 
          ? `✅ 成功上传 ${result.successCount} 个知识条目到Ziway的知识库！`
          : '⚠️ 没有成功处理任何数据';
          
        const errorMsg = result.errorCount > 0 
          ? `❌ ${result.errorCount} 个条目处理失败`
          : '';
          
        const fullMsg = [successMsg, errorMsg].filter(Boolean).join('\n');
        
        toast({
          title: result.successCount > 0 ? '上传成功！' : '上传完成',
          description: fullMsg,
          variant: result.successCount > 0 ? 'default' : 'destructive'
        });
        
        // 显示详细信息
        if (result.note) {
          console.log('📝 注意:', result.note);
        }
        
        if (result.errors && result.errors.length > 0) {
          console.log('❌ 错误详情:', result.errors);
        }
        
        // 清理状态
        setFile(null);
        const fileInput = document.getElementById('csv-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        throw new Error(result.error || '上传处理失败');
      }

    } catch (error: any) {
      console.error('CSV上传失败:', error);
      toast({
        title: "上传失败",
        description: error.message || '文件处理时出现错误，请检查文件格式',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          旅行知识上传
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          上传包含欧洲旅行攻略的CSV文件，系统将自动进行向量化处理，供Ziway回答问题时使用。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
        <Alert className="p-3 sm:p-4">
          <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            <strong>CSV格式要求：</strong>
            <div className="mt-1 space-y-1">
              <div>• 必须包含 <code className="bg-gray-100 px-1 rounded text-xs">question</code> 和 <code className="bg-gray-100 px-1 rounded text-xs">answer</code> 列，或单独的 <code className="bg-gray-100 px-1 rounded text-xs">content</code> 列</div>
              <div>• 可选列：<code className="bg-gray-100 px-1 rounded text-xs">category</code>（分类）、<code className="bg-gray-100 px-1 rounded text-xs">location</code>（地点）、<code className="bg-gray-100 px-1 rounded text-xs">tags</code>（标签）</div>
              <div>• 文件编码：UTF-8</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* 默认设置 - 响应式优化 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-xs sm:text-sm font-medium mb-2 block">默认分类</label>
            <Select value={defaultCategory} onValueChange={setDefaultCategory}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs sm:text-sm">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-medium mb-2 block">默认地点（可选）</label>
            <Input
              placeholder="如：巴黎、柏林、意大利..."
              value={defaultLocation}
              onChange={(e) => setDefaultLocation(e.target.value)}
              className="text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* 文件选择和上传 - 响应式优化 */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Input
              id="csv-upload-input"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="text-xs sm:text-sm cursor-pointer file:text-xs sm:file:text-sm"
            />
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              {isUploading ? '处理中...' : '上传并处理'}
            </Button>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>处理进度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full h-2" />
            </div>
          )}
        </div>

        {/* 示例数据格式 - 响应式优化 */}
        <Alert className="p-3 sm:p-4">
          <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            <strong>示例CSV格式：</strong>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 sm:p-3 rounded overflow-x-auto">
{`question,answer,category,location
"巴黎地铁怎么买票？","可以在地铁站的自动售票机购买，支持信用卡和现金","transportation","巴黎"
"德国超市购物注意什么？","需要自备购物袋，购物车需要投币，结账后要自己装袋","shopping","德国"`}
            </pre>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
