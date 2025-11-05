import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KnowledgeTable } from "@/components/knowledge/KnowledgeTable";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { useReindexKnowledge } from "@/hooks/useReindexKnowledge";
import Layout from "@/components/Layout";

export default function KnowledgeManagement() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { reindexKnowledge, isReindexing } = useReindexKnowledge();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [importanceFilter, setImportanceFilter] = useState<string>("all");

  const texts = {
    en: {
      title: 'Knowledge Management',
      description: 'Manage autism intervention knowledge base',
      back: 'Back to Home',
      search: 'Search...',
      refresh: 'Refresh',
      knowledgeList: 'Knowledge Units',
    },
    zh: {
      title: '知识库管理',
      description: '管理自闭症干预知识库',
      back: '返回首页',
      search: '搜索...',
      refresh: '刷新',
      knowledgeList: '知识单元列表',
    },
  };

  const t = texts[language];

  const { data: knowledgeUnits = [], isLoading, refetch } = useQuery({
    queryKey: ['knowledge-units', searchTerm, categoryFilter, importanceFilter],
    queryFn: async () => {
      let query = supabase.from('knowledge_units').select('*');
      
      if (searchTerm) {
        query = query.or(`content.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }
      
      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      
      if (importanceFilter && importanceFilter !== 'all') {
        query = query.eq('importance', importanceFilter);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1" />
              <Button 
                onClick={reindexKnowledge} 
                disabled={isReindexing}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isReindexing ? 'animate-spin' : ''}`} />
                重新索引
              </Button>
              <Button onClick={() => refetch()} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.knowledgeList}</CardTitle>
          </CardHeader>
          <CardContent>
            <KnowledgeTable knowledgeUnits={knowledgeUnits} isLoading={isLoading} refetch={refetch} />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
