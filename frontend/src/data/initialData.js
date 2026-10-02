export const INITIAL_ORDERS = [
  {
    id: 'PY-ORD-1001',
    createdAt: '2026-09-21T11:30:00.000Z',
    customerName: 'ចាន់ សុភាព (Chan Sopheap)',
    phone: '012 889 977',
    email: 'sopheap@gmail.com',
    orderType: 'delivery',
    address: 'ផ្ទះលេខ ១២, ផ្លូវ ២៧១, ភ្នំពេញ',
    paymentMethod: 'khqr',
    items: [
      { id: 'dish-1', name_km: 'អាម៉ុកត្រីរ៉ស់បុរាណ', name_en: 'Traditional Fish Amok', price: 6.50, quantity: 2, spice_level: 'mild' },
      { id: 'dish-11', name_km: 'តែក្រូចឆ្មាទឹកឃ្មុំព្រៃ និងស្លឹកគ្រៃ', name_en: 'Lemongrass Wild Honey Iced Tea', price: 2.50, quantity: 2, spice_level: 'none' }
    ],
    subtotal: 18.00,
    deliveryFee: 1.50,
    discount: 0,
    total: 19.50,
    status: 'delivering'
  },
  {
    id: 'PY-ORD-1002',
    createdAt: '2026-09-21T12:15:00.000Z',
    customerName: 'David Miller',
    phone: '098 765 432',
    email: 'david.m@example.com',
    orderType: 'dine_in',
    tableNumber: 'T-04',
    paymentMethod: 'cod',
    items: [
      { id: 'dish-2', name_km: 'ឡុកឡាក់សាច់គោបាត់ដំបង', name_en: 'Battambang Beef Lok Lak', price: 7.00, quantity: 1, spice_level: 'medium' },
      { id: 'dish-4', name_km: 'ក្តាមថ្មឆាម្រេចខ្ចីកំពត', name_en: 'Kep Crab with Fresh Kampot Pepper', price: 12.00, quantity: 1, spice_level: 'hot' }
    ],
    subtotal: 19.00,
    deliveryFee: 0,
    discount: 0,
    total: 19.00,
    status: 'preparing'
  },
  {
    id: 'PY-ORD-1003',
    createdAt: '2026-09-21T13:00:00.000Z',
    customerName: 'វ៉ាន់នី រតនា (Vanny Rathana)',
    phone: '015 332 211',
    email: 'rathana@gmail.com',
    orderType: 'pickup',
    pickupTime: '13:45',
    paymentMethod: 'khqr',
    items: [
      { id: 'dish-9', name_km: 'បង្អែមបាយដំណើបស្វាយខ្ទិះដូង', name_en: 'Mango Sticky Rice with Coconut Glaze', price: 3.50, quantity: 2, spice_level: 'none' }
    ],
    subtotal: 7.00,
    deliveryFee: 0,
    discount: 0,
    total: 7.00,
    status: 'completed'
  }
];

export const INITIAL_RESERVATIONS = [
  {
    id: 'PY-RES-501',
    createdAt: '2026-09-21T09:00:00.000Z',
    name: 'ហេង សម្បត្តិ (Heng Sambath)',
    phone: '077 555 444',
    email: 'sambath@gmail.com',
    date: '2026-09-21',
    time: '19:00',
    guests: '5_8',
    seating: 'seating_vip',
    specialRequests: 'កម្មវិធីខួបកំណើតគ្រួសារ សូមជួយរៀបចំតុផ្កាស្រស់',
    status: 'confirmed'
  },
  {
    id: 'PY-RES-502',
    createdAt: '2026-09-21T10:30:00.000Z',
    name: 'Sarah Jenkins',
    phone: '010 443 211',
    email: 'sarah.j@outlook.com',
    date: '2026-09-21',
    time: '18:30',
    guests: '2',
    seating: 'seating_garden',
    specialRequests: 'Quiet outdoor corner table please',
    status: 'pending'
  },
  {
    id: 'PY-RES-503',
    createdAt: '2026-09-20T16:00:00.000Z',
    name: 'កែវ វិបុល (Keo Vibul)',
    phone: '085 221 199',
    email: 'vibul.keo@gmail.com',
    date: '2026-09-21',
    time: '12:00',
    guests: '3_4',
    seating: 'seating_indoor',
    specialRequests: 'អាហារថ្ងៃត្រង់ជជែកការងារ',
    status: 'seated'
  }
];
