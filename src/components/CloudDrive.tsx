import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  File, 
  Trash2, 
  Eye, 
  Plus,
  Search,
  Calendar,
  HardDrive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CloudFile {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  description?: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
}

export default function CloudDrive() {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();

  // 加载文件列表
  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('formolly_cloud_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Database not ready:', error.message);
        // 如果表不存在，显示友好提示
        if (error.message.includes('does not exist')) {
          toast({
            title: "数据库未准备就绪",
            description: "请先运行数据库迁移来创建必要的表结构",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }
      setFiles(data || []);
    } catch (error: any) {
      console.error('Error loading files:', error);
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 上传文件
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. 生成唯一文件名
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `files/${fileName}`;

      // 2. 上传到存储桶
      const { error: uploadError } = await supabase.storage
        .from('formolly-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 3. 保存文件信息到数据库
      const tagsArray = uploadTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error: dbError } = await (supabase as any)
        .from('formolly_cloud_files')
        .insert({
          filename: fileName,
          original_filename: selectedFile.name,
          file_type: selectedFile.type || 'application/octet-stream',
          file_size: selectedFile.size,
          storage_path: filePath,
          description: uploadDescription.trim() || null,
          tags: tagsArray,
          is_public: true
        });

      if (dbError) throw dbError;

      toast({
        title: "上传成功",
        description: `文件 "${selectedFile.name}" 已成功上传`
      });

      // 重置状态
      setSelectedFile(null);
      setUploadDescription('');
      setUploadTags('');
      setShowUploadDialog(false);
      loadFiles();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "上传失败",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 下载文件
  const handleDownload = async (file: CloudFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('formolly-files')
        .download(file.storage_path);

      if (error) throw error;

      // 创建下载链接
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "下载开始",
        description: `正在下载 "${file.original_filename}"`
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "下载失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 删除文件
  const handleDelete = async (file: CloudFile) => {
    if (!confirm(`确定要删除文件 "${file.original_filename}" 吗？`)) return;

    try {
      // 从存储桶删除
      const { error: storageError } = await supabase.storage
        .from('formolly-files')
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // 从数据库删除
      const { error: dbError } = await (supabase as any)
        .from('formolly_cloud_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: "删除成功",
        description: `文件 "${file.original_filename}" 已删除`
      });

      loadFiles();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 过滤文件
  const filteredFiles = files.filter(file =>
    file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-orange-600" />
                Formolly 云盘
              </CardTitle>
              <CardDescription>
                为 Molly 准备的文件存储空间，可以上传旅行文档、图片等文件
              </CardDescription>
            </div>
            
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  上传文件
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>上传文件</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <Textarea
                      placeholder="文件描述（可选）"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Input
                      placeholder="标签（用逗号分隔，如：旅行,攻略,巴黎）"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                    />
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>上传进度</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowUploadDialog(false)}
                      disabled={uploading}
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                    >
                      {uploading ? '上传中...' : '上传'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="搜索文件名、描述或标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={loadFiles} disabled={loading}>
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 文件列表 */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                <p className="text-gray-500">加载文件中...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <File className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">
                  {searchQuery ? '没有找到匹配的文件' : '还没有上传任何文件'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="w-8 h-8 text-orange-600 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{file.original_filename}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {file.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {file.description}
                        </p>
                      )}
                      
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      title="下载"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file)}
                      title="删除"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 存储统计 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>共 {files.length} 个文件</span>
            <span>
              总大小: {formatFileSize(files.reduce((total, file) => total + file.file_size, 0))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
