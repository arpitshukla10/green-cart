import dns from "dns"
dns.setServers(['1.1.1.1', '8.8.8.8']);

import 'dotenv/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import userRouter from './routes/UserRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import connectCloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRouter.js';
import orderRouter from './routes/orderRoute.js';

const app = express();
const port = process.env.PORT || 5000;

await connectDB()
await connectCloudinary()

const envOrigins = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.VITE_CLIENT_URL,
    process.env.CORS_ORIGINS,
]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://green-cart-eight-chi.vercel.app',
    'https://green-cart-n2dqkuepr-arpitshuklaa63-1252s-projects.vercel.app',
    ...envOrigins,
];

const isAllowedOrigin = (origin) => {
    if (!origin) return true;

    if (allowedOrigins.includes(origin)) return true;

    try {
        const { hostname, protocol } = new URL(origin);
        return protocol === 'https:' && hostname.endsWith('.vercel.app');
    } catch {
        return false;
    }
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => res.send("API IS WORKING"));
app.use('/api/user', userRouter)
app.use('/api/seller', sellerRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/address', addressRouter)
app.use('/api/order', orderRouter)

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

export default app;
