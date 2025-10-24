import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import { KnowledgeEditDialog } from "./KnowledgeEditDialog";
import { KnowledgeDeleteDialog } from "./KnowledgeDeleteDialog";
import { Skeleton } from "@/components/ui/skeleton";

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

interface KnowledgeTableProps {
  data: KnowledgeUnit[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function KnowledgeTable({ data, isLoading, onRefresh }: KnowledgeTableProps) {
  const [selectedUnit, setSelectedUnit] = useState<KnowledgeUnit | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: "通用",
      intervention: "干预",
      communication: "沟通",
      behavior: "行为",
      social_skills: "社交技能",
      sensory: "感官",
    };
    return labels[category] || category;
  };

  const getImportanceColor = (importance: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500/10 text-blue-500",
      medium: "bg-yellow-500/10 text-yellow-500",
      high: "bg-red-500/10 text-red-500",
    };
    return colors[importance] || "bg-gray-500/10 text-gray-500";
  };

  const getImportanceLabel = (importance: string) => {
    const labels: Record<string, string> = {
      low: "低",
      medium: "中",
      high: "高",
    };
    return labels[importance] || importance;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleView = (unit: KnowledgeUnit) => {
    setSelectedUnit(unit);
    setViewDialogOpen(true);
  };

  const handleEdit = (unit: KnowledgeUnit) => {
    setSelectedUnit(unit);
    setEditDialogOpen(true);
  };

  const handleDelete = (unit: KnowledgeUnit) => {
    setSelectedUnit(unit);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>暂无知识单元</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">内容</TableHead>
              <TableHead>类别</TableHead>
              <TableHead>重要性</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell className="font-medium">
                  <div className="max-w-md truncate">{unit.content}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getCategoryLabel(unit.category)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getImportanceColor(unit.importance)}>
                    {getImportanceLabel(unit.importance)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{unit.data_type}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(unit.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(unit)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(unit)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(unit)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedUnit && (
        <>
          <KnowledgeEditDialog
            unit={selectedUnit}
            open={editDialogOpen || viewDialogOpen}
            onOpenChange={viewDialogOpen ? setViewDialogOpen : setEditDialogOpen}
            onSuccess={() => {
              onRefresh();
              setEditDialogOpen(false);
              setViewDialogOpen(false);
            }}
            readOnly={viewDialogOpen}
          />
          <KnowledgeDeleteDialog
            unit={selectedUnit}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onSuccess={() => {
              onRefresh();
              setDeleteDialogOpen(false);
            }}
          />
        </>
      )}
    </>
  );
}
