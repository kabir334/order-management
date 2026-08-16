const APP_CONFIG = {
  LOGIN_USERNAME: 'admin',
  LOGIN_PASSWORD: 'order123',
  COOKIE_NAME: 'order_management_auth',
  COOKIE_DAYS: 7,
  SHEET_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbx4geownZAl5p18UAMNblXbLs3zbCWEdOVIfba0nIf4kq7bBwuXhzCsdm5SMf-NjX9zZg/exec',
};

const DEFAULT_FIELD_SEQUENCE = ['name', 'mobile', 'address', 'shoeModel', 'size', 'price'];

const UTILS = {
  FIELD_ORDER: [...DEFAULT_FIELD_SEQUENCE],

  FIELD_OPTIONS: [
    { key: 'name', label: 'Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'address', label: 'Address' },
    { key: 'shoeModel', label: 'Shoe model' },
    { key: 'size', label: 'Size' },
    { key: 'price', label: 'Price' },
    { key: 'deliveryChargePaid', label: 'Delivery charge paid' },
    { key: 'accessories', label: 'Additional accessories' },
    { key: 'orderDate', label: 'Order date' },
  ],

  FIELD_DEFINITIONS: {
    name: {
      label: 'Name',
      type: 'text',
      placeholder: 'Customer name',
      required: true,
    },
    mobile: {
      label: 'Mobile',
      type: 'text',
      placeholder: 'Customer no',
      required: true,
    },
    address: {
      label: 'Address',
      type: 'textarea',
      placeholder: 'Delivery address',
      required: true,
    },
    shoeModel: {
      label: 'Shoe model',
      type: 'text',
      placeholder: 'Product',
      required: true,
    },
    size: {
      label: 'Size',
      type: 'text',
      placeholder: 'Size',
      required: true,
    },
    price: {
      label: 'Price',
      type: 'number',
      placeholder: 'Order price',
      required: true,
    },
    deliveryChargePaid: {
      label: 'Delivery charge paid',
      type: 'toggle',
      required: false,
      defaultValue: false,
    },
    accessories: {
      label: 'Additional accessories',
      type: 'checkbox-group',
      required: false,
      options: ['Lace', 'Socks', 'Bag', 'Box'],
    },
    orderDate: {
      label: 'Order date',
      type: 'date',
      required: false,
      defaultValue: UTILS_GET_TODAY_ISO(),
    },
  },

  GOOGLE_SHEET_FIELD_MAP: {
    name: 'Customer name',
    mobile: 'Customer no',
    address: 'Delivery address',
    shoeModel: 'Product',
    size: 'Size',
    price: 'Order Price',
    deliveryChargePaid: 'Delivery charge paid status',
    accessories: 'Additional accessories',
    orderDate: 'Order date',
  },

  ACCESSORY_OPTIONS: ['Lace', 'Socks', 'Bag', 'Box'],

  normalizeText(value = '') {
    return String(value).trim();
  },

  safeLower(value = '') {
    return String(value).toLowerCase().trim();
  },

  getCookie(name) {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
  },

  setCookie(name, value, days) {
    const expiry = new Date();
    expiry.setTime(expiry.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
  },

  deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  },

  buildDefaultOrder() {
    const today = UTILS_GET_TODAY_ISO();
    return {
      name: '',
      mobile: '',
      address: '',
      shoeModel: '',
      size: '',
      price: '',
      deliveryChargePaid: false,
      accessories: [],
      orderDate: today,
    };
  },

  parseOrderMessage(message = '') {
    const parsed = UTILS.buildDefaultOrder();
    const sourceText = String(message || '');
    const lines = sourceText
      .split(/\r?\n/)
      .map((line) => UTILS.normalizeText(line))
      .filter(Boolean);

    if (!lines.length) {
      state.formRows = buildDefaultFormRows(parsed);
      return parsed;
    }

    lines.forEach((line, index) => {
      const defaultFieldKey = DEFAULT_FIELD_SEQUENCE[index % DEFAULT_FIELD_SEQUENCE.length] || 'name';
      const explicitMatch = line.match(/^([^:\n]+?)\s*[:\-]\s*(.+)$/);
      const fieldKey = explicitMatch ? UTILS.detectFieldKey(explicitMatch[1].toLowerCase()) : defaultFieldKey;
      const value = explicitMatch ? UTILS.normalizeText(explicitMatch[2]) : line;
      const targetField = (fieldKey && UTILS.FIELD_ORDER.includes(fieldKey)) ? fieldKey : defaultFieldKey;

      parsed[targetField] = value;
    });

    state.formRows = lines.map((line, index) => ({
      id: `parsed-${index}`,
      fieldKey: DEFAULT_FIELD_SEQUENCE[index % DEFAULT_FIELD_SEQUENCE.length] || 'name',
      value: line,
    }));

    return parsed;
  },

  detectFieldKey(key) {
    const cleanedKey = String(key || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const fieldPatterns = {
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

    for (const [fieldKey, patterns] of Object.entries(fieldPatterns)) {
      if (patterns.some((pattern) => cleanedKey === pattern || cleanedKey.includes(pattern))) {
        return fieldKey;
      }
    }

    return null;
  },

  extractAccessories(value) {
    const selected = [];
    UTILS.ACCESSORY_OPTIONS.forEach((option) => {
      const normalizedOption = option.toLowerCase();
      if (new RegExp(normalizedOption, 'i').test(value) || value.toLowerCase().includes(normalizedOption.toLowerCase())) {
        selected.push(option);
      }
    });
    return selected;
  },

  normalizeDateInput(value) {
    const raw = UTILS.normalizeText(value);
    if (!raw) return null;

    const match = raw.match(/(\d{4}-\d{2}-\d{2})|((\d{1,2})\/(\d{1,2})\/(\d{2,4}))/);
    if (!match) return null;

    const isoCandidate = match[1] || UTILS.convertSlashDateToIso(match[2]);
    return isoCandidate || null;
  },

  convertSlashDateToIso(value) {
    if (!value) return null;
    const parts = value.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  },
};

function UTILS_GET_TODAY_ISO() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const state = {
  auth: false,
  parsedFields: UTILS.buildDefaultOrder(),
  formRows: [],
};

function buildDefaultFormRows(data = UTILS.buildDefaultOrder(), rowCount = DEFAULT_FIELD_SEQUENCE.length) {
  return Array.from({ length: rowCount }, (_, index) => {
    const fieldKey = DEFAULT_FIELD_SEQUENCE[index % DEFAULT_FIELD_SEQUENCE.length] || 'name';
    return {
      id: `row-${index}`,
      fieldKey,
      value: data[fieldKey] ?? '',
    };
  });
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.id === screenId);
  });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.className = 'toast';
  }, 2800);
}

function setAuthenticated(value) {
  state.auth = value;
  if (value) {
    UTILS.setCookie(APP_CONFIG.COOKIE_NAME, 'true', APP_CONFIG.COOKIE_DAYS);
    showScreen('mainScreen');
  } else {
    UTILS.deleteCookie(APP_CONFIG.COOKIE_NAME);
    showScreen('loginScreen');
  }
}

function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (username === APP_CONFIG.LOGIN_USERNAME && password === APP_CONFIG.LOGIN_PASSWORD) {
    setAuthenticated(true);
    return;
  }

  showToast('Invalid login details.', 'error');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderFields(data) {
  const fieldGrid = document.getElementById('fieldGrid');
  if (!fieldGrid) return;

  const rows = state.formRows.length
    ? state.formRows
    : buildDefaultFormRows(data);

  const extraFields = [
    'deliveryChargePaid',
    'accessories',
    'orderDate',
  ];

  const renderedRows = rows.map(({ fieldKey, value }, index) => {
    const definition = UTILS.FIELD_DEFINITIONS[fieldKey] || UTILS.FIELD_DEFINITIONS.name;
    const editorMarkup = definition.type === 'textarea'
      ? `<textarea class="field-editor" id="field-${index}" placeholder="${definition.placeholder}">${escapeHtml(value)}</textarea>`
      : `<input class="field-editor" id="field-${index}" type="${definition.type}" value="${escapeHtml(value)}" placeholder="${definition.placeholder}" />`;

    const optionsMarkup = UTILS.FIELD_OPTIONS.map((option) => `
      <option value="${option.key}" ${option.key === fieldKey ? 'selected' : ''}>${option.label}</option>
    `).join('');

    return `
      <div class="field-row dynamic-field">
        <div class="field-header">
          <label class="field-select-wrap" aria-label="Select field">
            <select class="field-select" data-field-key="${fieldKey}">
              ${optionsMarkup}
            </select>
          </label>
        </div>
        <div class="field-value">
          ${editorMarkup}
        </div>
      </div>
    `;
  });

  const optionalRows = extraFields.map((fieldKey) => {
    const definition = UTILS.FIELD_DEFINITIONS[fieldKey];
    if (!definition) return '';

    if (fieldKey === 'deliveryChargePaid') {
      return `
        <div class="field-row">
          <div class="field-header">
            <strong>${definition.label}</strong>
          </div>
          <div class="field-value">
            <div class="toggle-wrap">
              <label class="switch" aria-label="${definition.label}">
                <input id="deliveryChargePaid" type="checkbox" ${data.deliveryChargePaid ? 'checked' : ''} />
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>
      `;
    }

    if (fieldKey === 'accessories') {
      const accessories = UTILS.ACCESSORY_OPTIONS.map((option) => {
        const checked = (data.accessories || []).includes(option) ? 'checked' : '';
        return `
          <label class="check-option">
            <input type="checkbox" value="${option}" ${checked} />
            <span>${option}</span>
          </label>
        `;
      }).join('');

      return `
        <div class="field-row">
          <div class="field-header">
            <strong>${definition.label}</strong>
          </div>
          <div class="field-value">
            <div class="accessories-box">${accessories}</div>
          </div>
        </div>
      `;
    }

    const commonValue = data[fieldKey] ?? UTILS_GET_TODAY_ISO();
    return `
      <div class="field-row">
        <div class="field-header">
          <strong>${definition.label}</strong>
        </div>
        <div class="field-value">
          <input id="field-orderDate" type="date" value="${commonValue || UTILS_GET_TODAY_ISO()}" />
        </div>
      </div>
    `;
  });

  fieldGrid.innerHTML = [...renderedRows, ...optionalRows].join('');
}

function collectFormValues() {
  const data = UTILS.buildDefaultOrder();
  const seenFields = new Set();

  const mappedRows = Array.from(document.querySelectorAll('.dynamic-field'));
  mappedRows.forEach((row) => {
    const select = row.querySelector('.field-select');
    const editor = row.querySelector('.field-editor');
    if (!select || !editor) return;

    const fieldKey = select.value;
    const value = editor.value.trim();

    if (!fieldKey) return;
    if (seenFields.has(fieldKey)) {
      throw new Error(`Duplicate field selected: ${fieldKey}. Each field can only be mapped once.`);
    }
    seenFields.add(fieldKey);

    if (Object.prototype.hasOwnProperty.call(data, fieldKey)) {
      data[fieldKey] = value;
    }
  });

  const toggle = document.getElementById('deliveryChargePaid');
  data.deliveryChargePaid = !!(toggle && toggle.checked);

  const checkedAccessories = Array.from(document.querySelectorAll('.check-option input[type="checkbox"]')).filter((input) => input.checked);
  data.accessories = checkedAccessories.map((input) => input.value);

  const orderDate = document.getElementById('field-orderDate');
  data.orderDate = orderDate ? orderDate.value || UTILS_GET_TODAY_ISO() : UTILS_GET_TODAY_ISO();

  return data;
}

function handleParseOrder() {
  const message = document.getElementById('orderInput').value;
  const parsed = UTILS.parseOrderMessage(message);
  state.parsedFields = parsed;
  state.formRows = state.formRows.length ? state.formRows : buildDefaultFormRows(parsed);
  renderFields(parsed);
  showToast('Order details parsed successfully.', 'success');
}

async function submitOrder(event) {
  event.preventDefault();

  const isPlaceholderUrl = !APP_CONFIG.SHEET_WEB_APP_URL || APP_CONFIG.SHEET_WEB_APP_URL.includes('PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE');
  console.log('isPlaceholderUrl', isPlaceholderUrl, APP_CONFIG.SHEET_WEB_APP_URL);
  if (isPlaceholderUrl) {
    showToast('Update APP_CONFIG.SHEET_WEB_APP_URL to your deployed Google Apps Script Web App URL before submitting.', 'error');
    return;
  }

  let payload;
  const submitButton = document.getElementById('submitOrderBtn');
  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  try {
    payload = collectFormValues();
    const response = await fetch(APP_CONFIG.SHEET_WEB_APP_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let result = null;

    try {
      result = rawText ? JSON.parse(rawText) : null;
    } catch (parseError) {
      result = { message: rawText || 'Unable to parse server response.' };
    }

    if (!response.ok || !result || result.success === false) {
      throw new Error(result && result.message ? result.message : 'Unable to submit order.');
    }

    showToast(result.orderId ? `Order noted: ${result.orderId}` : 'Order noted successfully.', 'success');
    document.getElementById('orderInput').value = '';
    state.parsedFields = UTILS.buildDefaultOrder();
    renderFields(state.parsedFields);
  } catch (error) {
    const message = error && error.message === 'Failed to fetch'
      ? 'CORS blocked: redeploy the Google Apps Script as a public web app and update SHEET_WEB_APP_URL in app.js.'
      : (error && error.message) || 'Submission failed.';

    showToast(message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit order';
  }
}

function init() {
  const savedAuth = UTILS.getCookie(APP_CONFIG.COOKIE_NAME);
  const loginForm = document.getElementById('loginForm');
  const parseButton = document.getElementById('parseButton');
  const orderForm = document.getElementById('orderForm');
  const logoutButton = document.getElementById('logoutBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (parseButton) {
    parseButton.addEventListener('click', handleParseOrder);
  }

  if (orderForm) {
    orderForm.addEventListener('submit', submitOrder);
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => setAuthenticated(false));
  }

  state.formRows = buildDefaultFormRows(state.parsedFields);
  renderFields(state.parsedFields);

  if (savedAuth === 'true') {
    setAuthenticated(true);
  } else {
    showScreen('loginScreen');
  }
}

document.addEventListener('DOMContentLoaded', init);
