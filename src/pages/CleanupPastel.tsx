import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Temporary cleanup utility page: removes duplicate test transactions
// Criteria: description contains "Pastel" and absolute amount equals 51
// Only affects the currently logged-in user due to RLS.

const CleanupPastel: React.FC = () => {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { deleted: number; cardsUpdated: number; mileageDeleted: number }>(null);

  const runCleanup = useMemo(
    () => async () => {
      if (running) return;
      setRunning(true);
      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userRes.user) {
          toast.error("Não autenticado. Faça login novamente.");
          navigate("/auth");
          return;
        }
        const userId = userRes.user.id;

        // 1) Delete transactions for this user (description ILIKE '%pastel%', amount in [51, -51])
        const { data: deletedTx, error: delErr } = await supabase
          .from("transactions")
          .delete()
          .ilike("description", "%pastel%")
          .in("amount", [51, -51, 51.0])
          .eq("user_id", userId)
          .select("id, card_id, amount, type, payment_method");

        if (delErr) throw delErr;

        const deletedCount = deletedTx?.length || 0;
        if (deletedCount === 0) {
          toast.info("Nada para remover (nenhuma transação 'Pastel' de R$ 51 encontrada).");
          setResult({ deleted: 0, cardsUpdated: 0, mileageDeleted: 0 });
          return;
        }

        // 2) Delete related mileage_history rows for those transactions
        const deletedIds = deletedTx.map((t) => t.id).filter(Boolean);
        let mileageDeleted = 0;
        if (deletedIds.length > 0) {
          const { data: mhDel, error: mhErr } = await supabase
            .from("mileage_history")
            .delete()
            .in("transaction_id", deletedIds)
            .select("id");
          if (mhErr) throw mhErr;
          mileageDeleted = mhDel?.length || 0;
        }

        // 3) Recalculate available/used for affected cards of this user
        const cardIds = Array.from(new Set(deletedTx.map((t) => t.card_id).filter(Boolean)));
        let cardsUpdated = 0;
        for (const cardId of cardIds) {
          // Fetch card data
          const { data: cardRows, error: cardErr } = await supabase
            .from("cards")
            .select("id, credit_limit, initial_balance_original")
            .eq("id", cardId as string)
            .maybeSingle();
          if (cardErr) throw cardErr;
          if (!cardRows) continue;

          // Sum all remaining expenses for this card
          const { data: txRows, error: txErr } = await supabase
            .from("transactions")
            .select("amount")
            .eq("card_id", cardId as string)
            .eq("type", "expense");
          if (txErr) throw txErr;

          const expenseSum = (txRows || []).reduce((acc, t: any) => acc + Number(t.amount || 0), 0);
          const creditLimit = Number(cardRows.credit_limit || 0);
          const initOriginal = Number(cardRows.initial_balance_original || 0);
          const newCurrent = expenseSum;
          const newAvailable = Math.max(0, creditLimit - initOriginal - expenseSum);

          const { error: upErr } = await supabase
            .from("cards")
            .update({ current_balance: newCurrent, initial_balance: newAvailable })
            .eq("id", cardId as string);
          if (upErr) throw upErr;
          cardsUpdated += 1;
        }

        toast.success(`Removidas ${deletedCount} transações. Cartões atualizados: ${cardsUpdated}.`);
        setResult({ deleted: deletedCount, cardsUpdated, mileageDeleted });

        // Pequeno atraso e volta ao app
        setTimeout(() => navigate("/app"), 1200);
      } catch (e: any) {
        console.error("Cleanup error", e);
        toast.error(e?.message || "Falha ao executar limpeza.");
      } finally {
        setRunning(false);
      }
    },
    [navigate, running]
  );

  useEffect(() => {
    runCleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Limpeza de Testes</h1>
      <p>Removendo transações de teste ("Pastel" R$ 51) do seu usuário…</p>
      {result && (
        <div style={{ marginTop: 12 }}>
          <p>Removidas: {result.deleted}</p>
          <p>Cartões atualizados: {result.cardsUpdated}</p>
          <p>Registros de milhas removidos: {result.mileageDeleted}</p>
        </div>
      )}
    </main>
  );
};

export default CleanupPastel;
