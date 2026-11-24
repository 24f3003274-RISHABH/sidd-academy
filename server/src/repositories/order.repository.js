import { getPool, query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../constants/index.js';
import { AppError } from '../utils/apiResponse.js';
import { v4 as uuidv4 } from 'uuid';

const isUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/**
 * Order & Payment Repository
 *
 * Manages database persistence for Orders, Order Items, Payments,
 * Course Enrollments, and Note Purchases with ACID transaction guarantees.
 */
export class OrderRepository {
  /**
   * Helper to normalize database rows into standardized API format
   */
  normalizeOrder(order, items = [], payments = []) {
    if (!order) return null;
    const id = order.id || order._id;
    const userId = order.user_id || (order.user && (order.user._id || order.user.id || order.user)) || order.userId;

    const rawStatuses = [order.status, order.payment_status, order.paymentStatus]
      .filter(Boolean)
      .map((value) => String(value).toUpperCase());
    let status = rawStatuses.includes('PAID') || rawStatuses.includes('COMPLETED')
      ? 'PAID'
      : rawStatuses.includes('CANCELLED')
        ? 'CANCELLED'
        : rawStatuses.includes('FAILED')
          ? 'FAILED'
          : rawStatuses[0] || 'PENDING';
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
   * Provision entitlements in MockStore atomically for both courses and notes
   */
  provisionMockEntitlements(userId, orderId, items = []) {
    if (!mockData.enrollments) mockData.enrollments = [];
    if (!mockData.notePurchases) mockData.notePurchases = [];

    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    if (user) {
      if (!user.purchasedCourses) user.purchasedCourses = [];
      if (!user.purchasedNotes) user.purchasedNotes = [];
    }

    for (const item of items) {
      const type = (item.itemType || item.item_type || '').toLowerCase();
      const targetId = item.itemId || item.item_id;
      if (!targetId) continue;

      if (type === 'course') {
        if (user && !user.purchasedCourses.includes(targetId)) {
          user.purchasedCourses.push(targetId);
        }

        const existingEnr = mockData.enrollments.find(
          e => e.userId === userId && e.courseId === targetId
        );
        if (existingEnr) {
          existingEnr.status = 'active';
          existingEnr.orderId = orderId;
        } else {
          const enrId = uuidv4();
          mockData.enrollments.unshift({
            _id: enrId,
            id: enrId,
            userId,
            courseId: targetId,
            orderId,
            status: 'active',
            progressPercentage: 0,
            enrolledAt: new Date(),
          });
        }

        const course = (mockData.courses || []).find(c => c._id === targetId || c.id === targetId);
        if (course) {
          course.enrolledStudents = (course.enrolledStudents || course.enrolledCount || 0) + 1;
          course.totalStudents = course.enrolledStudents;
          course.enrolledCount = course.enrolledStudents;
        }
      } else if (type === 'note') {
        if (user && !user.purchasedNotes.includes(targetId)) {
          user.purchasedNotes.push(targetId);
        }

        const existingNp = mockData.notePurchases.find(
          np => np.userId === userId && np.noteId === targetId
        );
        if (existingNp) {
          existingNp.orderId = orderId;
          existingNp.pricePaid = Number(item.price || 0);
        } else {
          const npId = uuidv4();
          mockData.notePurchases.unshift({
            _id: npId,
            id: npId,
            userId,
            noteId: targetId,
            orderId,
            pricePaid: Number(item.price || 0),
            purchasedAt: new Date(),
          });
        }
      }
    }
  }

  /**
   * Check if a student is already actively enrolled in a course
   */
  async checkUserEnrollment(userId, courseId) {
    if (!userId || !courseId) return false;

    if (ENV.DATABASE_URL && isUuid(userId) && isUuid(courseId)) {
      try {
        const sql = `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = 'active' LIMIT 1`;
        const res = await query(sql, [userId, courseId]);
        return res.rows.length > 0;
      } catch (err) {
        console.warn('OrderRepository checkUserEnrollment fallback:', err.message);
      }
    }

    const hasEnr = (mockData.enrollments || []).some(
      e => e.userId === userId && e.courseId === courseId && (e.status || 'active') === 'active'
    );
    if (hasEnr) return true;

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

    if (ENV.DATABASE_URL && isUuid(userId) && isUuid(noteId)) {
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

    if (ENV.DATABASE_URL && isUuid(userId)) {
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
          totalAmount === 0 ? 'completed' : 'initiated',
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
                 ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'active', order_id = EXCLUDED.order_id, updated_at = NOW()`,
                [enrollId, userId, item.itemId, orderId]
              );
              await client.query(
                `UPDATE courses SET total_students = total_students + 1 WHERE id = $1`,
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

    // Free order instant access: update BOTH user arrays AND mockData.enrollments / mockData.notePurchases
    if (totalAmount === 0) {
      this.provisionMockEntitlements(userId, orderId, items);
    }

    return this.normalizeOrder(mockOrder, mockItems, [mockPayment]);
  }

  /**
   * Find order by ID with line items and payment records
   */
  async findById(orderId) {
    if (!orderId) return null;

    if (ENV.DATABASE_URL && isUuid(orderId)) {
      try {
        const orderSql = `
          SELECT o.*, u.name as user_name, u.email as user_email
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          WHERE o.id = $1
          LIMIT 1
        `;
        const orderRes = await query(orderSql, [orderId]);
        if (orderRes.rows.length > 0) {
          const order = orderRes.rows[0];

          const itemsSql = `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC`;
          const itemsRes = await query(itemsSql, [orderId]);

          const paymentsSql = `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC`;
          const paymentsRes = await query(paymentsSql, [orderId]);

          return this.normalizeOrder(order, itemsRes.rows, paymentsRes.rows);
        }
      } catch (err) {
        console.warn('OrderRepository findById fallback to mockStore:', err.message);
      }
    }

    const order = (mockData.orders || []).find(o => o._id === orderId || o.id === orderId);
    if (!order) return null;

    const items = (mockData.orderItems || []).filter(i => i.orderId === orderId || i.order_id === orderId);
    const payments = (mockData.payments || []).filter(p => p.orderId === orderId || p.order_id === orderId);

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

    if (ENV.DATABASE_URL && isUuid(userId)) {
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
        const orderIds = res.rows.map((o) => o.id).filter(Boolean);

        const itemsByOrder = new Map();
        const paymentsByOrder = new Map();

        if (orderIds.length > 0) {
          const [itemsRes, paymentsRes] = await Promise.all([
            query(`SELECT * FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY created_at ASC`, [orderIds]),
            query(`SELECT * FROM payments WHERE order_id = ANY($1::uuid[]) ORDER BY created_at DESC`, [orderIds]),
          ]);
          for (const item of itemsRes.rows) {
            const list = itemsByOrder.get(item.order_id) || [];
            list.push(item);
            itemsByOrder.set(item.order_id, list);
          }
          for (const payment of paymentsRes.rows) {
            const list = paymentsByOrder.get(payment.order_id) || [];
            list.push(payment);
            paymentsByOrder.set(payment.order_id, list);
          }
        }

        const orders = res.rows.map((o) =>
          this.normalizeOrder(o, itemsByOrder.get(o.id) || [], paymentsByOrder.get(o.id) || [])
        );

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
          where += ` AND (o.status = $${pIdx} OR o.payment_status = $${pIdx} OR UPPER(o.status) = UPPER($${pIdx}) OR UPPER(o.payment_status) = UPPER($${pIdx}))`;
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
        const orderIds = res.rows.map((o) => o.id).filter(Boolean);

        const itemsByOrder = new Map();
        const paymentsByOrder = new Map();

        if (orderIds.length > 0) {
          const [itemsRes, paymentsRes] = await Promise.all([
            query(`SELECT * FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY created_at ASC`, [orderIds]),
            query(`SELECT * FROM payments WHERE order_id = ANY($1::uuid[]) ORDER BY created_at DESC`, [orderIds]),
          ]);
          for (const item of itemsRes.rows) {
            const list = itemsByOrder.get(item.order_id) || [];
            list.push(item);
            itemsByOrder.set(item.order_id, list);
          }
          for (const payment of paymentsRes.rows) {
            const list = paymentsByOrder.get(payment.order_id) || [];
            list.push(payment);
            paymentsByOrder.set(payment.order_id, list);
          }
        }

        const orders = res.rows.map((o) =>
          this.normalizeOrder(o, itemsByOrder.get(o.id) || [], paymentsByOrder.get(o.id) || [])
        );

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
   * Supports fault injection (`simulateDbFailure`) for SRS TC-09 rollback verification.
   */
  async executePaymentVerificationTransaction({
    orderId,
    userId,
    razorpayPaymentId,
    razorpaySignature,
    gatewayResponse = {},
    simulateDbFailure = false,
  }) {
    if (!orderId) throw new AppError('Order ID is required', 400);

    if (ENV.DATABASE_URL && isUuid(orderId)) {
      const pool = getPool();
      const client = await pool.connect();
      let foundInDb = false;
      try {
        await client.query('BEGIN');

        // 1. Lock and fetch order
        const lockSql = `SELECT * FROM orders WHERE id = $1 FOR UPDATE`;
        const lockRes = await client.query(lockSql, [orderId]);
        if (lockRes.rows.length > 0) {
          foundInDb = true;
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

          if (simulateDbFailure) {
            throw new AppError('Simulated database failure partway through verification transaction', 500);
          }

          // 3. Update or Insert into Payments table with completed status
          const updatePaymentSql = `
            UPDATE payments
            SET status = $1, transaction_id = $2, gateway_response = $3, paid_at = NOW(), updated_at = NOW()
            WHERE order_id = $4
          `;
          const paymentRes = await client.query(updatePaymentSql, [
            'completed',
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
              'completed',
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
                 ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'active', order_id = EXCLUDED.order_id, updated_at = NOW()`,
                [enrollId, order.user_id || userId, item.item_id, orderId]
              );
              await client.query(
                `UPDATE courses SET total_students = total_students + 1 WHERE id = $1`,
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
        } else {
          await client.query('ROLLBACK');
        }
      } catch (err) {
        await client.query('ROLLBACK');
        // Fail closed if the order existed in PostgreSQL or if fault injection was triggered (SRS TC-09 / NFR-REL-01)
        if (foundInDb || simulateDbFailure) {
          throw err instanceof AppError ? err : new AppError(`Payment verification transaction rolled back: ${err.message}`, 500);
        }
        console.warn('OrderRepository executePaymentVerificationTransaction DB fallback:', err.message);
      } finally {
        client.release();
      }
    }

    // In-memory atomic transaction with rollback snapshot
    const order = (mockData.orders || []).find(o => o._id === orderId || o.id === orderId);
    if (!order) throw new AppError('Order not found in store', 404);

    const payment = (mockData.payments || []).find(p => p.orderId === orderId || p.order_id === orderId);
    const effectiveUserId = order.user_id || order.userId || (typeof order.user === 'object' ? order.user._id || order.user.id : order.user) || userId;
    const user = (mockData.users || []).find(u => u._id === effectiveUserId || u.id === effectiveUserId);

    // Snapshot for atomic rollback guarantee
    const snapshot = {
      orderStatus: order.status,
      orderPaymentStatus: order.paymentStatus,
      orderPaymentId: order.razorpayPaymentId,
      orderSignature: order.razorpaySignature,
      paymentStatus: payment?.status,
      paymentTxnId: payment?.transactionId,
      paymentPaidAt: payment?.paidAt,
      userCourses: user?.purchasedCourses ? [...user.purchasedCourses] : [],
      userNotes: user?.purchasedNotes ? [...user.purchasedNotes] : [],
      enrollments: JSON.parse(JSON.stringify(mockData.enrollments || [])),
      notePurchases: JSON.parse(JSON.stringify(mockData.notePurchases || [])),
    };

    try {
      order.status = ORDER_STATUS.PAID;
      order.paymentStatus = 'paid';
      order.razorpayPaymentId = razorpayPaymentId || `sim_pay_${Date.now()}`;
      order.razorpaySignature = razorpaySignature || 'sim_sig';
      order.updatedAt = new Date().toISOString();

      if (simulateDbFailure) {
        throw new AppError('Simulated database failure partway through verification transaction', 500);
      }

      if (payment) {
        payment.status = PAYMENT_STATUS.SUCCESS;
        payment.transactionId = order.razorpayPaymentId;
        payment.paidAt = new Date().toISOString();
      }

      const items = (mockData.orderItems || []).filter(i => i.orderId === orderId || i.order_id === orderId);
      const effectiveItems = items.length > 0 ? items : (order.items || []);

      this.provisionMockEntitlements(effectiveUserId, orderId, effectiveItems);

      return this.findById(orderId);
    } catch (err) {
      // Rollback state to snapshot
      order.status = snapshot.orderStatus;
      order.paymentStatus = snapshot.orderPaymentStatus;
      order.razorpayPaymentId = snapshot.orderPaymentId;
      order.razorpaySignature = snapshot.orderSignature;
      if (payment) {
        payment.status = snapshot.paymentStatus;
        payment.transactionId = snapshot.paymentTxnId;
        payment.paidAt = snapshot.paymentPaidAt;
      }
      if (user) {
        user.purchasedCourses = snapshot.userCourses;
        user.purchasedNotes = snapshot.userNotes;
      }
      mockData.enrollments = snapshot.enrollments;
      mockData.notePurchases = snapshot.notePurchases;
      throw err instanceof AppError ? err : new AppError(`Transaction failed and rolled back: ${err.message}`, 500);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, userId, isAdmin = false) {
    const order = await this.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    const matchesUser = order.userId === userId || order.user?.id === userId || order.user?._id === userId;
    if (!isAdmin && !matchesUser) {
      throw new AppError('Unauthorized to cancel this order', 403);
    }

    if (order.status === ORDER_STATUS.PAID) {
      throw new AppError('Cannot cancel an already completed and paid order', 400);
    }
    if (order.status === ORDER_STATUS.FAILED) {
      return order;
    }

    if (ENV.DATABASE_URL && isUuid(orderId)) {
      try {
        await query(`UPDATE orders SET status = $1, payment_status = 'cancelled', updated_at = NOW() WHERE id = $2 AND COALESCE(status, payment_status) NOT IN ($3, $4, 'CANCELLED')`, [
          ORDER_STATUS.CANCELLED,
          orderId,
          ORDER_STATUS.PAID,
          ORDER_STATUS.FAILED,
        ]);
        await query(`UPDATE payments SET status = $1, updated_at = NOW() WHERE order_id = $2`, [
          'failed',
          orderId,
        ]);
        return this.findById(orderId);
      } catch (err) {
        console.warn('OrderRepository cancelOrder fallback:', err.message);
      }
    }

    const rawOrder = (mockData.orders || []).find(o => o._id === orderId || o.id === orderId);
    if (rawOrder) {
      rawOrder.status = ORDER_STATUS.CANCELLED;
      rawOrder.paymentStatus = 'cancelled';
    }
    order.status = ORDER_STATUS.CANCELLED;
    order.paymentStatus = 'cancelled';
    return order;
  }

  async failOrder(orderId, userId, isAdmin = false) {
    const order = await this.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    const matchesUser = order.userId === userId || order.user?.id === userId || order.user?._id === userId;
    if (!isAdmin && !matchesUser) {
      throw new AppError('Unauthorized to update this order', 403);
    }
    if (order.status === ORDER_STATUS.PAID) {
      throw new AppError('Cannot fail an already paid order', 400);
    }

    if (ENV.DATABASE_URL && isUuid(orderId)) {
      try {
        await query(
          `UPDATE orders SET status = $1, payment_status = 'failed', updated_at = NOW()
           WHERE id = $2 AND status <> $3`,
          [ORDER_STATUS.FAILED, orderId, ORDER_STATUS.PAID]
        );
        await query(
          `UPDATE payments SET status = $1, updated_at = NOW() WHERE order_id = $2`,
          ['failed', orderId]
        );
        return this.findById(orderId);
      } catch (err) {
        console.warn('OrderRepository failOrder fallback:', err.message);
      }
    }

    const rawOrder = (mockData.orders || []).find(o => o._id === orderId || o.id === orderId);
    if (rawOrder) {
      rawOrder.status = ORDER_STATUS.FAILED;
      rawOrder.paymentStatus = 'failed';
    }
    order.status = ORDER_STATUS.FAILED;
    order.paymentStatus = 'failed';
    return order;
  }

  /**
   * Refresh an existing unpaid order with a new Razorpay order ID for retry checkout
   */
  async refreshOrderForRetry(orderId, razorpayOrderId) {
    if (ENV.DATABASE_URL && isUuid(orderId)) {
      try {
        await query(
          `UPDATE orders
           SET status = $1, payment_status = 'pending', razorpay_order_id = $2, updated_at = NOW()
           WHERE id = $3 AND COALESCE(status, '') <> $4`,
          [ORDER_STATUS.PENDING, razorpayOrderId, orderId, ORDER_STATUS.PAID]
        );
        await query(
          `UPDATE payments
           SET status = 'initiated', transaction_id = $1, updated_at = NOW()
           WHERE order_id = $2`,
          [razorpayOrderId, orderId]
        );
        return this.findById(orderId);
      } catch (err) {
        console.warn('OrderRepository refreshOrderForRetry fallback:', err.message);
      }
    }

    const rawOrder = (mockData.orders || []).find(o => o._id === orderId || o.id === orderId);
    if (rawOrder) {
      rawOrder.status = ORDER_STATUS.PENDING;
      rawOrder.paymentStatus = 'pending';
      rawOrder.razorpayOrderId = razorpayOrderId;
      rawOrder.razorpay_order_id = razorpayOrderId;
      rawOrder.updatedAt = new Date().toISOString();
    }
    const payment = (mockData.payments || []).find(p => p.orderId === orderId || p.order_id === orderId);
    if (payment) {
      payment.status = PAYMENT_STATUS.CREATED;
      payment.transactionId = razorpayOrderId;
    }
    return this.findById(orderId);
  }

  /**
   * Count total paid orders
   */
  async countPaid() {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `SELECT COUNT(*) FROM orders WHERE payment_status = 'paid' OR status = 'PAID'`;
        const res = await query(sql);
        return parseInt(res.rows[0]?.count || 0, 10);
      } catch (err) {
        console.warn('OrderRepository countPaid fallback to mockStore:', err.message);
      }
    }

    const paid = (mockData.orders || []).filter(o => (o.paymentStatus || o.payment_status || o.status || '').toLowerCase() === 'paid');
    return paid.length;
  }

  /**
   * Get total revenue from paid orders
   */
  async getTotalRevenue() {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid' OR status = 'PAID'`;
        const res = await query(sql);
        return parseFloat(res.rows[0]?.total || 0);
      } catch (err) {
        console.warn('OrderRepository getTotalRevenue fallback to mockStore:', err.message);
      }
    }

    const paid = (mockData.orders || []).filter(o => (o.paymentStatus || o.payment_status || o.status || '').toLowerCase() === 'paid');
    return paid.reduce((sum, o) => sum + (o.totalAmount || o.total_amount || 0), 0);
  }

  /**
   * Get recent orders with user details (Admin Dashboard)
   */
  async getRecentOrders(limit = 5) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT o.*, u.name as user_name, u.email as user_email
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          ORDER BY o.created_at DESC
          LIMIT $1
        `;
        const res = await query(sql, [limit]);
        const orderIds = res.rows.map((o) => o.id).filter(Boolean);
        const itemsByOrder = new Map();
        const paymentsByOrder = new Map();

        if (orderIds.length > 0) {
          const [itemsRes, paymentsRes] = await Promise.all([
            query(`SELECT * FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY created_at ASC`, [orderIds]),
            query(`SELECT * FROM payments WHERE order_id = ANY($1::uuid[]) ORDER BY created_at DESC`, [orderIds]),
          ]);
          for (const item of itemsRes.rows) {
            const list = itemsByOrder.get(item.order_id) || [];
            list.push(item);
            itemsByOrder.set(item.order_id, list);
          }
          for (const payment of paymentsRes.rows) {
            const list = paymentsByOrder.get(payment.order_id) || [];
            list.push(payment);
            paymentsByOrder.set(payment.order_id, list);
          }
        }

        return res.rows.map((o) =>
          this.normalizeOrder(o, itemsByOrder.get(o.id) || [], paymentsByOrder.get(o.id) || [])
        );
      } catch (err) {
        console.warn('OrderRepository getRecentOrders fallback to mockStore:', err.message);
      }
    }

    const slice = (mockData.orders || []).slice(0, limit);
    return slice.map(o => {
      const items = (mockData.orderItems || []).filter(i => i.orderId === (o._id || o.id));
      const payments = (mockData.payments || []).filter(p => p.orderId === (o._id || o.id));
      const userId = o.user_id || (typeof o.user === 'object' ? o.user._id || o.user.id : o.user) || o.userId;
      const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
      if (user) {
        o.user = { id: user._id || user.id, _id: user._id || user.id, name: user.name, email: user.email };
      }
      return this.normalizeOrder(o, items.length > 0 ? items : (o.items || []), payments);
    });
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;
