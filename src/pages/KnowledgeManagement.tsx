import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KnowledgeTable } from "@/components/knowledge/KnowledgeTable";
import { UserMenu } from "@/components/UserMenu";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function KnowledgeManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">{t.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input placeholder={t.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1" />
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
    </div>
  );
}
