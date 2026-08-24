import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.model.js';
import User from '../models/User.model.js';
import Course from '../models/Course.model.js';
import Note from '../models/Note.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { getRazorpay } from '../config/razorpay.js';
import { sendPurchaseConfirmation } from '../utils/sendEmail.js';
import { mockData } from '../data/mockStore.js';

export const getRazorpayKey = (req, res, next) => {
  sendSuccess(res, 200, 'Razorpay key fetched', { key: process.env.RAZORPAY_KEY_ID || 'rzp_test_siddacademy123' });
};

export const createOrder = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      throw new AppError('Order items cannot be empty', 400);
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.itemType || !item.itemId) {
        throw new AppError('Invalid item format', 400);
      }
      let dbItem;
      if (mongoose.connection.readyState === 1) {
        if (item.itemType === 'course') {
          dbItem = await Course.findById(item.itemId);
        } else if (item.itemType === 'note') {
          dbItem = await Note.findById(item.itemId);
        }
      } else {
        if (item.itemType === 'course') {
          dbItem = mockData.courses.find(c => c._id === item.itemId);
        } else if (item.itemType === 'note') {
          dbItem = mockData.notes.find(n => n._id === item.itemId);
        }
      }
      if (!dbItem) {
        throw new AppError(`${item.itemType} not found`, 404);
      }
      
      const price = dbItem.price || 0;
      totalAmount += price;
      orderItems.push({
        itemType: item.itemType,
        itemId: dbItem._id,
        title: dbItem.title,
        price: price
      });
    }

    let orderId = `order_${Date.now()}`;
    let rzpOrderId = `rzp_order_${Date.now()}`;

    if (mongoose.connection.readyState === 1) {
      const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        totalAmount
      });
      orderId = order._id;

      try {
        const razorpay = getRazorpay();
        const options = {
          amount: totalAmount * 100,
          currency: 'INR',
          receipt: `receipt_order_${order._id}`
        };
        const rzpOrder = await razorpay.orders.create(options);
        rzpOrderId = rzpOrder.id;
        order.razorpayOrderId = rzpOrder.id;
        await order.save();
      } catch (rzpErr) {
        order.razorpayOrderId = rzpOrderId;
        await order.save();
      }
    } else {
      const mockOrder = {
        _id: orderId,
        user: req.user._id,
        items: orderItems,
        totalAmount,
        paymentStatus: 'pending',
        razorpayOrderId: rzpOrderId,
        createdAt: new Date()
      };
      mockData.orders.unshift(mockOrder);
    }

    return sendSuccess(res, 200, 'Order created', {
      orderId: orderId,
      razorpayOrderId: rzpOrderId,
      amount: totalAmount,
      currency: 'INR'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    if (process.env.RAZORPAY_KEY_SECRET && razorpaySignature) {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        throw new AppError('Invalid signature', 400);
      }
    }

    if (mongoose.connection.readyState === 1) {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      order.paymentStatus = 'paid';
      order.razorpayPaymentId = razorpayPaymentId || `sim_pay_${Date.now()}`;
      order.razorpaySignature = razorpaySignature || 'simulated_sig';
      await order.save();

      const user = await User.findById(req.user._id);

      for (const item of order.items) {
        if (item.itemType === 'course') {
          if (!user.purchasedCourses.includes(item.itemId.toString())) {
            user.purchasedCourses.push(item.itemId.toString());
          }
          await Course.findByIdAndUpdate(item.itemId, { $inc: { totalStudents: 1 } });
        } else if (item.itemType === 'note') {
          if (!user.purchasedNotes.includes(item.itemId.toString())) {
            user.purchasedNotes.push(item.itemId.toString());
          }
        }
      }
      
      await user.save();

      try {
        await sendPurchaseConfirmation(user.email, user.name, order.items, order.totalAmount);
      } catch (err) {
        console.error('Failed to send purchase confirmation email', err);
      }

      return sendSuccess(res, 200, 'Payment verified', { message: 'Payment verified', order });
    }

    // In-memory fallback
    const order = mockData.orders.find(o => o._id === orderId);
    if (!order) throw new AppError('Order not found', 404);
    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpayPaymentId || `sim_pay_${Date.now()}`;

    const user = mockData.users.find(u => u._id === req.user._id || u.id === req.user._id);
    if (user) {
      for (const item of order.items) {
        if (item.itemType === 'course' && !user.purchasedCourses.includes(item.itemId)) {
          user.purchasedCourses.push(item.itemId);
        } else if (item.itemType === 'note' && !user.purchasedNotes.includes(item.itemId)) {
          user.purchasedNotes.push(item.itemId);
        }
      }
    }

    return sendSuccess(res, 200, 'Payment verified', { message: 'Payment verified', order });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const orders = await Order.find({ user: req.user._id }).populate('items.itemId').sort({ createdAt: -1 });
      return sendSuccess(res, 200, 'Orders fetched', { orders });
    }

    const orders = mockData.orders.filter(o => o.user === req.user._id || (o.user && o.user._id === req.user._id));
    return sendSuccess(res, 200, 'Orders fetched', { orders });
  } catch (error) {
    next(error);
  }
};

