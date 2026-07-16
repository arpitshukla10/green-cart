import { dummyProducts } from "../assets/assets";

export const getProductCatalogKey = (product) =>
    `${String(product?.category || "").toLowerCase()}::${String(product?.name || "").toLowerCase()}`;

const dummyProductsByKey = new Map(
    dummyProducts.map((product) => [getProductCatalogKey(product), product])
);
const dummyProductsById = new Map(
    dummyProducts.map((product) => [String(product._id), product])
);

const hasUsableImage = (image) =>
    Array.isArray(image) &&
    image.length > 0 &&
    typeof image[0] === "string" &&
    !image[0].startsWith("seed:");

export const decorateProductWithDemoAssets = (product) => {
    if (!product) {
        return product;
    }

    const matchedDummyProduct = dummyProductsByKey.get(getProductCatalogKey(product));

    if (!matchedDummyProduct) {
        return product;
    }

    return {
        ...matchedDummyProduct,
        ...product,
        image: hasUsableImage(product.image) ? product.image : matchedDummyProduct.image,
        description:
            Array.isArray(product.description) && product.description.length > 0
                ? product.description
                : matchedDummyProduct.description,
    };
};

export const mergeCatalogProducts = (apiProducts = []) => {
    const dedupedApiProducts = new Map();

    apiProducts.forEach((product) => {
        const productKey = getProductCatalogKey(product);
        const existingProduct = dedupedApiProducts.get(productKey);

        if (!existingProduct) {
            dedupedApiProducts.set(productKey, product);
            return;
        }

        if (!hasUsableImage(existingProduct.image) && hasUsableImage(product.image)) {
            dedupedApiProducts.set(productKey, product);
        }
    });

    const matchedProductKeys = new Set();

    const mergedProducts = Array.from(dedupedApiProducts.values()).map((product) => {
        const decoratedProduct = decorateProductWithDemoAssets(product);
        matchedProductKeys.add(getProductCatalogKey(decoratedProduct));
        return decoratedProduct;
    });

    dummyProducts.forEach((product) => {
        if (!matchedProductKeys.has(getProductCatalogKey(product))) {
            mergedProducts.push(product);
        }
    });

    return mergedProducts;
};

export const getDummyProductById = (productId) => dummyProductsById.get(String(productId)) || null;
