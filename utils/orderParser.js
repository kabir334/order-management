(function (global) {
  const config = global.ORDER_FIELD_CONFIG || {
    DEFAULT_FIELD_SEQUENCE: ['name', 'mobile', 'address', 'shoeModel', 'size', 'price'],
    FIELD_ORDER: ['name', 'mobile', 'address', 'shoeModel', 'size', 'price'],
    ACCESSORY_OPTIONS: ['Lace', 'Socks', 'Bag', 'Box'],
  };

  const makeDefaultOrder = () => ({
    name: '',
    mobile: '',
    address: '',
    shoeModel: '',
    size: '',
    price: '',
    deliveryChargePaid: false,
    accessories: [],
    orderDate: getTodayIso(),
  });

  function getTodayIso() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function normalizeText(value = '') {
    return String(value).trim();
  }

  function normalizeSizeValue(value = '') {
    const raw = normalizeText(value);
    if (!raw) return '';
    const parsed = Number.parseInt(raw.replace(/[^0-9-]/g, ''), 10);
    return Number.isInteger(parsed) ? parsed : raw;
  }

  function detectFieldKey(key) {
    const cleanedKey = String(key || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const patterns = {
      name: ['name', 'customer name'],
      mobile: ['phone', 'mobile', 'customer no', 'phone number', 'contact', 'email'],
      address: ['address', 'delivery address', 'delivary address', 'company', 'location'],
      shoeModel: ['shoe name', 'shoe model', 'product', 'model', 'description'],
      size: ['size'],
      price: ['price', 'pp', 'amount'],
      deliveryChargePaid: ['delivery charge paid', 'delivery charge', 'charge paid', 'paid status'],
      accessories: ['additional accessories', 'accessories'],
      orderDate: ['order date', 'date'],
    };

    for (const [fieldKey, possiblePatterns] of Object.entries(patterns)) {
      if (possiblePatterns.some((pattern) => cleanedKey === pattern || cleanedKey.includes(pattern))) {
        return fieldKey;
      }
    }

    return null;
  }

  function parseOrderMessage(message = '') {
    const parsed = makeDefaultOrder();
    const sourceText = String(message || '');
    const lines = sourceText
      .split(/\r?\n/)
      .map((line) => normalizeText(line))
      .filter(Boolean);

    if (!lines.length) {
      return parsed;
    }

    const fieldKeys = [...(config.FIELD_ORDER || config.DEFAULT_FIELD_SEQUENCE || [])];
    const processableLines = lines.slice(0, fieldKeys.length);

    processableLines.forEach((line, index) => {
      const defaultFieldKey = fieldKeys[index % fieldKeys.length] || 'name';
      const explicitMatch = line.match(/^([^:\n]+?)\s*[:\-]\s*(.+)$/);
      const candidateKey = explicitMatch ? detectFieldKey(explicitMatch[1].toLowerCase()) : defaultFieldKey;
      const fieldKey = candidateKey && fieldKeys.includes(candidateKey) ? candidateKey : defaultFieldKey;
      const rawValue = explicitMatch ? normalizeText(explicitMatch[2]) : line;
      const value = fieldKey === 'size' ? normalizeSizeValue(rawValue) : rawValue;
      parsed[fieldKey] = value;
    });

    return parsed;
  }

  const ORDER_PARSER = {
    getTodayIso,
    normalizeText,
    normalizeSizeValue,
    detectFieldKey,
    parseOrderMessage,
    buildDefaultOrder: makeDefaultOrder,
  };

  global.ORDER_PARSER = ORDER_PARSER;
  global.ORDER_MANAGEMENT = global.ORDER_MANAGEMENT || {};
  global.ORDER_MANAGEMENT.parser = ORDER_PARSER;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ORDER_PARSER;
  }
})(typeof window !== 'undefined' ? window : globalThis);
