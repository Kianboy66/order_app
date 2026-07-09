import React, { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from '../ProductCard/ProductCard';
import { fetchProducts } from '../../services/productApi';
import { mergeProductsWithStoredCart, buildCategoryTree } from '../../adapters/productAdapter';
import { loadOrderCart, saveOrderCart } from '../../utils/cartStorage';
import Button from '../ui/Button';

const LOAD_MORE_STEP = 30;

/**
 * Get product theme color based on stock and selection
 */
function getProductTheme(product) {
    const few = Number(product?.stock?.single || product?.stock?.tak || 0);

    const isSelected =
        Number(product?.qty?.carton || 0) > 0 ||
        Number(product?.qty?.Basteh || 0) > 0 ||
        Number(product?.qty?.single || 0) > 0;

    if (isSelected) {
        return "green";
    } else {
        if (few <= 0) return "gray";
        if (few > 0 && product?.SideGroupErpCode.includes("bBAHNA5VDg0=")) return "red";
    }

    return "yellow";
}

/**
 * Get product card CSS class
 */
function getProductCardClassName(product) {
    const classes = ["product-card"];
    const theme = getProductTheme(product);
    if (theme === "green") {
        classes.push("product-card--selected");
    }
    if (theme === "yellow") classes.push("product-card--available");
    if (theme === "red") classes.push("product-card--production");
    if (theme === "gray") classes.push("product-card--unavailable");




    return classes.join(" ");
}

/**
 * Calculate total price for a product
 */
export function getItemTotal(item) {
    const cartonQty = item.qty?.carton || 0;
    const BastehQty = item.qty?.Basteh || 0;
    const singleQty = item.qty?.single || item.qty?.tak || 0;

    const cartonSize = item.CountInKarton || item.sizes?.carton || 1;
    const BastehSize = item.CountInBasteh || item.sizes?.Basteh || 1;

    const totalUnits = cartonQty * cartonSize + BastehQty * BastehSize + singleQty;
    const unitPrice = item.prices?.single || item.prices?.tak || 0;

    return totalUnits * unitPrice;
}

/**
 * Calculate total item count (in single units)
 */
function getItemCount(item) {
    const cartonQty = item.qty?.carton || 0;
    const BastehQty = item.qty?.Basteh || 0;
    const singleQty = item.qty?.single || item.qty?.tak || 0;

    const cartonSize = item.CountInKarton || item.sizes?.carton || 1;
    const BastehSize = item.CountInBasteh || item.sizes?.Basteh || 1;

    return cartonQty * cartonSize + BastehQty * BastehSize + singleQty;
}

/**
 * Calculate row total for specific type
 */
export function getItemRowTotal(item, type) {
    const qty = item.qty?.[type] || 0;
    const price = item.prices?.[type] || 0;
    return qty * price;
}

/**
 * ProductList Component
 * Main component for displaying product grid with search and load more
 */


export default function ProductList({
    products: externalProducts, // no default []
    searchTerm = "",
    onProductsLoad,
    onQtyChange,
}) {
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [error, setError] = useState(null);
    const [visibleCount, setVisibleCount] = useState(LOAD_MORE_STEP);
    const [categories, setCategories] = useState([]);

    const onProductsLoadRef = useRef(onProductsLoad);

    useEffect(() => {
        onProductsLoadRef.current = onProductsLoad;
    }, [onProductsLoad]);

    const DEBUG_ORDER = true;

    const dlog = (...args) => {
        if (!DEBUG_ORDER) return;
        console.log(...args);
    };

    useEffect(() => {
        let alive = true;

        const loadProducts = async () => {
            setError(null);
            setLoadingProducts(true);

            try {
                const normalizedProducts = await fetchProducts();
                if (!alive) return;

                const storedCart = loadOrderCart();
                const mergedProducts = mergeProductsWithStoredCart(
                    normalizedProducts,
                    storedCart
                );

                const categoryTree = buildCategoryTree(mergedProducts);

                setProducts(mergedProducts);
                setCategories(categoryTree);

                onProductsLoadRef.current?.({
                    products: mergedProducts,
                    categories: categoryTree,
                });

                dlog("[ORDER][FETCH] success:", {
                    count: mergedProducts.length,
                    categoryCount: categoryTree.length,
                    sample: mergedProducts.slice(0, 2),
                });
            } catch (e) {
                if (!alive) return;
                setError(e?.message || "دریافت محصولات با خطا مواجه شد");
            } finally {
                if (!alive) return;
                setLoadingProducts(false);
            }
        };

        loadProducts();

        return () => {
            alive = false;
        };
    }, []);

    const sourceProducts =
        externalProducts !== undefined ? externalProducts : products;

    useEffect(() => {
        setVisibleCount(LOAD_MORE_STEP);
    }, [sourceProducts, searchTerm]);

    const filteredProducts = sourceProducts;


    const visibleProducts = useMemo(() => {
        return filteredProducts.slice(0, visibleCount);
    }, [filteredProducts, visibleCount]);

    const updateQty = (id, type, delta) => {
        if (externalProducts && onQtyChange) {
            onQtyChange(id, type, delta);
            return;
        }

        const normalizedType = type === "tak" ? "single" : type;

        setProducts((prevProducts) =>
            prevProducts.map((product) => {
                if (product.id !== id) return product;

                const currentQty = product.qty?.[normalizedType] || 0;
                const nextQty = Math.max(0, currentQty + delta);

                return {
                    ...product,
                    qty: {
                        ...product.qty,
                        [normalizedType]: nextQty,
                        ...(normalizedType === "single" && { tak: nextQty }),
                    },
                };
            })
        );
    };



    const handleDec = (id, type) => {
        updateQty(id, type, -1);
    }
    const handleInc = (id, type) => {
        updateQty(id, type, 1);
    }

    const onLoadMore = () => {
        setVisibleCount((prev) => prev + LOAD_MORE_STEP);
    };

    if (error) {
        return (
            <div style={{ padding: "20px", textAlign: "center", color: "#f44336" }}>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>تلاش مجدد</button>
            </div>
        );
    }

    if (loadingProducts) {
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                <p>در حال بارگذاری محصولات...</p>
            </div>
        );
    }
    

    const hasMoreProducts = visibleCount < filteredProducts.length;

    return (
        <main className="content">
            <div className="product-grid">
                {filteredProducts.length === 0 ? (
                    <div className="empty-state">محصولی یافت نشد</div>
                ) : (
                    visibleProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            className={getProductCardClassName(product)}
                            name={product.name}
                            code={product.code}
                            few={product.few}
                            productImg={product.productImg}
                            sizes={product.sizes}
                            prices={product.prices}
                            qty={product.qty}
                            total={getItemTotal(product)}
                            rowTotals={{
                                carton: getItemRowTotal(product, "carton"),
                                Basteh: getItemRowTotal(product, "Basteh"),
                                single: getItemRowTotal(product, "single"),
                            }}
                            dec={(type) => handleDec(product.id, type)}
                            inc={(type) => handleInc(product.id, type)}
                        />
                    ))
                )}
            </div>

            {hasMoreProducts && (
                <div className="more__info" style={{ justifyContent: "center" }}>
                    <Button variant="outline" onClick={onLoadMore}>
                        نمایش بیشتر
                    </Button>
                </div>
            )}
        </main>
    );
}


