import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar todos os investimentos com auto_calculate_yield = true
    const { data: investments, error: investmentError } = await supabaseClient
      .from('investments')
      .select('*')
      .eq('auto_calculate_yield', true)
      .not('yield_type', 'is', null)
      .not('yield_value', 'is', null)

    if (investmentError) {
      throw investmentError
    }

    console.log(`Found ${investments?.length || 0} investments with auto yield calculation`)

    const updates = []
    const today = new Date()

    for (const investment of investments || []) {
      const purchaseDate = new Date(investment.purchase_date)
      const lastYieldDate = investment.last_yield_date ? new Date(investment.last_yield_date) : purchaseDate
      
      // Calcular quantos meses completos se passaram desde a última aplicação de rendimento
      const monthsSinceLastYield = getMonthsDifference(lastYieldDate, today)
      
      if (monthsSinceLastYield >= 1) {
        let newCurrentValue = investment.current_value
        let calculationDate = new Date(lastYieldDate)
        let monthsToCalculate = monthsSinceLastYield
        
        // Aplicar rendimento para cada mês completo
        for (let i = 0; i < monthsToCalculate; i++) {
          calculationDate = addMonths(calculationDate, 1)
          
          if (investment.yield_type === 'percentage') {
            // Aplicar percentual sobre o valor atual
            const yieldAmount = (newCurrentValue * investment.yield_value) / 100
            newCurrentValue += yieldAmount
          } else if (investment.yield_type === 'fixed_amount') {
            // Adicionar valor fixo
            newCurrentValue += investment.yield_value
          }
        }
        
        // Atualizar o investimento
        const { error: updateError } = await supabaseClient
          .from('investments')
          .update({
            current_value: newCurrentValue,
            last_yield_date: calculationDate.toISOString().split('T')[0]
          })
          .eq('id', investment.id)

        if (updateError) {
          console.error(`Error updating investment ${investment.id}:`, updateError)
        } else {
          updates.push({
            id: investment.id,
            name: investment.name,
            oldValue: investment.current_value,
            newValue: newCurrentValue,
            monthsCalculated: monthsToCalculate
          })
          console.log(`Updated investment ${investment.name}: ${investment.current_value} -> ${newCurrentValue} (${monthsToCalculate} months)`)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${investments?.length || 0} investments`,
        updates: updates,
        updatedCount: updates.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in calculate-investment-yields:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function getMonthsDifference(startDate: Date, endDate: Date): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  
  let months = (end.getFullYear() - start.getFullYear()) * 12
  months += end.getMonth() - start.getMonth()
  
  // Se o dia do mês atual for menor que o dia de início, subtrair um mês
  if (end.getDate() < start.getDate()) {
    months--
  }
  
  return Math.max(0, months)
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  
  // Ajustar para o último dia do mês se necessário
  if (result.getDate() !== date.getDate()) {
    result.setDate(0) // Último dia do mês anterior
  }
  
  return result
}