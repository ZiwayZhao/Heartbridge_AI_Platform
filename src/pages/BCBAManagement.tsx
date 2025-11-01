import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BCBAConsultant {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  specialties: string[] | null;
  contact_email: string | null;
  contact_phone: string | null;
  pricing: string | null;
  experience_years: number | null;
  avatar_url: string | null;
  is_active: boolean;
  display_order: number;
}

export default function BCBAManagement() {
  const [consultants, setConsultants] = useState<BCBAConsultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<BCBAConsultant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    specialties: '',
    contact_email: '',
    contact_phone: '',
    pricing: '',
    experience_years: '',
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('bcba_consultants')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setConsultants(data || []);
    } catch (error: any) {
      console.error('Error fetching consultants:', error);
      toast({
        title: '错误',
        description: '加载咨询师失败',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedConsultant(null);
    setFormData({
      name: '',
      title: '',
      bio: '',
      specialties: '',
      contact_email: '',
      contact_phone: '',
      pricing: '',
      experience_years: '',
      is_active: true,
      display_order: 0
    });
    setDialogOpen(true);
  };

  const handleEdit = (consultant: BCBAConsultant) => {
    setSelectedConsultant(consultant);
    setFormData({
      name: consultant.name,
      title: consultant.title || '',
      bio: consultant.bio || '',
      specialties: consultant.specialties?.join(', ') || '',
      contact_email: consultant.contact_email || '',
      contact_phone: consultant.contact_phone || '',
      pricing: consultant.pricing || '',
      experience_years: consultant.experience_years?.toString() || '',
      is_active: consultant.is_active,
      display_order: consultant.display_order
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const consultantData = {
        name: formData.name,
        title: formData.title || null,
        bio: formData.bio || null,
        specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        pricing: formData.pricing || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        is_active: formData.is_active,
        display_order: formData.display_order
      };

      if (selectedConsultant) {
        const { error } = await supabase
          .from('bcba_consultants')
          .update(consultantData)
          .eq('id', selectedConsultant.id);

        if (error) throw error;
        toast({ title: '成功', description: '咨询师信息已更新' });
      } else {
        const { error } = await supabase
          .from('bcba_consultants')
          .insert([consultantData]);

        if (error) throw error;
        toast({ title: '成功', description: '咨询师已添加' });
      }

      setDialogOpen(false);
      fetchConsultants();
    } catch (error: any) {
      console.error('Error saving consultant:', error);
      toast({
        title: '错误',
        description: '保存失败',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedConsultant) return;

    try {
      const { error } = await supabase
        .from('bcba_consultants')
        .delete()
        .eq('id', selectedConsultant.id);

      if (error) throw error;
      toast({ title: '成功', description: '咨询师已删除' });
      setDeleteDialogOpen(false);
      fetchConsultants();
    } catch (error: any) {
      console.error('Error deleting consultant:', error);
      toast({
        title: '错误',
        description: '删除失败',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">BCBA 咨询师管理</h1>
          <p className="text-muted-foreground">管理平台上的专业咨询师信息</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          添加咨询师
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {consultants.map(consultant => (
            <Card key={consultant.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{consultant.name}</CardTitle>
                    <CardDescription>{consultant.title}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(consultant)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedConsultant(consultant);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">联系邮箱：</span>
                    <p>{consultant.contact_email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">联系电话：</span>
                    <p>{consultant.contact_phone || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">从业年限：</span>
                    <p>{consultant.experience_years ? `${consultant.experience_years}年` : '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">状态：</span>
                    <p>{consultant.is_active ? '激活' : '未激活'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedConsultant ? '编辑咨询师' : '添加咨询师'}</DialogTitle>
            <DialogDescription>填写咨询师的详细信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">职称</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="specialties">专长领域（用逗号分隔）</Label>
              <Input
                id="specialties"
                value={formData.specialties}
                onChange={e => setFormData({ ...formData, specialties: e.target.value })}
                placeholder="例如：ABA行为分析, 语言发展, 社交技能"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">联系邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact_email}
                  onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">联系电话</Label>
                <Input
                  id="phone"
                  value={formData.contact_phone}
                  onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pricing">收费标准</Label>
                <Input
                  id="pricing"
                  value={formData.pricing}
                  onChange={e => setFormData({ ...formData, pricing: e.target.value })}
                  placeholder="例如：500元/小时"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="experience">从业年限</Label>
                <Input
                  id="experience"
                  type="number"
                  value={formData.experience_years}
                  onChange={e => setFormData({ ...formData, experience_years: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="display_order">显示顺序</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="active">激活状态</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={!formData.name}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除咨询师 "{selectedConsultant?.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
