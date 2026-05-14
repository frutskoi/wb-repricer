// Тест расчёта цен для репрайсера
console.log('🔍 ТЕСТ РАСЧЁТА ЦЕН\n');
console.log('='.repeat(70) + '\n');

// Пример данных из теста получения цен
const sampleGoods = [
  {
    nmID: 151509365,
    vendorCode: "герметонА300337006ш4",
    sizes: [
      {
        sizeID: 253784910,
        price: 150000,
        discountedPrice: 58500,
        clubDiscountedPrice: 58500,
        techSizeName: "0"
      }
    ],
    currencyIsoCode4217: "RUB",
    discount: 61,
    clubDiscount: 0,
    editableSizePrice: false
  },
  {
    nmID: 151509360,
    vendorCode: "герметонА300337006ш3",
    sizes: [
      {
        sizeID: 253784904,
        price: 79866,
        discountedPrice: 31147.74,
        clubDiscountedPrice: 31147.74,
        techSizeName: "0"
      }
    ],
    currencyIsoCode4217: "RUB",
    discount: 61,
    clubDiscount: 0,
    editableSizePrice: false
  }
];

// Функция расчёта цены для репрайсера
function calculateUploadPrice(wbPrice, rrp, discountWB, walletPercent, model) {
  console.log(`\n📊 Расчёт для товара:`);
  console.log(`   Цена в ЛК WB: ${wbPrice} руб`);
  console.log(`   РРЦ: ${rrp} руб`);
  console.log(`   Скидка WB: ${discountWB}%`);
  console.log(`   % кошелька: ${walletPercent}%`);
  console.log(`   Модель удержания: ${model}`);
  
  let uploadPrice;
  let strategy = '';
  
  if (model === 'С кошельком ВБ') {
    // Модель с кошельком: учитываем доп. скидку WB Club
    const walletPrice = wbPrice * (1 - walletPercent / 100);
    console.log(`   Цена с учётом кошелька: ${walletPrice.toFixed(2)} руб`);
    
    // Стратегия: цена между РРЦ и ценой с кошельком
    if (rrp && rrp > 0) {
      uploadPrice = Math.min(rrp, walletPrice);
      strategy = `min(РРЦ, с кошельком)`;
    } else {
      uploadPrice = walletPrice;
      strategy = `цена с кошельком`;
    }
  } else {
    // Модель без кошелька: не учитываем кошелёк
    console.log(`   Без учёта кошелька`);
    
    // Стратегия: цена между РРЦ и ценой в ЛК
    if (rrp && rrp > 0) {
      uploadPrice = Math.min(rrp, wbPrice);
      strategy = `min(РРЦ, ЛК WB)`;
    } else {
      uploadPrice = wbPrice;
      strategy = `цена в ЛК WB`;
    }
  }
  
  // Округляем до целого
  uploadPrice = Math.round(uploadPrice);
  
  console.log(`   Стратегия: ${strategy}`);
  console.log(`   💰 Загружаемая цена: ${uploadPrice} руб`);
  
  return uploadPrice;
}

// Тестируем на реальных данных
console.log('📦 ПРИМЕР 1: Товар с РРЦ, модель "С кошельком ВБ"\n');
calculateUploadPrice(
  150000,  // цена в ЛК WB
  100000,  // РРЦ
  61,      // скидка WB
  5,       // % кошелька
  'С кошельком ВБ'
);

console.log('\n' + '='.repeat(70) + '\n');

console.log('📦 ПРИМЕР 2: Товар без РРЦ, модель "Без кошелька ВБ"\n');
calculateUploadPrice(
  79866,   // цена в ЛК WB
  0,       // нет РРЦ
  61,      // скидка WB
  5,       // % кошелька
  'Без кошелька ВБ'
);

console.log('\n' + '='.repeat(70) + '\n');

// Показываем расчёт для всех тестовых товаров
console.log('📊 РАСЧЁТ ДЛЯ ВСЕХ ТОВАРОВ:\n');

sampleGoods.forEach((goods, index) => {
  const size = goods.sizes[0];
  console.log(`${index + 1}. ${goods.vendorCode}`);
  console.log(`   nmID: ${goods.nmID}`);
  console.log(`   Цена в ЛК: ${size.price} руб`);
  console.log(`   Цена со скидкой: ${size.discountedPrice} руб`);
  console.log(`   Скидка WB: ${goods.discount}%`);
  
  // Пример расчёта
  const uploadPrice = calculateUploadPrice(
    size.price,
    90000,  // примерный РРЦ
    goods.discount,
    5,
    'С кошельком ВБ'
  );
  
  console.log('');
});

console.log('='.repeat(70));

// Формулы расчёта
console.log('\n📝 ФОРМУЛЫ РАСЧЁТА:\n');

console.log('1. Цена с кошельком:');
console.log('   walletPrice = wbPrice × (1 - walletPercent / 100)');
console.log('   Пример: 150000 × (1 - 0.05) = 142500 руб');

console.log('\n2. Скидка WB:');
console.log('   wbDiscount = (wbPrice - discountedPrice) / wbPrice × 100');
console.log('   Пример: (150000 - 58500) / 150000 × 100 = 61%');

console.log('\n3. % кошелька:');
console.log('   walletPercent = (priceWithWallet - priceNoWallet) / priceNoWallet × 100');
console.log('   Пример: (142500 - 150000) / 150000 × 100 = -5%');

console.log('\n4. Загружаемая цена (с кошельком):');
console.log('   uploadPrice = min(RRP, walletPrice)');
console.log('   Пример: min(100000, 142500) = 100000 руб');

console.log('\n5. Загружаемая цена (без кошелька):');
console.log('   uploadPrice = min(RRP, wbPrice)');
console.log('   Пример: min(100000, 150000) = 100000 руб');

console.log('\n' + '='.repeat(70));