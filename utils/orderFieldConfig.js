(function (global) {
  const FIELD_CONFIG = {
    DEFAULT_FIELD_SEQUENCE: ['name', 'mobile', 'address', 'shoeModel', 'size', 'price'],
    FIELD_ORDER: ['name', 'mobile', 'address', 'shoeModel', 'size', 'price'],
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
        type: 'number',
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
        defaultValue: '2025-01-01',
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
  };

  global.ORDER_FIELD_CONFIG = FIELD_CONFIG;
  global.ORDER_MANAGEMENT = global.ORDER_MANAGEMENT || {};
  global.ORDER_MANAGEMENT.config = FIELD_CONFIG;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FIELD_CONFIG;
  }
})(typeof window !== 'undefined' ? window : globalThis);
