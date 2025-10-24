import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KnowledgeUnit {
  id: string;
  content: string;
  category: string;
  importance: string;
  data_type: string;
  entities: any;
  tags: string[];
  created_at: string;
}

interface KnowledgeEditDialogProps {
  unit: KnowledgeUnit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  readOnly?: boolean;
}

export function KnowledgeEditDialog({
  unit,
  open,
  onOpenChange,
  onSuccess,
  readOnly = false,
}: KnowledgeEditDialogProps) {
  const [content, setContent] = useState(unit.content);
  const [category, setCategory] = useState(unit.category);
  const [importance, setImportance] = useState(unit.importance);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setContent(unit.content);
    setCategory(unit.category);
    setImportance(unit.importance);
  }, [unit]);

  const handleSubmit = async () => {
    if (readOnly) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("knowledge_units")
        .update({
          content,
          category,
          importance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", unit.id);

      if (error) throw error;

      toast({
        title: "更新成功",
        description: "知识单元已成功更新",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{readOnly ? "查看知识单元" : "编辑知识单元"}</DialogTitle>
          <DialogDescription>
            {readOnly ? "查看知识单元详情" : "修改知识单元的内容和属性"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              disabled={readOnly}
            />
          </div>

          {unit.entities && (
            <div className="space-y-2">
              <Label>结构化数据</Label>
              <div className="rounded-md border p-4 bg-muted/50">
                {unit.entities.question && (
                  <div className="mb-2">
                    <p className="text-sm font-medium">问题：</p>
                    <p className="text-sm text-muted-foreground">
                      {unit.entities.question}
                    </p>
                  </div>
                )}
                {unit.entities.answer && (
                  <div className="mb-2">
                    <p className="text-sm font-medium">答案：</p>
                    <p className="text-sm text-muted-foreground">
                      {unit.entities.answer}
                    </p>
                  </div>
                )}
                {unit.entities.id && (
                  <div>
                    <p className="text-sm font-medium">ID：</p>
                    <p className="text-sm text-muted-foreground">
                      {unit.entities.id}
                    </p>
                  </div>
                )}
                {unit.entities.category && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">原始类别：</p>
                    <p className="text-sm text-muted-foreground">
                      {unit.entities.category}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">类别</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                disabled={readOnly}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">通用</SelectItem>
                  <SelectItem value="intervention">干预</SelectItem>
                  <SelectItem value="communication">沟通</SelectItem>
                  <SelectItem value="behavior">行为</SelectItem>
                  <SelectItem value="social_skills">社交技能</SelectItem>
                  <SelectItem value="sensory">感官</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="importance">重要性</Label>
              <Select
                value={importance}
                onValueChange={setImportance}
                disabled={readOnly}
              >
                <SelectTrigger id="importance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {unit.tags && unit.tags.length > 0 && (
            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2">
                {unit.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium">数据类型：</p>
              <p>{unit.data_type}</p>
            </div>
            <div>
              <p className="font-medium">创建时间：</p>
              <p>
                {new Date(unit.created_at).toLocaleString("zh-CN")}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? "关闭" : "取消"}
          </Button>
          {!readOnly && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存更改
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
