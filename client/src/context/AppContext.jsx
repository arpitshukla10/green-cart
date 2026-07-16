import React, { useEffect, createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { dummyProducts } from "../assets/assets";
import { getProductCatalogKey, mergeCatalogProducts } from "../utils/productDisplay";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

export const AppContext = createContext();

const isMongoObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

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

            if (data.success && Array.isArray(data.products)) {
                setProducts(mergeCatalogProducts(data.products));
                return;
            }

            setProducts(dummyProducts);
        } catch (error) {
            console.log("Failed to fetch products:", error);
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
                const sanitizedCartItems = Object.fromEntries(
                    Object.entries(data.user.cartItems || {}).filter(
                        ([, quantity]) => Number(quantity) > 0
                    )
                );

                setUser(data.user);
                setCartItems(sanitizedCartItems);
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

    useEffect(() => {
        if (products.length === 0 || !cartItems) {
            return;
        }

        const validProductIds = new Set(products.map((product) => String(product._id)));
        const productIdByCatalogKey = new Map(
            products.map((product) => [getProductCatalogKey(product), String(product._id)])
        );

        const migratedCartItems = Object.entries(cartItems).reduce((acc, [productId, quantity]) => {
            if (Number(quantity) <= 0) {
                return acc;
            }

            if (validProductIds.has(String(productId))) {
                acc[productId] = Number(quantity);
                return acc;
            }

            const matchedDummyProduct = dummyProducts.find(
                (product) => String(product._id) === String(productId)
            );

            if (!matchedDummyProduct) {
                return acc;
            }

            const mappedProductId = productIdByCatalogKey.get(getProductCatalogKey(matchedDummyProduct));

            if (mappedProductId) {
                acc[mappedProductId] = (acc[mappedProductId] || 0) + Number(quantity);
            }

            return acc;
        }, {});

        if (JSON.stringify(migratedCartItems) !== JSON.stringify(cartItems)) {
            setCartItems(migratedCartItems);
            return;
        }

        const sanitizedCartItems = Object.fromEntries(
            Object.entries(cartItems).filter(([productId, quantity]) =>
                validProductIds.has(String(productId)) && Number(quantity) > 0
            )
        );

        if (Object.keys(sanitizedCartItems).length !== Object.keys(cartItems).length) {
            setCartItems(sanitizedCartItems);
        }
    }, [products, cartItems]);

    // Sync Cart
    useEffect(() => {

        const updateCart = async () => {

            if (!user) return;

            try {

                await axios.post("/api/cart/update", {
                    cartItems: Object.fromEntries(
                        Object.entries(cartItems).filter(([productId, quantity]) =>
                            isMongoObjectId(productId) && Number(quantity) > 0
                        )
                    ),
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
