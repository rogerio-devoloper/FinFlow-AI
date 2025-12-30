import { Transaction } from '../types';

export const syncToSheet = async (url: string, transactions: Transaction[]): Promise<boolean> => {
  try {
    // Validates URL roughly
    if (!url.includes('script.google.com')) {
      throw new Error('URL inválida. O link deve começar com script.google.com');
    }

    // Using 'text/plain' avoids the CORS preflight (OPTIONS request) which GAS doesn't handle well.
    // The data is still JSON, but we tell the browser it's text so it sends it directly.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(transactions),
    });

    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao sincronizar com Google Sheets:", error);
    throw error;
  }
};

export const fetchFromSheet = async (url: string): Promise<Transaction[]> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Falha ao buscar dados');
        }
        const data = await response.json();
        
        // Validate if it's an array
        if (!Array.isArray(data)) {
            throw new Error('Formato de dados inválido vindo da planilha');
        }

        return data as Transaction[];
    } catch (error) {
        console.error("Erro ao ler do Google Sheets:", error);
        throw error;
    }
};

export const APPS_SCRIPT_CODE = `
/* 
INSTRUÇÕES DE IMPLANTAÇÃO (IMPORTANTE):
1. Cole este código no editor do Apps Script.
2. Clique em "Implantar" > "Nova implantação".
3. Clique na engrenagem (selecione tipo) > "App da Web".
4. Preencha:
   - Descrição: "Versão 1"
   - Executar como: "Eu" (Me)  <--- MUITO IMPORTANTE
   - Quem pode acessar: "Qualquer pessoa" (Anyone) <--- MUITO IMPORTANTE
5. Clique em "Implantar" e copie o URL gerado (termina em /exec).
*/

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0];
  var rows = data.slice(1);
  
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    
    // Suporte para quando o conteúdo vem como text/plain ou application/json
    var jsonString = e.postData.contents;
    var transactions = JSON.parse(jsonString);
    
    // Limpa a planilha (Database Overwrite)
    sheet.clear();
    
    if (transactions.length > 0) {
      // Pega as chaves do primeiro objeto para criar cabeçalho
      var headers = Object.keys(transactions[0]);
      sheet.appendRow(headers);
      
      // Mapeia os dados para formato de linhas
      var rows = transactions.map(function(t) {
        return headers.map(function(key) {
          // Trata datas ou valores nulos se necessário
          return t[key] === undefined ? "" : t[key];
        });
      });
      
      // Escreve em lote (mais rápido)
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;