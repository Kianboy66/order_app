import React, { useEffect, useMemo, useState } from "react";
import CartItem from "./CartItem";
import { getItemTotal } from "../ProductList/ProductList";
import { fmtCurrency } from "../../utils/number";
import { buildOrderPayload } from "../../utils/buildOrderPayload";
import { useSubmitOrder } from "./hooks/useSubmitOrder";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { CalendarArrowUp, Trash2 } from "lucide-react";
import "../ProductCard/ProductCard.css";

export default function CartModal({
    items = [],
    totals,
    handleQtyChange,
    handleRemoveItem,
    handleClearCart,
    selectedCustomer,
    setSelectedCustomer,
    cartLinesCount,
    comment = "",
    onCommentChange,
    onMenuClick,
    authUser,
}) {
    const [discountpercent, setDiscountPercent] = useState(() => {
        return Number(localStorage.getItem("cart_discountpercent")) || 0;
    });

    const {
        isSubmitting,
        submitResult,
        submitOrder,
        closeSubmitResult,
    } = useSubmitOrder({
        onSuccess: () => {
            handleClearCart?.();

            if (typeof setSelectedCustomer === "function") {
                setSelectedCustomer(null);
            }

            if (typeof onCommentChange === "function") {
                onCommentChange("");
            }
        },
    });

    useEffect(() => {
        localStorage.setItem("cart_discountpercent", String(discountpercent));
    }, [discountpercent]);

    const currentUser = authUser || null;

    const itemsTotal = useMemo(() => {
        return (items ?? []).reduce((sum, item) => {
            const qtyCarton = Number(item?.qty?.carton || 0);
            const qtyBasteh = Number(item?.qty?.Basteh || 0);
            const qtyTak = Number(item?.qty?.tak || item?.qty?.single || 0);

            const sizeCarton = Number(item?.sizes?.carton || 1);
            const sizeBasteh = Number(item?.sizes?.Basteh || 1);

            const count =
                qtyCarton * sizeCarton +
                qtyBasteh * sizeBasteh +
                qtyTak;

            const unitPrice =
                Number(item?.prices?.single) ||
                Number(item?.sellPriceSingle) ||
                Number(item?.price) ||
                0;

            return sum + unitPrice * count;
        }, 0);
    }, [items]);

    const handleIncrease = (item, type) => {
        handleQtyChange(item.id, type, 1);
    };

    const handleDecrease = (item, type) => {
        handleQtyChange(item.id, type, -1);
    };

    const handleRemove = (item) => {
        handleRemoveItem(item.id);
    };

    const handleDiscountPercentChange = (value) => {
        const percent = Number(value) || 0;
        const normalized = Math.min(Math.max(percent, 0), 100);
        setDiscountPercent(normalized);
    };

    const calculateGrandTotal = () => {
        const percentDiscount = (itemsTotal * discountpercent) / 100;
        const finalTotal = itemsTotal - percentDiscount;
        return Math.max(finalTotal, 0);
    };

    const onConfirmSubmit = async (e) => {
        if (e && typeof e.preventDefault === "function") {
            e.preventDefault();
        }

        if (!selectedCustomer) {
            console.error("مشتری انتخاب نشده است");
            return;
        }

        if (!items || items.length === 0) {
            console.error("سبد سفارش خالی است");
            return;
        }

        const payload = buildOrderPayload({
            selectedCustomer,
            cartItems: items,
            orderDescription: comment,
            currentUser,
            discountpercent,
        });

        const result = await submitOrder(payload);

        if (result?.type === "success") {
            if (typeof onMenuClick === "function") {
                onMenuClick("shopping-cart");
            }
        }
    };

    return (
        <div className="tab-content">
            <div className="tab-header">
                <h2>🛒 سبد خرید</h2>
                <span className="count-badge">
                    {cartLinesCount} آیتم
                </span>
            </div>

            <div className="cart-layout">
                <div className="cart-items">
                    {items.length === 0 ? (
                        <div className="empty-cart">
                            <span className="empty-icon">🛒</span>
                            <h3>سبد خرید خالی است</h3>
                            <p>هنوز محصولی اضافه نکرده‌اید</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                total={getItemTotal(item)}
                                onIncrease={handleIncrease}
                                onDecrease={handleDecrease}
                                onRemove={handleRemove}
                            />
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="cart-summary">
                        <h3>خلاصه سفارش</h3>

                        <h3>
                            {selectedCustomer ? (
                                <div>
                                    <Badge variant="primary">نام مشتری: </Badge>
                                    <span>{selectedCustomer.name}</span>
                                </div>
                            ) : (
                                <span style={{ color: "var(--color-danger, #ef4444)" }}>
                                    مشتری انتخاب نشده است
                                </span>
                            )}
                        </h3>

                        <table className="order-table">
                            <thead>
                                <tr>
                                    <th>کالا</th>
                                    <th>تعداد (عدد)</th>
                                    <th>مبلغ</th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((item) => {
                                    const qty =
                                        (Number(item?.qty?.carton || 0) * Number(item?.sizes?.carton || 0)) +
                                        (Number(item?.qty?.Basteh || 0) * Number(item?.sizes?.Basteh || 0)) +
                                        Number(item?.qty?.tak || item?.qty?.single || 0);

                                    const unitPrice =
                                        Number(item?.prices?.single) ||
                                        Number(item?.sellPriceSingle) ||
                                        Number(item?.price) ||
                                        0;

                                    const rowTotal = qty * unitPrice;

                                    return (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{qty}</td>
                                            <td className="price__column">
                                                <span>{fmtCurrency(rowTotal)}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="summary-divider"></div>

                        <div className="summary-row">
                            <Badge>جمع سفارش</Badge>
                            <span className="price__sum">{fmtCurrency(itemsTotal)}</span>
                        </div>

                        <div className="summary-row">
                            <Badge variant="success">درصد تخفیف</Badge>
                            <span>
                                <input
                                    className="price__sum"
                                    style={{
                                        border: "none",
                                        padding: "5px 15px",
                                        direction: "ltr",
                                    }}
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discountpercent || ""}
                                    placeholder="درصد تخفیف"
                                    onChange={(e) => handleDiscountPercentChange(e.target.value)}
                                />
                            </span>
                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-row total">
                            <Badge variant="primary">مبلغ قابل پرداخت</Badge>
                            <span>{fmtCurrency(calculateGrandTotal())}</span>
                        </div>

                        <div className="summary-row comment">
                            <textarea
                                style={{ width: "-webkit-fill-available" }}
                                value={comment}
                                onChange={(e) => onCommentChange?.(e.target.value)}
                                placeholder="در صورت نیاز توضیحات سفارش را وارد کنید..."
                                rows={4}
                            />
                        </div>

                        {submitResult && (
                            <div
                                style={{
                                    marginTop: "12px",
                                    padding: "12px",
                                    borderRadius: "10px",
                                    background:
                                        submitResult.type === "success"
                                            ? "#ecfdf5"
                                            : submitResult.type === "queued"
                                                ? "#fff7ed"
                                                : "#fef2f2",
                                    color:
                                        submitResult.type === "success"
                                            ? "#065f46"
                                            : submitResult.type === "queued"
                                                ? "#9a3412"
                                                : "#991b1b",
                                    border:
                                        submitResult.type === "success"
                                            ? "1px solid #a7f3d0"
                                            : submitResult.type === "queued"
                                                ? "1px solid #fdba74"
                                                : "1px solid #fecaca",
                                }}
                            >
                                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                                    {submitResult.title}
                                </div>
                                <div>{submitResult.message}</div>
                                {submitResult.type === "success" && (
                                    <div style={{ marginTop: "8px", fontSize: "13px" }}>
                                        <div>Order ID: {submitResult.orderId}</div>
                                        <div>Order Number: {submitResult.orderNumber}</div>
                                        <div>ERP Code: {submitResult.erpCode}</div>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={closeSubmitResult}
                                    style={{
                                        marginTop: "10px",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "inherit",
                                        fontWeight: "bold",
                                    }}
                                >
                                    بستن
                                </button>
                            </div>
                        )}

                        <Button
                            variant="primary"
                            className="checkout-btn"
                            disabled={!selectedCustomer || isSubmitting || items.length === 0}
                            onClick={onConfirmSubmit}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-icon" style={{ marginLeft: "10px" }}>
                                        ⏳
                                    </span>
                                    <span>در حال ثبت در هلو...</span>
                                </>
                            ) : (
                                <>
                                    <span className="menu-icon">
                                        <CalendarArrowUp size={18} />
                                    </span>
                                    <span className="menu-text">ثبت نهایی سفارش</span>
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={handleClearCart}
                            className="clear-btn"
                        >
                            <span className="menu-icon">
                                <Trash2 size={18} />
                            </span>
                            <span className="menu-text">
                                پاک کردن سبد خرید
                            </span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
