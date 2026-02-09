import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useInvalidateFinancialData } from '@/hooks/useInvalidateFinancialData';
import { useToast } from '@/hooks/use-toast';

interface Subcategory {
  id: string;
  name: string;
  name_en: string | null;
  name_es: string | null;
}

interface AddFutureIncomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (income: any) => Promise<void>;
}

export const AddFutureIncomeModal = ({ open, onOpenChange, onAdd }: AddFutureIncomeModalProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { invalidateAll } = useInvalidateFinancialData();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [ownerNames, setOwnerNames] = useState<{ user1: string | null; user2: string | null }>({ user1: null, user2: null });
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    category_id: '',
    subcategory_id: '',
    account_id: '',
    payment_method: 'cash',
    notes: '',
  });

  const getLocalizedSubcategoryName = (sub: Subcategory) => {
    if (language === 'en' && sub.name_en) return sub.name_en;
    if (language === 'es' && sub.name_es) return sub.name_es;
    return sub.name;
  };

  useEffect(() => {
    if (open && user) {
      fetchCategories();
      fetchAccounts();
      fetchOwnerNames();
    }
  }, [open, user]);

  // Fix timing: depend on both category_id AND categories being loaded
  useEffect(() => {
    if (formData.category_id && categories.length > 0) {
      fetchSubcategories(formData.category_id);
    } else if (!formData.category_id) {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
    }
  }, [formData.category_id, categories]);

  const fetchCategories = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('categories')
      .select('id, name, color, icon')
      .eq('user_id', user.id)
      .eq('category_type', 'income')
      .order('name');

    if (data) setCategories(data);
  };

  const fetchSubcategories = async (categoryId: string) => {
    if (!categoryId || !user) {
      setSubcategories([]);
      return;
    }

    setSubcategoriesLoading(true);
    
    try {
      // Get selected category - first from state, fallback to DB
      let categoryName = categories.find(c => c.id === categoryId)?.name;
      
      if (!categoryName) {
        // Fallback: fetch category name directly from DB
        const { data: categoryData } = await supabase
          .from('categories')
          .select('name')
          .eq('id', categoryId)
          .single();
        
        if (!categoryData) {
          setSubcategories([]);
          setSubcategoriesLoading(false);
          return;
        }
        categoryName = categoryData.name;
      }

      // Get couple info to include partner's subcategories
      const { data: coupleData } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      const userIds = coupleData ? [coupleData.user1_id, coupleData.user2_id] : [user.id];

      // Find all equivalent categories (same name) from the couple
      const { data: equivalentCategories } = await supabase
        .from('categories')
        .select('id')
        .in('user_id', userIds)
        .eq('name', categoryName)
        .eq('category_type', 'income');

      const categoryIds = equivalentCategories?.map(c => c.id) || [categoryId];

      // Fetch subcategories from all equivalent categories
      const { data } = await supabase
        .from('subcategories')
        .select('id, name, name_en, name_es')
        .in('category_id', categoryIds)
        .is('deleted_at', null)
        .order('name');

      // Deduplicate by name (lowercase)
      const uniqueSubs = new Map<string, Subcategory>();
      (data || []).forEach(sub => {
        const key = sub.name.toLowerCase();
        if (!uniqueSubs.has(key)) {
          uniqueSubs.set(key, sub);
        }
      });

      setSubcategories(Array.from(uniqueSubs.values()));
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const fetchAccounts = async () => {
    if (!user) return;

    // Get couple info to include partner's accounts
    const { data: coupleData } = await supabase
      .from('user_couples')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .maybeSingle();

    const userIds = coupleData ? [coupleData.user1_id, coupleData.user2_id] : [user.id];

    const { data } = await supabase
      .from('accounts')
      .select('id, name, account_type, owner_user')
      .in('user_id', userIds)
      .eq('is_active', true)
      .order('name');

    if (data) setAccounts(data);
  };

  const fetchOwnerNames = async () => {
    if (!user) return;

    try {
      const { data: coupleData } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      if (coupleData) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', [coupleData.user1_id, coupleData.user2_id]);

        if (profiles) {
          const user1Profile = profiles.find(p => p.id === coupleData.user1_id);
          const user2Profile = profiles.find(p => p.id === coupleData.user2_id);
          
          const getFirstName = (profile: { id: string; display_name: string | null } | undefined) => {
            const name = profile?.display_name;
            return name ? name.split(' ')[0] : null;
          };
          
          setOwnerNames({
            user1: getFirstName(user1Profile),
            user2: getFirstName(user2Profile)
          });
        }
      }
    } catch (error) {
      console.error('Error fetching owner names:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine owner_user based on couple relationship
      const { data: coupleData } = await supabase
        .from('user_couples')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)
        .eq('status', 'active')
        .maybeSingle();
      
      const ownerUser = coupleData?.user1_id === user!.id ? 'user1' : 
                       coupleData?.user2_id === user!.id ? 'user2' : 'user1';
      
      await onAdd({
        ...formData,
        amount: parseFloat(formData.amount),
        owner_user: ownerUser,
      });

      // Invalidate all queries to update dashboard immediately
      await invalidateAll();
      
      toast({
        title: "✓ " + t('success'),
        description: t('futureIncomes.addSuccess') || "Receita futura adicionada com sucesso",
        duration: 3000,
      });

      setFormData({
        description: '',
        amount: '',
        due_date: '',
        category_id: '',
        subcategory_id: '',
        account_id: '',
        payment_method: 'cash',
        notes: '',
      });
      setSubcategories([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding future income:', error);
      toast({
        title: t('error'),
        description: t('futureIncomes.addError') || "Erro ao adicionar receita futura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('futureIncomes.addTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">{t('futureIncomes.description')}</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder={t('futureIncomes.descriptionPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="amount">{t('futureIncomes.amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="due_date">{t('futureIncomes.dueDate')}</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">{t('futureIncomes.category')}</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value, subcategory_id: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('futureIncomes.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.category_id && (
            <div>
              <Label htmlFor="subcategory">{t('futureIncomes.subcategory')}</Label>
              {subcategoriesLoading ? (
                <p className="text-sm text-muted-foreground py-2">{t('common.loading')}</p>
              ) : subcategories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">{t('futureIncomes.noSubcategories')}</p>
              ) : (
                <Select
                  value={formData.subcategory_id}
                  onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('futureIncomes.subcategoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {getLocalizedSubcategoryName(sub)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="account">{t('futureIncomes.account')}</Label>
            <Select
              value={formData.account_id}
              onValueChange={(value) => setFormData({ ...formData, account_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('futureIncomes.selectAccount')} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => {
                  const ownerDisplayName = acc.owner_user === 'user1' 
                    ? ownerNames.user1 
                    : acc.owner_user === 'user2' 
                      ? ownerNames.user2 
                      : null;
                  
                  return (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                      {ownerDisplayName && (
                        <span className="text-muted-foreground ml-1">• {ownerDisplayName}</span>
                      )}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="payment_method">{t('futureIncomes.paymentMethod')}</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">{t('transactionForm.cash')}</SelectItem>
                <SelectItem value="deposit">{t('transactionForm.deposit')}</SelectItem>
                <SelectItem value="transfer">{t('transactionForm.receivedTransfer')}</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="check">{t('converter.paymentMethods.check')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">{t('futureIncomes.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('futureIncomes.notesPlaceholder')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
