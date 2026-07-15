import React, { useEffect, createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { dummyProducts } from "../assets/assets";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {

    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [showUserLogin, setShowUserLogin] = useState(false);

    const [products, setProducts] = useState([]);

    const [cartItems, setCartItems] = useState({});
    const [searchQuery, setSearchQuery] = useState("");

    const fetchProducts = async () => {
        try {
            const { data } = await axios.get("/api/product/list");

            if (data.success) {
                setProducts(data.products);
            } else {
                setProducts(dummyProducts);
            }
        } catch (error) {
            setProducts(dummyProducts);
        }
    };

    // Seller Auth
    const fetchSeller = async () => {
        try {
            const { data } = await axios.get("/api/seller/is-auth");
            setIsSeller(data.success);
        } catch (error) {
            setIsSeller(false);
        }
    };

    // User Auth
    const fetchUser = async () => {
        try {
            const { data } = await axios.get("/api/user/is-auth");

            if (data.success) {
                setUser(data.user);
                setCartItems(data.user.cartItems || {});
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        }
    };

    // Add To Cart
    const addToCart = (itemId) => {
        let cartData = structuredClone(cartItems);

        cartData[itemId] = (cartData[itemId] || 0) + 1;

        setCartItems(cartData);
        toast.success("Added to Cart");
    };

    // Update Cart
    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems);

        cartData[itemId] = quantity;

        if (cartData[itemId] <= 0) {
            delete cartData[itemId];
        }

        setCartItems(cartData);
    };

    // Remove Cart
    const removeFromCart = (itemId) => {
        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            cartData[itemId]--;

            if (cartData[itemId] <= 0) {
                delete cartData[itemId];
            }
        }

        setCartItems(cartData);
    };

    // Cart Count
    const getCartCount = () => {
        return Object.values(cartItems).reduce((a, b) => a + b, 0);
    };

    // Cart Amount
    const getCartAmount = () => {

        let total = 0;

        for (const id in cartItems) {

            const product = products.find(
                (item) => String(item._id) === String(id)
            );

            if (product) {
                total += product.offerPrice * cartItems[id];
            }
        }

        return total;
    };

    // Initial Load
    useEffect(() => {
        fetchUser();
        fetchSeller();
        fetchProducts();
    }, []);

    // Sync Cart
    useEffect(() => {

        const updateCart = async () => {

            if (!user) return;

            try {

                await axios.post("/api/cart/update", {
                    cartItems,
                });

            } catch (error) {
                console.log(error);
            }
        };

        updateCart();

    }, [cartItems, user]);

    useEffect(() => {
        if (!user) {
            setCartItems({});
        }
    }, [user]);

    const value = {
        navigate,
        user,
        setUser,
        isSeller,
        setIsSeller,
        showUserLogin,
        setShowUserLogin,
        products,
        setProducts,
        currency,
        addToCart,
        updateCartItem,
        removeFromCart,
        cartItems,
        setCartItems,
        searchQuery,
        setSearchQuery,
        getCartCount,
        getCartAmount,
        fetchProducts,
        axios,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext);
};
