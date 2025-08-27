import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, MapPin, Tag, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import KnowledgeManager from './KnowledgeManager';

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

// 将旧的类别映射到新的RAG系统类别
const mapCategoryToNewFormat = (oldCategory: string): 'general' | 'specific' | 'technical' | 'other' => {
  switch (oldCategory) {
    case 'technical':
    case 'transportation':
    case 'emergency':
      return 'technical';
    case 'travel_guide':
    case 'accommodation':
    case 'sightseeing':
      return 'specific';
    case 'living_tips':
    case 'food_culture':
    case 'language':
    case 'shopping':
      return 'general';
    default:
      return 'other';
  }
};

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
    return items.map(item => {
      // 处理 tags 字段 - 如果是字符串则分割为数组
      let processedTags: string[] = [];
      if (item.tags) {
        if (Array.isArray(item.tags)) {
          processedTags = item.tags;
        } else if (typeof item.tags === 'string') {
          processedTags = (item.tags as string).split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        }
      }

      return {
        ...item,
        category: item.category || defaultCategory,
        location: item.location || defaultLocation || null,
        source_name: file?.name || 'CSV Upload',
        tags: processedTags
      };
    }).filter(item => 
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

      // 3. 转换为新的格式并调用新的process-csv函数
      const knowledgeUnits = processedItems.map(item => ({
        content: item.content || `问题: ${item.question}\n答案: ${item.answer}`,
        category: mapCategoryToNewFormat(item.category || 'general'),
        importance: 'medium',
        labels: Array.isArray(item.tags) ? item.tags : [],
        keywords: Array.isArray(item.tags) ? item.tags : []
      }));

      console.log('发送到 process-csv 的数据:', knowledgeUnits);

      const { data, error } = await supabase.functions.invoke('process-csv', {
        body: knowledgeUnits
      });

      console.log('process-csv 响应:', { data, error });

      if (error) {
        console.error('process-csv 错误详情:', error);
        throw new Error(`上传失败: ${error.message || '未知错误'}`);
      }

      setProgress(100);

      // 4. 显示结果
      const result = data;
      
      // 适配新的返回格式 { message: '...', count: ... }
      if (result && result.message && result.count !== undefined) {
        const successMsg = result.count > 0 
          ? `✅ 成功上传 ${result.count} 个知识条目到Ziway的知识库！`
          : '⚠️ 没有成功处理任何数据';
        
        toast({
          title: result.count > 0 ? '上传成功！' : '上传完成',
          description: successMsg,
          variant: result.count > 0 ? 'default' : 'destructive'
        });
        
        // 清理状态
        setFile(null);
        const fileInput = document.getElementById('csv-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        throw new Error('上传处理失败：返回数据格式不正确');
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
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          上传知识
        </TabsTrigger>
        <TabsTrigger value="manage" className="flex items-center gap-2">
          <Database className="w-4 h-4" />
          管理知识库
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload">
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
{`content,category,importance,labels,keywords
"巴黎地铁购票：可以在地铁站的自动售票机购买，支持信用卡和现金","transportation","medium","交通,地铁,巴黎","地铁,购票,交通"
"德国超市购物：需要自备购物袋，购物车需要投币，结账后要自己装袋","shopping","medium","购物,德国","超市,购物,德国"`}

{`或使用问答格式：
question,answer,category,location
"巴黎地铁怎么买票？","可以在地铁站的自动售票机购买，支持信用卡和现金","transportation","巴黎"
"德国超市购物注意什么？","需要自备购物袋，购物车需要投币，结账后要自己装袋","shopping","德国"`}
            </pre>
          </AlertDescription>
        </Alert>
        </CardContent>
      </Card>
      </TabsContent>
      
      <TabsContent value="manage">
        <KnowledgeManager />
      </TabsContent>
    </Tabs>
  );
}
