const APP_CONFIG = {
  LOGIN_USERNAME: 'admin',
  LOGIN_PASSWORD: 'order123',
  COOKIE_NAME: 'order_management_auth',
  COOKIE_DAYS: 7,
  SHEET_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbx54_VWdIjDuMxed2FAURoyjSYE3Zm-MP0jMlq7BJem-TXnMcDRGhp_NASZ-53ZHCqwgg/exec',
};

const UTILS = {
  FIELD_ORDER: ['name', 'mobile', 'address', 'shoeModel', 'size', 'price'],

  FIELD_OPTIONS: [
    { key: 'name', label: 'Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'address', label: 'Address' },
    { key: 'shoeModel', label: 'Shoe model' },
    { key: 'size', label: 'Size' },
    { key: 'price', label: 'Price' },
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
      return parsed;
    }

    const fallbackQueue = [...UTILS.FIELD_ORDER];

    lines.forEach((line) => {
      const normalizedLine = UTILS.normalizeText(line);
      if (!normalizedLine) return;

      const explicitMatch = normalizedLine.match(/^([^:\n]+?)\s*[:\-]\s*(.+)$/);
      const fieldKey = explicitMatch ? UTILS.detectFieldKey(explicitMatch[1].toLowerCase()) : null;
      const value = explicitMatch ? UTILS.normalizeText(explicitMatch[2]) : normalizedLine;

      if (fieldKey && UTILS.FIELD_ORDER.includes(fieldKey)) {
        parsed[fieldKey] = value;
        const queueIndex = fallbackQueue.indexOf(fieldKey);
        if (queueIndex >= 0) fallbackQueue.splice(queueIndex, 1);
        return;
      }

      const nextKey = fallbackQueue.shift();
      if (nextKey) {
        parsed[nextKey] = value;
      }
    });

    if (!parsed.name && lines[0]) parsed.name = lines[0];
    if (!parsed.mobile && lines[1]) parsed.mobile = lines[1];
    if (!parsed.address && lines[2]) parsed.address = lines[2];
    if (!parsed.shoeModel && lines[3]) parsed.shoeModel = lines[3];
    if (!parsed.size && lines[4]) parsed.size = lines[4];
    if (!parsed.price && lines[5]) parsed.price = lines[5];

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
};

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

  const baseFields = UTILS.FIELD_ORDER.map((fieldKey) => ({
    fieldKey,
    value: data[fieldKey] ?? '',
  }));

  const extraFields = [
    'deliveryChargePaid',
    'accessories',
    'orderDate',
  ];

  const rows = [
    ...baseFields.map(({ fieldKey, value }) => {
      const definition = UTILS.FIELD_DEFINITIONS[fieldKey];
      const editorMarkup = definition.type === 'textarea'
        ? `<textarea class="field-editor" id="field-${fieldKey}" placeholder="${definition.placeholder}">${escapeHtml(value)}</textarea>`
        : `<input class="field-editor" id="field-${fieldKey}" type="${definition.type}" value="${escapeHtml(value)}" placeholder="${definition.placeholder}" />`;

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
    }),
    ...extraFields.map((fieldKey) => {
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
          const checked = data.accessories.includes(option) ? 'checked' : '';
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
    }),
  ];

  fieldGrid.innerHTML = rows.join('');
}

function collectFormValues() {
  const data = UTILS.buildDefaultOrder();

  const mappedRows = Array.from(document.querySelectorAll('.dynamic-field'));
  mappedRows.forEach((row) => {
    const select = row.querySelector('.field-select');
    const editor = row.querySelector('.field-editor');
    if (!select || !editor) return;

    const fieldKey = select.value;
    const value = editor.value.trim();
    if (fieldKey && Object.prototype.hasOwnProperty.call(data, fieldKey)) {
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
  renderFields(parsed);
  showToast('Order details parsed successfully.', 'success');
}

async function submitOrder(event) {
  event.preventDefault();

  if (!APP_CONFIG.SHEET_WEB_APP_URL) {
    showToast('Set APP_CONFIG.SHEET_WEB_APP_URL before submitting.', 'error');
    return;
  }

  const payload = collectFormValues();
  const submitButton = document.getElementById('submitOrderBtn');
  submitButton.disabled = true;
  submitButton.textContent = 'Submitting...';

  try {
    const response = await fetch(APP_CONFIG.SHEET_WEB_APP_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
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

  renderFields(state.parsedFields);

  if (savedAuth === 'true') {
    setAuthenticated(true);
  } else {
    showScreen('loginScreen');
  }
}

document.addEventListener('DOMContentLoaded', init);
