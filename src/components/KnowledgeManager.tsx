import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  RefreshCw, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Zap,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeUnit {
  id: string;
  content: string;
  category: 'general' | 'specific' | 'technical' | 'other';
  importance: 'high' | 'medium' | 'low';
  labels: string[];
  keywords: string[];
  embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
  embedding_error?: string;
  created_at: string;
  updated_at: string;
}

interface KnowledgeManagerProps {
  onRefresh?: () => void;
}

export default function KnowledgeManager({ onRefresh }: KnowledgeManagerProps) {
  const [knowledgeUnits, setKnowledgeUnits] = useState<KnowledgeUnit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<KnowledgeUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingUnit, setEditingUnit] = useState<KnowledgeUnit | null>(null);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const { toast } = useToast();

  // 加载知识单元
  const loadKnowledgeUnits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_units')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setKnowledgeUnits(data || []);
      setFilteredUnits(data || []);
    } catch (error: any) {
      console.error('加载知识单元失败:', error);
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 过滤知识单元
  useEffect(() => {
    let filtered = knowledgeUnits;

    if (searchTerm) {
      filtered = filtered.filter(unit => 
        unit.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.labels.some(label => label.toLowerCase().includes(searchTerm.toLowerCase())) ||
        unit.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(unit => unit.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(unit => unit.embedding_status === filterStatus);
    }

    setFilteredUnits(filtered);
  }, [knowledgeUnits, searchTerm, filterCategory, filterStatus]);

  // 删除知识单元
  const deleteKnowledgeUnit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_units')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadKnowledgeUnits();
      toast({
        title: "删除成功",
        description: "知识单元已删除",
      });
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 保存编辑
  const saveEdit = async () => {
    if (!editingUnit) return;

    try {
      const { error } = await supabase
        .from('knowledge_units')
        .update({
          content: editingUnit.content,
          category: editingUnit.category,
          importance: editingUnit.importance,
          labels: editingUnit.labels,
          keywords: editingUnit.keywords,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUnit.id);

      if (error) throw error;

      setEditingUnit(null);
      await loadKnowledgeUnits();
      toast({
        title: "保存成功",
        description: "知识单元已更新",
      });
    } catch (error: any) {
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 批量向量化
  const batchVectorize = async () => {
    setIsVectorizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: { batchProcess: true }
      });

      if (error) throw error;

      toast({
        title: "向量化启动",
        description: data.message || "批量向量化已开始，请稍后刷新查看进度",
      });

      // 刷新数据
      setTimeout(() => {
        loadKnowledgeUnits();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "向量化失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVectorizing(false);
    }
  };

  // 单个向量化
  const vectorizeUnit = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: { knowledgeUnitId: id }
      });

      if (error) throw error;

      toast({
        title: "向量化启动",
        description: "单个知识单元向量化已开始",
      });

      // 刷新数据
      setTimeout(() => {
        loadKnowledgeUnits();
      }, 1000);
    } catch (error: any) {
      toast({
        title: "向量化失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    loadKnowledgeUnits();
  }, []);

  const stats = {
    total: knowledgeUnits.length,
    completed: knowledgeUnits.filter(u => u.embedding_status === 'completed').length,
    pending: knowledgeUnits.filter(u => u.embedding_status === 'pending').length,
    failed: knowledgeUnits.filter(u => u.embedding_status === 'failed').length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          知识库管理
        </CardTitle>
        <CardDescription>
          管理和维护 Ziway 的知识库，支持编辑、删除和向量化操作
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">总数</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-600">已向量化</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-yellow-600">待处理</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-red-600">失败</div>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索内容、标签或关键词..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类别</SelectItem>
                <SelectItem value="general">一般</SelectItem>
                <SelectItem value="specific">特定</SelectItem>
                <SelectItem value="technical">技术</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={loadKnowledgeUnits}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button
              onClick={batchVectorize}
              disabled={isVectorizing}
              size="sm"
            >
              <Zap className={`w-4 h-4 mr-2 ${isVectorizing ? 'animate-pulse' : ''}`} />
              批量向量化
            </Button>
          </div>
        </div>

        {/* 知识单元列表 */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {knowledgeUnits.length === 0 ? '暂无知识单元' : '没有匹配的结果'}
            </div>
          ) : (
            filteredUnits.map((unit) => (
              <div key={unit.id} className="border rounded-lg p-4 bg-white">
                {editingUnit?.id === unit.id ? (
                  // 编辑模式
                  <div className="space-y-4">
                    <Textarea
                      value={editingUnit.content}
                      onChange={(e) => setEditingUnit({
                        ...editingUnit,
                        content: e.target.value
                      })}
                      placeholder="知识内容"
                      className="min-h-[100px]"
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        value={editingUnit.category}
                        onValueChange={(value: any) => setEditingUnit({
                          ...editingUnit,
                          category: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">一般</SelectItem>
                          <SelectItem value="specific">特定</SelectItem>
                          <SelectItem value="technical">技术</SelectItem>
                          <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={editingUnit.importance}
                        onValueChange={(value: any) => setEditingUnit({
                          ...editingUnit,
                          importance: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">高</SelectItem>
                          <SelectItem value="medium">中</SelectItem>
                          <SelectItem value="low">低</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        value={editingUnit.labels.join(', ')}
                        onChange={(e) => setEditingUnit({
                          ...editingUnit,
                          labels: e.target.value.split(',').map(l => l.trim()).filter(Boolean)
                        })}
                        placeholder="标签 (用逗号分隔)"
                      />
                      <Input
                        value={editingUnit.keywords.join(', ')}
                        onChange={(e) => setEditingUnit({
                          ...editingUnit,
                          keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                        })}
                        placeholder="关键词 (用逗号分隔)"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                      <Button 
                        onClick={() => setEditingUnit(null)} 
                        variant="outline" 
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 显示模式
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {unit.content.length > 200 
                            ? `${unit.content.substring(0, 200)}...` 
                            : unit.content
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(unit.embedding_status)}
                        <Badge className={getStatusColor(unit.embedding_status)}>
                          {unit.embedding_status === 'completed' ? '已完成' :
                           unit.embedding_status === 'processing' ? '处理中' :
                           unit.embedding_status === 'failed' ? '失败' : '待处理'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{unit.category}</Badge>
                      <Badge variant="outline">{unit.importance}</Badge>
                      {unit.labels.map(label => (
                        <Badge key={label} variant="outline" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                    
                    {unit.embedding_error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-red-800">
                          向量化失败: {unit.embedding_error}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        创建: {new Date(unit.created_at).toLocaleString()}
                        {unit.updated_at !== unit.created_at && (
                          <span className="ml-2">
                            更新: {new Date(unit.updated_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        {(unit.embedding_status === 'pending' || unit.embedding_status === 'failed') && (
                          <Button
                            onClick={() => vectorizeUnit(unit.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Zap className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          onClick={() => setEditingUnit(unit)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm('确定要删除这个知识单元吗？')) {
                              deleteKnowledgeUnit(unit.id);
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
