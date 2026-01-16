import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Temporary cleanup utility page: removes duplicate Netflix transaction
// and marks the manual future expense as paid
// IDs to clean:
// - Transaction to delete: 1a76c063-e171-4a37-98ec-901bdbb40638 (duplicate Netflix 69.90)
// - Manual expense to mark as paid: fc0ec499-8948-4081-b515-0169c73d4bee (Netflix 69.90 due 09/12/2025)

const CleanupNetflix: React.FC = () => {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { transactionDeleted: boolean; expenseMarkedPaid: boolean }>(null);

  useEffect(() => {
    const runCleanup = async () => {
      if (running) return;
      setRunning(true);
      
      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userRes.user) {
          toast.error("Não autenticado. Faça login novamente.");
          navigate("/auth");
          return;
        }

        let transactionDeleted = false;
        let expenseMarkedPaid = false;

        // 1) Delete the duplicate transaction
        const transactionIdToDelete = "1a76c063-e171-4a37-98ec-901bdbb40638";
        const { error: delTxErr } = await supabase
          .from("transactions")
          .delete()
          .eq("id", transactionIdToDelete);

        if (delTxErr) {
          console.error("Error deleting transaction:", delTxErr);
        } else {
          transactionDeleted = true;
          console.log("Transaction deleted:", transactionIdToDelete);
        }

        // 2) Mark the manual future expense as paid
        const expenseIdToMark = "fc0ec499-8948-4081-b515-0169c73d4bee";
        const { error: updateErr } = await supabase
          .from("manual_future_expenses")
          .update({ is_paid: true, paid_at: new Date().toISOString() })
          .eq("id", expenseIdToMark);

        if (updateErr) {
          console.error("Error updating expense:", updateErr);
        } else {
          expenseMarkedPaid = true;
          console.log("Expense marked as paid:", expenseIdToMark);
        }

        if (transactionDeleted && expenseMarkedPaid) {
          toast.success("Limpeza concluída! Transação duplicada removida e despesa marcada como paga.");
        } else if (transactionDeleted) {
          toast.success("Transação duplicada removida.");
        } else if (expenseMarkedPaid) {
          toast.success("Despesa marcada como paga.");
        } else {
          toast.info("Nenhuma alteração necessária.");
        }

        setResult({ transactionDeleted, expenseMarkedPaid });

        // Return to app after delay
        setTimeout(() => navigate("/app"), 1500);
      } catch (e: any) {
        console.error("Cleanup error", e);
        toast.error(e?.message || "Falha ao executar limpeza.");
      } finally {
        setRunning(false);
      }
    };

    runCleanup();
  }, [navigate, running]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Limpeza Netflix Duplicado</h1>
      <p>Removendo transação duplicada de Netflix R$ 69.90 e marcando despesa como paga…</p>
      {result && (
        <div style={{ marginTop: 12 }}>
          <p>Transação duplicada removida: {result.transactionDeleted ? "Sim" : "Não"}</p>
          <p>Despesa atrasada marcada como paga: {result.expenseMarkedPaid ? "Sim" : "Não"}</p>
        </div>
      )}
    </main>
  );
};

export default CleanupNetflix;
