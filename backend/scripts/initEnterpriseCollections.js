import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Old Models
import { Dish } from '../models/Dish.js';
import { Order } from '../models/Order.js';
import { Promo } from '../models/Promo.js';
import { User } from '../models/User.js';

// New Enterprise Models
import { Customer } from '../models/Customer.js';
import { Address } from '../models/Address.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Inventory } from '../models/Inventory.js';
import { PromoCode } from '../models/PromoCode.js';
import { OrderItem } from '../models/OrderItem.js';
import { Payment } from '../models/Payment.js';
import { Review } from '../models/Review.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb+srv://r59012695_db_user:PhumYeung2026!@cluster0.mdmoxbx.mongodb.net/phum_yeung_db?retryWrites=true&w=majority&appName=Cluster0';

async function initCollections() {
  try {
    console.log('[Migration] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Migration] Connected successfully!');

    // 1. Migrate Categories & Products & Inventory from Dishes
    const dishes = await Dish.find();
    console.log(`[Migration] Found ${dishes.length} existing dishes.`);

    const categoryMap = new Map();

    for (const dish of dishes) {
      const catName = dish.category || 'General';
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      let category = categoryMap.get(slug);
      if (!category) {
        category = await Category.findOne({ slug });
        if (!category) {
          category = await Category.create({
            category_id: `CAT-${slug.toUpperCase()}`,
            name_km: catName,
            name_en: catName,
            slug: slug
          });
          console.log(`[+] Created Category: ${catName}`);
        }
        categoryMap.set(slug, category);
      }

      // Check or create Product
      let product = await Product.findOne({ name_en: dish.name_en });
      if (!product) {
        product = await Product.create({
          product_id: dish.dishId || `PROD-${dish._id.toString().slice(-6)}`,
          category_id: category.category_id,
          name_km: dish.name_km,
          name_en: dish.name_en,
          price: dish.price,
          price_khr: dish.price_khr || Math.max(100, Math.round(Number(dish.price) * 4100)),
          spice_level: dish.spice_level || 'none',
          image: dish.image
        });
        console.log(`[+] Created Product: ${dish.name_en}`);

        // Create 1-to-1 Inventory for Product
        const invExists = await Inventory.findOne({ product_id: product.product_id });
        if (!invExists) {
          await Inventory.create({
            inventory_id: `INV-${product.product_id}`,
            product_id: product.product_id,
            stock_quantity: dish.inStock !== false ? 50 : 0,
            unit: 'portion',
            reorder_level: 5
          });
          console.log(`[+] Created Inventory for: ${product.name_en}`);
        }
      }
    }

    // 2. Migrate Customers & Addresses from Users
    const users = await User.find();
    console.log(`[Migration] Found ${users.length} existing users.`);

    for (const u of users) {
      let customer = await Customer.findOne({ email: u.email });
      if (!customer) {
        customer = await Customer.create({
          customer_id: `CUST-${u._id.toString().slice(-6)}`,
          name: u.name,
          email: u.email,
          phone: u.phone || '012 345 678',
          role: u.role || 'customer',
          password_hash: u.password // already hashed
        });
        console.log(`[+] Created Customer: ${u.name}`);

        // Create Address for Customer
        const addrExists = await Address.findOne({ customer_id: customer.customer_id });
        if (!addrExists) {
          await Address.create({
            address_id: `ADDR-${customer.customer_id}`,
            customer_id: customer.customer_id,
            khan: 'Khan Boeng Keng Kang (BKK)',
            street: u.address || 'Street 310, BKK1',
            is_default: true
          });
          console.log(`[+] Created Address for: ${u.name}`);
        }
      }
    }

    // 3. Migrate Promo Codes from Promos
    const promos = await Promo.find();
    console.log(`[Migration] Found ${promos.length} existing promos.`);

    for (const pr of promos) {
      let promoCode = await PromoCode.findOne({ code: pr.code });
      if (!promoCode) {
        await PromoCode.create({
          promo_id: `PR-${pr.code}`,
          code: pr.code,
          discount_type: 'percentage',
          discount_value: pr.discount || 10,
          min_spend: 10.0
        });
        console.log(`[+] Created PromoCode: ${pr.code}`);
      }
    }

    // 4. Migrate Orders into Order, OrderItem, and Payment
    const orders = await Order.find();
    console.log(`[Migration] Found ${orders.length} existing orders.`);

    for (const o of orders) {
      // Find customer
      const cust = await Customer.findOne({ email: o.email });
      const customerId = cust ? cust.customer_id : `CUST-GUEST-${o._id.toString().slice(-4)}`;

      // Update Order with new foreign keys
      o.customer_id = customerId;
      o.total_amount = o.total;
      await o.save();

      // Create Payment for this Order
      const paymentExists = await Payment.findOne({ order_id: o.orderId });
      if (!paymentExists) {
        await Payment.create({
          payment_id: `PAY-${o.orderId}`,
          order_id: o.orderId,
          payment_method: o.paymentMethod || 'khqr',
          khqr_ref: o.paymentMethod === 'khqr' ? `KHQR-HASH-${o.orderId}` : `COD-${o.orderId}`,
          amount: o.total,
          currency: 'USD',
          status: o.status === 'completed' ? 'paid' : 'pending'
        });
        console.log(`[+] Created Payment for Order: ${o.orderId}`);
      }

      // Create OrderItems from items array
      if (o.items && o.items.length > 0) {
        for (const it of o.items) {
          const itemExists = await OrderItem.findOne({ order_id: o.orderId, name_en: it.name_en });
          if (!itemExists) {
            await OrderItem.create({
              order_item_id: `ITEM-${new mongoose.Types.ObjectId().toString().slice(-6)}`,
              order_id: o.orderId,
              product_id: it.dishId || 'PROD-GENERAL',
              quantity: it.quantity || 1,
              price: it.price || 0,
              notes: it.notes || ''
            });
          }
        }
        console.log(`[+] Created OrderItems for Order: ${o.orderId}`);
      }
    }

    // 5. Create a sample Review
    const sampleProduct = await Product.findOne();
    const sampleCustomer = await Customer.findOne();
    if (sampleProduct && sampleCustomer) {
      const reviewExists = await Review.findOne();
      if (!reviewExists) {
        await Review.create({
          review_id: 'REV-1001',
          product_id: sampleProduct.product_id,
          customer_id: sampleCustomer.customer_id,
          rating: 5,
          comment: 'រសជាតិឆ្ងាញ់ខ្លាំង Authentic Khmer Food! Highly recommended.'
        });
        console.log('[+] Created sample Review');
      }
    }

    console.log('\n======================================================');
    console.log('✅ ALL 10 COLLECTIONS CREATED AND INITIALIZED!');
    console.log('======================================================\n');

    // List all collections in DB to confirm
    const cols = await mongoose.connection.db.listCollections().toArray();
    console.log('Current MongoDB Collections:', cols.map((c) => c.name));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Migration Error]', error);
    process.exit(1);
  }
}

initCollections();
