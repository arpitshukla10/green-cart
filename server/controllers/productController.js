import { v2 as cloudinary } from 'cloudinary'
import Product from '../models/Product.js';
import mongoose from 'mongoose';
import demoProducts from '../data/demoProducts.js';

// Add Product: /api/product/add
export const addProduct = async (req, res) => {
    try {
        let productData = JSON.parse(req.body.productData);

        const images = req.files

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url
            })
        )

        await Product.create({ ...productData, image: imagesUrl })
        res.json({ success: true, message: "Product Added" })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Seed Demo Products: /api/product/seed-demo
export const seedDemoProducts = async (req, res) => {
    try {
        const existingProducts = await Product.find({}, "name category").lean();
        const existingKeys = new Set(
            existingProducts.map(
                (product) => `${String(product.category || "").toLowerCase()}::${String(product.name || "").toLowerCase()}`
            )
        );

        const productsToInsert = demoProducts
            .filter((product) => !existingKeys.has(`${product.category.toLowerCase()}::${product.name.toLowerCase()}`))
            .map((product) => ({
                name: product.name,
                description: product.description,
                price: product.price,
                offerPrice: product.offerPrice,
                image: [`seed:${product.seedKey}`],
                category: product.category,
                inStock: product.inStock,
            }));

        if (productsToInsert.length === 0) {
            return res.json({ success: true, message: "Demo products already exist" });
        }

        await Product.insertMany(productsToInsert);

        return res.json({
            success: true,
            message: `${productsToInsert.length} demo products seeded successfully`,
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get Product: /api/product/list
export const productList = async (req, res) => {
    try {
        const products = await Product.find({})
        res.json({ success: true, products })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get Single Product: /api/product/id
export const productById = async (req, res) => {
    try {
        const id = req.query.id || req.body.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid product id" });
        }

        const products = await Product.findById(id)
        res.json({ success: true, products })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Change Product Stock: /api/product/stock
export const changeStock = async (req, res) => {
    try {
        const { id, inStock } = req.body

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid product id" });
        }

        await Product.findByIdAndUpdate(id, { inStock })
        res.json({ success: true, message: "Stock Updated" })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}
