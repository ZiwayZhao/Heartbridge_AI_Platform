import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import Layout from '@/components/Layout';

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
  display_order: number;
}

const translations = {
  en: {
    title: 'BCBA Consultants',
    subtitle: 'Professional autism intervention consultants',
    specialties: 'Specialties',
    experience: 'years of experience',
    pricing: 'Pricing',
    contact: 'Contact',
    noConsultants: 'No consultants available at the moment.',
    error: 'Error',
    loadError: 'Failed to load consultants'
  },
  zh: {
    title: 'BCBA 专业咨询师',
    subtitle: '专业自闭症干预咨询师',
    specialties: '专长领域',
    experience: '年从业经验',
    pricing: '收费标准',
    contact: '联系方式',
    noConsultants: '暂无可用咨询师',
    error: '错误',
    loadError: '加载咨询师失败'
  }
};

export default function BCBAConsultants() {
  const { language } = useLanguage();
  const t = translations[language];
  const [consultants, setConsultants] = useState<BCBAConsultant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('bcba_consultants')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setConsultants(data || []);
    } catch (error: any) {
      console.error('Error fetching consultants:', error);
      toast({
        title: t.error,
        description: t.loadError,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        {consultants.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {t.noConsultants}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {consultants.map(consultant => (
              <Card key={consultant.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                      {consultant.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{consultant.name}</CardTitle>
                      {consultant.title && (
                        <CardDescription className="text-sm">{consultant.title}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {consultant.experience_years && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{consultant.experience_years} {t.experience}</span>
                    </div>
                  )}

                  {consultant.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{consultant.bio}</p>
                  )}

                  {consultant.specialties && consultant.specialties.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2 text-muted-foreground">{t.specialties}</p>
                      <div className="flex flex-wrap gap-2">
                        {consultant.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {consultant.pricing && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium mb-1 text-muted-foreground">{t.pricing}</p>
                      <p className="text-sm font-semibold">{consultant.pricing}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{t.contact}</p>
                    {consultant.contact_email && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => window.location.href = `mailto:${consultant.contact_email}`}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {consultant.contact_email}
                      </Button>
                    )}
                    {consultant.contact_phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => window.location.href = `tel:${consultant.contact_phone}`}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {consultant.contact_phone}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
