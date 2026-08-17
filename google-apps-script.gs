/**
 * Mandrill Hub — Captura de leads → Google Sheets
 * ------------------------------------------------
 * Cole este código no editor de Apps Script de uma Planilha Google.
 * Ele recebe cada lead da landing page e adiciona uma linha na aba "Leads".
 *
 * Passo a passo completo no README.md.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads')
             || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Leads');

    // Cria o cabeçalho na primeira vez
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Data/Hora', 'Nome', 'Produtora', 'Cidade/UF',
        'E-mail', 'WhatsApp', 'Tamanho equipe', 'Mensagem', 'Origem'
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    }

    var d = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),
      d.nome || '',
      d.produtora || '',
      d.cidade || '',
      d.email || '',
      d.whatsapp || '',
      d.tamanho || '',
      d.mensagem || '',
      d.origem || 'landing-hub'
    ]);

    // (Opcional) avisa você por e-mail a cada novo lead.
    // Descomente e ajuste o endereço:
    // MailApp.sendEmail('suporte@mandrill.com.br',
    //   'Novo lead Mandrill Hub: ' + (d.produtora || d.nome),
    //   'Nome: ' + d.nome + '\nProdutora: ' + d.produtora +
    //   '\nCidade: ' + d.cidade + '\nE-mail: ' + d.email +
    //   '\nWhatsApp: ' + d.whatsapp + '\nEquipe: ' + d.tamanho +
    //   '\nMensagem: ' + d.mensagem);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Permite um GET simples só pra testar se o Web App está no ar.
function doGet() {
  return ContentService.createTextOutput('Mandrill Hub — captura de leads ativa.');
}
