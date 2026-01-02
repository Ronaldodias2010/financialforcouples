import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TaxDocument {
  id: string;
  user_id: string;
  tax_year: number;
  transaction_id: string | null;
  category: string;
  document_url: string;
  document_name: string;
  amount: number | null;
  provider_name: string | null;
  provider_cpf_cnpj: string | null;
  owner_user: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentParams {
  file: File;
  taxYear: number;
  category: string;
  amount?: number;
  providerName?: string;
  providerCpfCnpj?: string;
  notes?: string;
  ownerUser?: string;
}

export function useTaxDocuments(taxYear: number) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch documents for tax year
  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['tax-documents', taxYear],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('tax_deduction_documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('tax_year', taxYear)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TaxDocument[];
    }
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (params: UploadDocumentParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      setUploadProgress(10);

      // Sanitize file name
      const sanitizedName = params.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const filePath = `${user.id}/${params.taxYear}/${params.category}/${timestamp}_${sanitizedName}`;

      setUploadProgress(30);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tax-documents')
        .upload(filePath, params.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(70);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('tax-documents')
        .getPublicUrl(filePath);

      // Insert record in database
      const { data: docData, error: dbError } = await supabase
        .from('tax_deduction_documents')
        .insert({
          user_id: user.id,
          tax_year: params.taxYear,
          category: params.category,
          document_url: urlData.publicUrl,
          document_name: params.file.name,
          amount: params.amount || null,
          provider_name: params.providerName || null,
          provider_cpf_cnpj: params.providerCpfCnpj || null,
          notes: params.notes || null,
          owner_user: params.ownerUser || 'user1',
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);
      return docData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-documents', taxYear] });
      toast.success('Documento anexado com sucesso!');
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Erro ao anexar documento');
      setUploadProgress(0);
    }
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const doc = documents?.find(d => d.id === documentId);
      if (!doc) throw new Error('Documento não encontrado');

      // Extract file path from URL
      const urlParts = doc.document_url.split('/tax-documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('tax-documents')
          .remove([filePath]);

        if (storageError) console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('tax_deduction_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-documents', taxYear] });
      toast.success('Documento removido');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Erro ao remover documento');
    }
  });

  // Get documents by category
  const getDocumentsByCategory = (category: string) => {
    return documents?.filter(d => d.category === category) || [];
  };

  // Get document count by category
  const getDocumentCountByCategory = (category: string) => {
    return getDocumentsByCategory(category).length;
  };

  // Get total amount by category
  const getTotalAmountByCategory = (category: string) => {
    return getDocumentsByCategory(category)
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  };

  return {
    documents: documents || [],
    isLoading,
    uploadProgress,
    uploadDocument: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    getDocumentsByCategory,
    getDocumentCountByCategory,
    getTotalAmountByCategory,
    refetch
  };
}
