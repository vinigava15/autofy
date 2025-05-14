// Script para testar a conexão com o Supabase
import { createClient } from '@supabase/supabase-js';
//ola
const supabaseUrl = 'https://uosniwpytrymlvmgjqui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvc25pd3B5dHJ5bWx2bWdqcXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MDI3NjYsImV4cCI6MjA1NzQ3ODc2Nn0.R-QmjWgSBdZguJDu9qJJukvPefj4JXkILa4GaD9-kjM';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Testar a conexão
const testConnection = async () => {
  try {
    console.log('Tentando se conectar ao Supabase...');
    
    // Testar leitura da tabela services
    const { data: selectData, error: selectError } = await supabase
      .from('services')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('Erro ao ler dados:', selectError);
    } else {
      console.log('Leitura bem-sucedida:', selectData);
    }
    
    // Testar inserção na tabela services
    const testData = {
      client_name: 'Test Client',
      service_date: new Date().toISOString().split('T')[0],
      car_plate: 'TEST123',
      car_model: 'Test Model',
      service_value: 100,
      repaired_part: 'capo'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('services')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.error('Erro ao inserir dados:', insertError);
    } else {
      console.log('Inserção bem-sucedida:', insertData);
      
      // Limpar dado de teste
      if (insertData && insertData[0] && insertData[0].id) {
        const { error: deleteError } = await supabase
          .from('services')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.error('Erro ao limpar dados de teste:', deleteError);
        } else {
          console.log('Dados de teste removidos com sucesso');
        }
      }
    }
  } catch (err) {
    console.error('Erro ao testar conexão:', err);
  }
};

testConnection(); 