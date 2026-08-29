import { getPool, query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../constants/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Order & Payment Repository
 * 
 * Manages database persistence for Orders, Order Items, Payments,
 * Course Enrollments, and Note Purchases.
 * 
 * ACID TRANSACTIONS:
 * Utilizes PostgreSQL database transactions (BEGIN ... COMMIT / ROLLBACK)
 * to guarantee that payment verification, order state mutation, and entitlement
 * provisioning succeed atomically without partial failure or orphan states.
 */
export class OrderRepository {
  /**
   * Helper to normalize database rows into standardized API format
   */
  normalizeOrder(order, items = [], payments = []) {
    if (!order) return null;
    const id = order.id || order._id;
    const userId = order.user_id || (order.user && (order.user._id || order.user.id || order.user)) || order.userId;
    
    // Status normalizer
    let status = order.status || order.payment_status || order.paymentStatus || 'PENDING';
    status = status.toUpperCase();
    if (status === 'COMPLETED') status = 'PAID';

    return {
      id,
      _id: id,
      userId,
      user: typeof order.user === 'object' ? order.user : {
        id: userId,
        _id: userId,
        name: order.user_name || order.userName || 'Student',
        email: order.user_email || order.userEmail || '',
      },
      totalAmount: typeof order.total_amount === 'string' ? parseFloat(order.total_amount) : (order.total_amount ?? order.totalAmount ?? 0),
      currency: order.currency || 'INR',
      status,
      paymentStatus: status.toLowerCase(),
      razorpayOrderId: order.razorpay_order_id || order.razorpayOrderId || null,
      razorpayPaymentId: order.razorpay_payment_id || order.razorpayPaymentId || null,
      razorpaySignature: order.razorpay_signature || order.razorpaySignature || null,
      receipt: order.receipt || null,
      notes: order.notes || null,
      items: items.map(item => ({
        id: item.id || item._id,
        _id: item.id || item._id,
        orderId: item.order_id || item.orderId || id,
        itemType: item.item_type || item.itemType || 'course',
        itemId: item.item_id || item.itemId,
        title: item.title,
        price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price ?? 0),
        createdAt: item.created_at || item.createdAt || new Date(),
      })),
      payments: payments.map(p => ({
        id: p.id || p._id,
        _id: p.id || p._id,
        orderId: p.order_id || p.orderId || id,
        amount: typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount ?? 0),
        currency: p.currency || 'INR',
        gateway: p.gateway || 'razorpay',
        transactionId: p.transaction_id || p.transactionId || '',
        status: (p.status || 'CREATED').toUpperCase(),
        paidAt: p.paid_at || p.paidAt || null,
        createdAt: p.created_at || p.createdAt || new Date(),
      })),
      createdAt: order.created_at || order.createdAt || new Date(),
      updatedAt: order.updated_at || order.updatedAt || new Date(),
    };
  }

  /**
   * Check if a student is already actively enrolled in a course
   */
  async checkUserEnrollment(userId, courseId) {
    if (!userId || !courseId) return false;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = 'active' LIMIT 1`;
        const res = await query(sql, [userId, courseId]);
        return res.rows.length > 0;
      } catch (err) {
        console.warn('OrderRepository checkUserEnrollment fallback:', err.message);
      }
    }

    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    if (user && user.purchasedCourses && user.purchasedCourses.includes(courseId)) {
      return true;
    }
    return false;
  }

  /**
   * Check if a student has already purchased a specific digital note
   */
  async checkUserNotePurchase(userId, noteId) {
    if (!userId || !noteId) return false;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `SELECT id FROM note_purchases WHERE user_id = $1 AND note_id = $2 LIMIT 1`;
        const res = await query(sql, [userId, noteId]);
        return res.rows.length > 0;
      } catch (err) {
        console.warn('OrderRepository checkUserNotePurchase fallback:', err.message);
      }
    }

    const hasNp = (mockData.notePurchases || []).some(np => np.userId === userId && np.noteId === noteId);
    if (hasNp) return true;

    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    if (user && user.purchasedNotes && user.purchasedNotes.includes(noteId)) {
      return true;
    }
    return false;
  }

  /**
   * Create an order with items and initial payment transaction record
   */
  async createOrder({ userId, items, totalAmount, currency = 'INR', razorpayOrderId, receipt, notes = '' }) {
    const orderId = uuidv4();
    const paymentId = uuidv4();

    if (ENV.DATABASE_URL) {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 1. Insert into orders table
        const orderSql = `
          INSERT INTO orders (
            id, user_id, total_amount, currency, status, payment_status, 
            razorpay_order_id, receipt, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING *
        `;
        const orderRes = await client.query(orderSql, [
          orderId,
          userId,
          totalAmount,
          currency,
          totalAmount === 0 ? ORDER_STATUS.PAID : ORDER_STATUS.PENDING,
          totalAmount === 0 ? 'paid' : 'pending',
          razorpayOrderId || null,
          receipt || `rcpt_${orderId.substring(0, 8)}`,
          notes,
        ]);
        const createdOrder = orderRes.rows[0];

        // 2. Insert into order_items table
        const insertedItems = [];
        for (const item of items) {
          const itemId = uuidv4();
          const itemSql = `
            INSERT INTO order_items (id, order_id, item_type, item_id, title, price, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING *
          `;
          const itemRes = await client.query(itemSql, [
            itemId,
            orderId,
            item.itemType,
            item.itemId,
            item.title,
            item.price,
          ]);
          insertedItems.push(itemRes.rows[0]);
        }

        // 3. Insert into payments table
        const paymentSql = `
          INSERT INTO payments (
            id, order_id, user_id, amount, currency, gateway, 
            transaction_id, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING *
        `;
        const paymentRes = await client.query(paymentSql, [
          paymentId,
          orderId,
          userId,
          totalAmount,
          currency,
          'razorpay',
          razorpayOrderId || `txn_${orderId.substring(0, 8)}`,
          totalAmount === 0 ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.CREATED,
        ]);
        const createdPayment = paymentRes.rows[0];

        // If 0 amount (100% Free Order), grant access immediately in transaction
        if (totalAmount === 0) {
          for (const item of items) {
            if (item.itemType === 'course') {
              const enrollId = uuidv4();
              await client.query(
                `INSERT INTO enrollments (id, user_id, course_id, order_id, status, progress_percentage, enrolled_at)
                 VALUES ($1, $2, $3, $4, 'active', 0.00, NOW())
                 ON CONFLICT (user_id, course_id) DO NOTHING`,
                [enrollId, userId, item.itemId, orderId]
              );
              await client.query(
                `UPDATE courses SET enrolled_students = enrolled_students + 1 WHERE id = $1`,
                [item.itemId]
              );
            } else if (item.itemType === 'note') {
              const npId = uuidv4();
              await client.query(
                `INSERT INTO note_purchases (id, user_id, note_id, order_id, price_paid, purchased_at)
                 VALUES ($1, $2, $3, $4, 0.00, NOW())
                 ON CONFLICT (user_id, note_id) DO UPDATE SET order_id = EXCLUDED.order_id`,
                [npId, userId, item.itemId, orderId]
              );
            }
          }
        }

        await client.query('COMMIT');
        return this.normalizeOrder(createdOrder, insertedItems, [createdPayment]);
      } catch (err) {
        await client.query('ROLLBACK');
        console.warn('OrderRepository createOrder fallback to mockStore:', err.message);
      } finally {
        client.release();
      }
    }

    // In-memory fallback
    const mockOrder = {
      _id: orderId,
      id: orderId,
      userId,
      user_id: userId,
      totalAmount,
      total_amount: totalAmount,
      currency,
      status: totalAmount === 0 ? ORDER_STATUS.PAID : ORDER_STATUS.PENDING,
      paymentStatus: totalAmount === 0 ? 'paid' : 'pending',
      razorpayOrderId: razorpayOrderId || `rzp_order_${Date.now()}`,
      receipt: receipt || `rcpt_${orderId.substring(0, 8)}`,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockItems = items.map(i => ({
      _id: uuidv4(),
      id: uuidv4(),
      orderId,
      order_id: orderId,
      itemType: i.itemType,
      item_type: i.itemType,
      itemId: i.itemId,
      item_id: i.itemId,
      title: i.title,
      price: i.price,
      createdAt: new Date().toISOString(),
    }));

    const mockPayment = {
      _id: paymentId,
      id: paymentId,
      orderId,
      order_id: orderId,
      userId,
      amount: totalAmount,
      currency,
      gateway: 'razorpay',
      transactionId: razorpayOrderId || `sim_pay_${Date.now()}`,
      status: totalAmount === 0 ? PAYMENT_STATUS.SUCCESS : PAYMENT_STATUS.CREATED,
      createdAt: new Date().toISOString(),
    };

    if (!mockData.orders) mockData.orders = [];
    if (!mockData.orderItems) mockData.orderItems = [];
    if (!mockData.payments) mockData.payments = [];

    mockData.orders.unshift(mockOrder);
    mockData.orderItems.push(...mockItems);
    mockData.payments.unshift(mockPayment);

    // Free order instant access
    if (totalAmount === 0) {
      const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
      if (user) {
        for (const item of items) {
          if (item.itemType === 'course') {
            if (!user.purchasedCourses) user.purchasedCourses = [];
            if (!user.purchasedCourses.includes(item.itemId)) user.purchasedCourses.push(item.itemId);
          } else if (item.itemType === 'note') {
            if (!user.purchasedNotes) user.purchasedNotes = [];
            if (!user.purchasedNotes.includes(item.itemId)) user.purchasedNotes.push(item.itemId);
          }
        }
      }
    }

    return this.normalizeOrder(mockOrder, mockItems, [mockPayment]);
  }

  /**
   * Find order by ID with line items and payment records
   */
  async findById(orderId) {
    if (!orderId) return null;

    if (ENV.DATABASE_URL) {
      try {
        const orderSql = `
          SELECT o.*, u.name as user_name, u.email as user_email
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          WHERE o.id = $1
          LIMIT 1
        `;
        const orderRes = await query(orderSql, [orderId]);
        if (orderRes.rows.length === 0) return null;

        const order = orderRes.rows[0];

        const itemsSql = `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`;
        const itemsRes = await query(itemsSql, [orderId]);

        const paymentsSql = `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC`;
        const paymentsRes = await query(paymentsSql, [orderId]);

        return this.normalizeOrder(order, itemsRes.rows, paymentsRes.rows);
      } catch (err) {
        console.warn('OrderRepository findById fallback to mockStore:', err.message);
      }
    }

    const order = (mockData.orders || []).find(o => o._id === orderId || o.id === orderId);
    if (!order) return null;

    const items = (mockData.orderItems || []).filter(i => i.orderId === orderId || i.order_id === orderId);
    const payments = (mockData.payments || []).filter(p => p.orderId === orderId || p.order_id === orderId);

    // Attach user details if available
    const userId = order.user_id || (typeof order.user === 'object' ? order.user._id || order.user.id : order.user) || order.userId;
    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    if (user) {
      order.user = { id: user._id || user.id, _id: user._id || user.id, name: user.name, email: user.email };
    }

    return this.normalizeOrder(order, items.length > 0 ? items : (order.items || []), payments);
  }

  /**
   * Find order by Gateway (Razorpay) Order ID
   */
  async findByRazorpayOrderId(rzpOrderId) {
    if (!rzpOrderId) return null;

    if (ENV.DATABASE_URL) {
      try {
        const orderSql = `SELECT id FROM orders WHERE razorpay_order_id = $1 LIMIT 1`;
        const res = await query(orderSql, [rzpOrderId]);
        if (res.rows.length > 0) {
          return this.findById(res.rows[0].id);
        }
      } catch (err) {
        console.warn('OrderRepository findByRazorpayOrderId fallback:', err.message);
      }
    }

    const order = (mockData.orders || []).find(o => o.razorpayOrderId === rzpOrderId || o.razorpay_order_id === rzpOrderId);
    return order ? this.findById(order._id || order.id) : null;
  }

  /**
   * Find orders placed by a specific student with pagination
   */
  async findByUserId(userId, { page = 1, limit = 20 } = {}) {
    const offset = (Number(page) - 1) * Number(limit);

    if (ENV.DATABASE_URL) {
      try {
        const countSql = `SELECT COUNT(*) FROM orders WHERE user_id = $1`;
        const countRes = await query(countSql, [userId]);
        const total = parseInt(countRes.rows[0].count, 10);

        const sql = `
          SELECT o.*, u.name as user_name, u.email as user_email
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          WHERE o.user_id = $1
          ORDER BY o.created_at DESC
          LIMIT $2 OFFSET $3
        `;
        const res = await query(sql, [userId, Number(limit), offset]);

        const orders = [];
        for (const o of res.rows) {
          const itemsRes = await query(`SELECT * FROM order_items WHERE order_id = $1`, [o.id]);
          const paymentsRes = await query(`SELECT * FROM payments WHERE order_id = $1`, [o.id]);
          orders.push(this.normalizeOrder(o, itemsRes.rows, paymentsRes.rows));
        }

        return {
          orders,
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)) || 1,
        };
      } catch (err) {
        console.warn('OrderRepository findByUserId fallback to mockStore:', err.message);
      }
    }

    // In-Memory
    const userOrders = (mockData.orders || []).filter(o => {
      const uId = o.user_id || (typeof o.user === 'object' ? o.user._id || o.user.id : o.user) || o.userId;
      return uId === userId;
    });

    const total = userOrders.length;
    const slice = userOrders.slice(offset, offset + Number(limit));
    const normalized = slice.map(o => {
      const items = (mockData.orderItems || []).filter(i => i.orderId === (o._id || o.id));
      const payments = (mockData.payments || []).filter(p => p.orderId === (o._id || o.id));
      return this.normalizeOrder(o, items.length > 0 ? items : (o.items || []), payments);
    });

    return {
      orders: normalized,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    };
  }

  /**
   * Find all system orders (Admin View)
   */
  async findAll({ page = 1, limit = 50, status, search } = {}) {
    const offset = (Number(page) - 1) * Number(limit);

    if (ENV.DATABASE_URL) {
      try {
        let where = 'WHERE 1=1';
        const params = [];
        let pIdx = 1;

        if (status) {
          where += ` AND (o.status = $${pIdx} OR o.payment_status = $${pIdx} OR UPPER(o.status) = UPPER($${pIdx}))`;
          params.push(status);
          pIdx++;
        }

        if (search) {
          where += ` AND (o.id::text ILIKE $${pIdx} OR u.name ILIKE $${pIdx} OR u.email ILIKE $${pIdx} OR o.razorpay_order_id ILIKE $${pIdx})`;
          params.push(`%${search}%`);
          pIdx++;
        }

        const countSql = `
          SELECT COUNT(*) 
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          ${where}
        `;
        const countRes = await query(countSql, params);
        const total = parseInt(countRes.rows[0].count, 10);

        const sql = `
          SELECT o.*, u.name as user_name, u.email as user_email
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          ${where}
          ORDER BY o.created_at DESC
          LIMIT $${pIdx++} OFFSET $${pIdx++}
        `;
        params.push(Number(limit), offset);

        const res = await query(sql, params);
        const orders = [];

        for (const o of res.rows) {
          const itemsRes = await query(`SELECT * FROM order_items WHERE order_id = $1`, [o.id]);
          const paymentsRes = await query(`SELECT * FROM payments WHERE order_id = $1`, [o.id]);
          orders.push(this.normalizeOrder(o, itemsRes.rows, paymentsRes.rows));
        }

        return {
          orders,
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)) || 1,
        };
      } catch (err) {
        console.warn('OrderRepository findAll fallback to mockStore:', err.message);
      }
    }

    // In-memory fallback
    let all = [...(mockData.orders || [])];

    if (status) {
      all = all.filter(o => {
        const s = (o.status || o.paymentStatus || '').toUpperCase();
        return s === status.toUpperCase();
      });
    }

    if (search) {
      const q = search.toLowerCase();
      all = all.filter(o => {
        const id = (o._id || o.id || '').toLowerCase();
        const userName = (typeof o.user === 'object' ? o.user?.name : '') || '';
        const userEmail = (typeof o.user === 'object' ? o.user?.email : '') || '';
        return id.includes(q) || userName.toLowerCase().includes(q) || userEmail.toLowerCase().includes(q);
      });
    }

    const total = all.length;
    const slice = all.slice(offset, offset + Number(limit));
    const normalized = slice.map(o => {
      const items = (mockData.orderItems || []).filter(i => i.orderId === (o._id || o.id));
      const payments = (mockData.payments || []).filter(p => p.orderId === (o._id || o.id));
      return this.normalizeOrder(o, items.length > 0 ? items : (o.items || []), payments);
    });

    return {
      orders: normalized,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    };
  }

  /**
   * Execute atomic transaction to verify payment and provision entitlements
   */
  async executePaymentVerificationTransaction({ orderId, userId, razorpayPaymentId, razorpaySignature, gatewayResponse = {} }) {
    if (!orderId) throw new Error('Order ID is required');

    if (ENV.DATABASE_URL) {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 1. Lock and fetch order
        const lockSql = `SELECT * FROM orders WHERE id = $1 FOR UPDATE`;
        const lockRes = await client.query(lockSql, [orderId]);
        if (lockRes.rows.length === 0) {
          throw new Error('Order not found');
        }

        const order = lockRes.rows[0];

        // If already paid, exit idempotently
        if (order.status === ORDER_STATUS.PAID || order.payment_status === 'paid') {
          await client.query('COMMIT');
          return this.findById(orderId);
        }

        // 2. Update Order status to PAID
        const updateOrderSql = `
          UPDATE orders
          SET status = $1, payment_status = 'paid', 
              razorpay_payment_id = $2, razorpay_signature = $3, updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `;
        await client.query(updateOrderSql, [
          ORDER_STATUS.PAID,
          razorpayPaymentId || `pay_${Date.now()}`,
          razorpaySignature || 'verified_sig',
          orderId,
        ]);

        // 3. Update or Insert into Payments table with SUCCESS status
        const updatePaymentSql = `
          UPDATE payments
          SET status = $1, transaction_id = $2, gateway_response = $3, paid_at = NOW(), updated_at = NOW()
          WHERE order_id = $4
        `;
        const paymentRes = await client.query(updatePaymentSql, [
          PAYMENT_STATUS.SUCCESS,
          razorpayPaymentId || `pay_${Date.now()}`,
          JSON.stringify(gatewayResponse),
          orderId,
        ]);

        if (paymentRes.rowCount === 0) {
          const insertPaySql = `
            INSERT INTO payments (
              id, order_id, user_id, amount, currency, gateway, 
              transaction_id, status, gateway_response, paid_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW())
          `;
          await client.query(insertPaySql, [
            uuidv4(),
            orderId,
            order.user_id || userId,
            order.total_amount,
            order.currency || 'INR',
            'razorpay',
            razorpayPaymentId || `pay_${Date.now()}`,
            PAYMENT_STATUS.SUCCESS,
            JSON.stringify(gatewayResponse),
          ]);
        }

        // 4. Fetch line items
        const itemsRes = await client.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId]);
        const items = itemsRes.rows;

        // 5. Provision Entitlements
        for (const item of items) {
          if (item.item_type === 'course') {
            const enrollId = uuidv4();
            await client.query(
              `INSERT INTO enrollments (id, user_id, course_id, order_id, status, progress_percentage, enrolled_at)
               VALUES ($1, $2, $3, $4, 'active', 0.00, NOW())
               ON CONFLICT (user_id, course_id) DO NOTHING`,
              [enrollId, order.user_id || userId, item.item_id, orderId]
            );
            await client.query(
              `UPDATE courses SET enrolled_students = enrolled_students + 1 WHERE id = $1`,
              [item.item_id]
            );
          } else if (item.item_type === 'note') {
            const npId = uuidv4();
            await client.query(
              `INSERT INTO note_purchases (id, user_id, note_id, order_id, price_paid, purchased_at)
               VALUES ($1, $2, $3, $4, $5, NOW())
               ON CONFLICT (user_id, note_id) DO UPDATE SET order_id = EXCLUDED.order_id, price_paid = EXCLUDED.price_paid`,
              [npId, order.user_id || userId, item.item_id, orderId, item.price]
            );
          }
        }

        await client.query('COMMIT');
        return this.findById(orderId);
      } catch (err) {
        await client.query('ROLLBACK');
        console.warn('OrderRepository executePaymentVerificationTransaction DB fallback:', err.message);
      } finally {
        client.release();
      }
    }

    // In-memory atomic transaction simulation
    const order = (mockData.orders || []).find(o => o._id === orderId || o.id === orderId);
    if (!order) throw new Error('Order not found in store');

    order.status = ORDER_STATUS.PAID;
    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpayPaymentId || `sim_pay_${Date.now()}`;
    order.razorpaySignature = razorpaySignature || 'sim_sig';
    order.updatedAt = new Date().toISOString();

    const payment = (mockData.payments || []).find(p => p.orderId === orderId || p.order_id === orderId);
    if (payment) {
      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.transactionId = order.razorpayPaymentId;
      payment.paidAt = new Date().toISOString();
    }

    const items = (mockData.orderItems || []).filter(i => i.orderId === orderId || i.order_id === orderId);
    const user = (mockData.users || []).find(u => u._id === (order.user_id || userId) || u.id === (order.user_id || userId));

    if (user) {
      if (!user.purchasedCourses) user.purchasedCourses = [];
      if (!user.purchasedNotes) user.purchasedNotes = [];

      for (const item of items) {
        if (item.itemType === 'course' || item.item_type === 'course') {
          const cId = item.itemId || item.item_id;
          if (!user.purchasedCourses.includes(cId)) user.purchasedCourses.push(cId);

          const course = (mockData.courses || []).find(c => c._id === cId || c.id === cId);
          if (course) course.enrolledStudents = (course.enrolledStudents || 0) + 1;
        } else if (item.itemType === 'note' || item.item_type === 'note') {
          const nId = item.itemId || item.item_id;
          if (!user.purchasedNotes.includes(nId)) user.purchasedNotes.push(nId);

          if (!mockData.notePurchases) mockData.notePurchases = [];
          if (!mockData.notePurchases.some(np => np.userId === user._id && np.noteId === nId)) {
            mockData.notePurchases.push({
              _id: uuidv4(),
              id: uuidv4(),
              userId: user._id,
              noteId: nId,
              orderId,
              pricePaid: item.price,
              purchasedAt: new Date(),
            });
          }
        }
      }
    }

    return this.findById(orderId);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, userId, isAdmin = false) {
    const order = await this.findById(orderId);
    if (!order) return null;

    if (!isAdmin && order.userId !== userId) {
      throw new Error('Unauthorized to cancel this order');
    }

    if (order.status === ORDER_STATUS.PAID) {
      throw new Error('Cannot cancel an already completed and paid order');
    }

    if (ENV.DATABASE_URL) {
      try {
        await query(`UPDATE orders SET status = $1, payment_status = 'cancelled', updated_at = NOW() WHERE id = $2`, [
          ORDER_STATUS.CANCELLED,
          orderId,
        ]);
        await query(`UPDATE payments SET status = $1, updated_at = NOW() WHERE order_id = $2`, [
          PAYMENT_STATUS.FAILED,
          orderId,
        ]);
        return this.findById(orderId);
      } catch (err) {
        console.warn('OrderRepository cancelOrder fallback:', err.message);
      }
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.paymentStatus = 'cancelled';
    return order;
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;
