import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ✅ Login Seller: /api/seller/login
export const sellerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL) {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });

            res.cookie('sellerToken', token, cookieOptions);

            return res.json({ success: true, message: "Logged In" });
        } else {
            return res.json({ success: false, message: "Invalid Credentials" });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// ✅ Seller Auth Check: /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    try {
        return res.json({ success: true, user: req.user });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// ✅ Logout Seller: /api/seller/logout
export const sellerlogout = async (req, res) => {
    try {
        res.clearCookie('sellerToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'None' : 'Lax',
        });

        return res.json({ success: true, message: "Logged Out" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
