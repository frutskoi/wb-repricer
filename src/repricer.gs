/**
 * Wildberries репрайсер – обновляет цены только для региона Москва.
 * Переменные: WB_API_KEY, WB_SUPPLIER_ID, SHEET_ID, REGION_ID_MOSCOW.
 */
const WB_API_KEY = PropertiesService.getScriptProperties().getProperty('WB_API_KEY');
const WB_SUPPLIER_ID = PropertiesService.getScriptProperties().getProperty('WB_SUPPLIER_ID');
const SHEET_ID = 'YOUR_SPREADSHEET_ID'; // заменить ID таблицы
const REGION_ID_MOSCOW = 51;

function runRepricer(){
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('PriceControl');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const nmIdIdx = headers.indexOf('Артикул (nmId)');
  const targetIdx = headers.indexOf('Целевая цена');
  const statusIdx = headers.indexOf('Статус обновления');

  for(let i=1;i<data.length;i++){
    const row = data[i];
    const nmId = row[nmIdIdx];
    const target = row[targetIdx];
    if(!nmId || !target) continue;
    try{
      const pricePayload = [{nmId:nmId, price:target, regionId:REGION_ID_MOSCOW}];
      updatePriceInWB(pricePayload);
      sheet.getRange(i+1, statusIdx+1).setValue('OK '+new Date());
    }catch(e){
      sheet.getRange(i+1, statusIdx+1).setValue('ERR '+e.message);
    }
    Utilities.sleep(500);
  }
}

function updatePriceInWB(prices){
  const url = 'https://discounts-prices-api.wildberries.ru/api/v2/upload/task';
  const options = {
    method:'post',
    contentType:'application/json',
    headers:{'Authorization':WB_API_KEY},
    payload:JSON.stringify({data:prices}),
    muteHttpExceptions:true
  };
  const resp = UrlFetchApp.fetch(url,options);
  const code = resp.getResponseCode();
  if(code!==200){
    throw new Error('WB API '+code+': '+resp.getContentText());
  }
  return JSON.parse(resp.getContentText());
}

function createTimeDrivenTrigger(){
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t=>{if(t.getHandlerFunction()===\'runRepricer\') ScriptApp.deleteTrigger(t);});
  ScriptApp.newTrigger('runRepricer').timeBased().everyMinutes(30).create();
}
