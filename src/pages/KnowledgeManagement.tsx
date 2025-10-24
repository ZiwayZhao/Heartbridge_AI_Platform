import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Upload, RefreshCw } from "lucide-react";
import { KnowledgeTable } from "@/components/knowledge/KnowledgeTable";
import { useToast } from "@/hooks/use-toast";

export default function KnowledgeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [importanceFilter, setImportanceFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: knowledgeUnits, isLoading, refetch } = useQuery({
    queryKey: ["knowledge-units", searchTerm, categoryFilter, importanceFilter],
    queryFn: async () => {
      let query = supabase
        .from("knowledge_units")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.ilike("content", `%${searchTerm}%`);
      }

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      if (importanceFilter !== "all") {
        query = query.eq("importance", importanceFilter);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "加载失败",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">知识库管理</h1>
            <p className="text-muted-foreground mt-2">
              管理和查看已入库的知识单元
            </p>
          </div>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            返回上传
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>筛选和搜索</CardTitle>
            <CardDescription>
              通过关键词、类别和重要性筛选知识单元
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索内容..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  <SelectItem value="general">通用</SelectItem>
                  <SelectItem value="intervention">干预</SelectItem>
                  <SelectItem value="communication">沟通</SelectItem>
                  <SelectItem value="behavior">行为</SelectItem>
                  <SelectItem value="social_skills">社交技能</SelectItem>
                  <SelectItem value="sensory">感官</SelectItem>
                </SelectContent>
              </Select>

              <Select value={importanceFilter} onValueChange={setImportanceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择重要性" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部级别</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              知识单元列表
              {knowledgeUnits && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  共 {knowledgeUnits.length} 条
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KnowledgeTable
              data={knowledgeUnits || []}
              isLoading={isLoading}
              onRefresh={refetch}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
