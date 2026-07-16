import Order from "../models/Order.js"
import Product from "../models/Product.js"
import User from "../models/User.js"
import Address from "../models/Address.js"
import mongoose from "mongoose"
import stripe from "stripe"

const attachOrderRelations = async (orders) => {
    const validProductIds = [
        ...new Set(
            orders.flatMap((order) =>
                order.items
                    .map((item) => item.product)
                    .filter((productId) => mongoose.Types.ObjectId.isValid(productId))
            )
        ),
    ];

    const validAddressIds = [
        ...new Set(
            orders
                .map((order) => order.address)
                .filter((addressId) => mongoose.Types.ObjectId.isValid(addressId))
        ),
    ];

    const [products, addresses] = await Promise.all([
        Product.find({ _id: { $in: validProductIds } }).lean(),
        Address.find({ _id: { $in: validAddressIds } }).lean(),
    ]);

    const productMap = new Map(products.map((product) => [String(product._id), product]));
    const addressMap = new Map(addresses.map((address) => [String(address._id), address]));

    return orders.map((order) => ({
        ...order,
        items: order.items
            .filter((item) => productMap.has(String(item.product)))
            .map((item) => ({
                ...item,
                product: productMap.get(String(item.product)),
            })),
        address: addressMap.get(String(order.address)) || null,
    }));
};

// Place Order COD: /api/order/cod
export const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.user.id;
        const { items, address } = req.body;
        if (!address || !Array.isArray(items) || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" })
        }

        const validObjectIdItems = items.filter(
            (item) =>
                mongoose.Types.ObjectId.isValid(item.product) &&
                Number(item.quantity) > 0
        );

        if (validObjectIdItems.length === 0) {
            await User.findByIdAndUpdate(userId, { cartItems: {} });
            return res.json({
                success: false,
                message: "Your cart had old invalid products. Please add products again.",
            });
        }

        const productIds = validObjectIdItems.map((item) => item.product);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(
            products.map((product) => [String(product._id), product])
        );

        const orderItems = validObjectIdItems.filter((item) =>
            productMap.has(String(item.product))
        );

        if (orderItems.length === 0) {
            await User.findByIdAndUpdate(userId, { cartItems: {} });
            return res.json({
                success: false,
                message: "Products in your cart are no longer available. Please add them again.",
            });
        }

        let amount = orderItems.reduce((total, item) => {
            const product = productMap.get(String(item.product));
            return total + product.offerPrice * Number(item.quantity);
        }, 0);

        // Add Tax Charge (2%)
        amount += Math.floor(amount * 0.02);

        await Order.create({
            userId,
            items: orderItems,
            amount,
            address,
            paymentType: "COD",
        })

        await User.findByIdAndUpdate(userId, { cartItems: {} });

        return res.json({ success: true, message: "Order Placed Successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Orders by User ID : /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({
            userId,
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        })
        .sort({ createdAt: -1 })
        .lean();

        const cleanedOrders = await attachOrderRelations(orders);

        res.json({ success: true, orders: cleanedOrders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Get All Orders (for seller / admin) : /api/order/seller
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).sort({ createdAt: -1 }).lean();

        const cleanedOrders = await attachOrderRelations(orders);

        res.json({ success: true, orders: cleanedOrders })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
