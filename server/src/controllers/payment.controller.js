import crypto from 'crypto';
import Order from '../models/Order.model.js';
import User from '../models/User.model.js';
import Course from '../models/Course.model.js';
import Note from '../models/Note.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { getRazorpay } from '../config/razorpay.js';
import { sendPurchaseConfirmation } from '../utils/sendEmail.js';

export const getRazorpayKey = (req, res, next) => {
  sendSuccess(res, 200, 'Razorpay key fetched', { key: process.env.RAZORPAY_KEY_ID });
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
      if (item.itemType === 'course') {
        dbItem = await Course.findById(item.itemId);
      } else if (item.itemType === 'note') {
        dbItem = await Note.findById(item.itemId);
      }
      if (!dbItem) {
        throw new AppError(`${item.itemType} not found`, 404);
      }
      
      const price = dbItem.price;
      totalAmount += price;
      orderItems.push({
        itemType: item.itemType,
        itemId: dbItem._id,
        title: dbItem.title,
        price: price
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount
    });

    const razorpay = getRazorpay();
    const options = {
      amount: totalAmount * 100, // amount in the smallest currency unit
      currency: 'INR',
      receipt: `receipt_order_${order._id}`
    };

    const rzpOrder = await razorpay.orders.create(options);
    
    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    sendSuccess(res, 200, 'Order created', {
      orderId: order._id,
      razorpayOrderId: rzpOrder.id,
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

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new AppError('Invalid signature', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
       throw new AppError('Order not found', 404);
    }

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    const user = await User.findById(req.user._id);

    for (const item of order.items) {
      if (item.itemType === 'course') {
        if (!user.purchasedCourses.includes(item.itemId)) {
          user.purchasedCourses.push(item.itemId);
        }
        await Course.findByIdAndUpdate(item.itemId, { $inc: { totalStudents: 1 } });
      } else if (item.itemType === 'note') {
        if (!user.purchasedNotes.includes(item.itemId)) {
          user.purchasedNotes.push(item.itemId);
        }
      }
    }
    
    await user.save();

    try {
       await sendPurchaseConfirmation(user.email, user.name, order);
    } catch (err) {
       console.error('Failed to send purchase confirmation email', err);
    }

    sendSuccess(res, 200, 'Payment verified', { message: 'Payment verified', order });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.itemId').sort({ createdAt: -1 });
    sendSuccess(res, 200, 'Orders fetched', { orders });
  } catch (error) {
    next(error);
  }
};
