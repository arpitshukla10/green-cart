import User from "../models/User.js"
import mongoose from "mongoose";

// Update User CartData: /api/cart/update

export const updateCart = async (req, res) => {
    try {
        const { cartItems } = req.body;
        const userId = req.user.id;
        const sanitizedCartItems = Object.fromEntries(
            Object.entries(cartItems || {}).filter(([productId, quantity]) =>
                mongoose.Types.ObjectId.isValid(productId) && Number(quantity) > 0
            )
        );

        await User.findByIdAndUpdate(userId, { cartItems: sanitizedCartItems })
        res.json({ success: true, message: "Cart Updated" })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}
