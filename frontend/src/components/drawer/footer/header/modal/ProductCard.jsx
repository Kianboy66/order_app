import React from 'react';
import './ProductCard.css';
import Badge from '../ui/Badge';
import { hasPermission } from "../../utils/permissions";
import { fmtCurrency } from '../../utils/number';

/**
 * Format number to Persian locale with thousand separators
 */
function fmt(value) {
    if (value == null || isNaN(value)) return '0';
    return Math.round(value).toLocaleString('fa-IR');
}

/**
 * Quantity control block (counter)
 */
export function QtyBlock({ label, value, onMinus, onPlus, tone = "green", authUser }) {
    // const canUseCart = hasPermission(authUser, "canViewOrder");
    // if (!canUseCart) {
    //     const canUseCart = hasPermission(authUser, "canViewOrder");
    //     console.log("CART authUser:", authUser);
    //     console.log("CART canUseCart:", canUseCart);
    //     return null;
    // }
    return (
        <div className={`counter tone--${tone}`}>
            <button
                type="button"
                className="minus"
                onClick={onMinus}
                aria-label={`کم کردن ${label}`}
            >
                −
            </button>
            <input value={value} className="qty-input carton-input" aria-live="polite" onChange={(e) => onChange(Number(e.target.value))}>

            </input>
            <button
                type="button"
                className="plus"
                onClick={onPlus}
                aria-label={`افزودن ${label}`}
            >
                ＋
            </button>
        </div>
    );
}

/* =========================================
   Basteh INFO COMPONENT
   -----------------------------------------
   صفر هم نمایش داده می‌شود تا داده‌ها پنهان نشوند
========================================= */
export function BastehInfo({ label, value }) {
    return (
        <div className="counter-label">
            <span className="">{label}</span>
            <span className="carton-Quantity">{value ?? 1}</span>
        </div>
    );
}

/**
 * Price row (unit price display)
 */
export function PriceRow({ label, value }) {
    return (
        <div className="price-box unit-price">
            <span className="price-title">{label}</span>
            <strong className="price-value">{value}</strong>
        </div>
    );
}

/**
 * Product Card Component
 * Displays a single product with image, info, quantity controls, and pricing
 */
export default function ProductCard({
    className = '',
    name,
    code,
    few,
    productImg,
    sizes,
    prices,
    qty,
    total,
    rowTotals,
    onMinus,
    onPlus,
    dec,
    inc,
}) {
    return (
        <article className={className} dir="rtl" role="group" aria-label={name}>
            <div className="row__first--cart">
                <section className="product-image-section">
                    <img
                        src={productImg}
                        alt={name}
                        loading="lazy"
                        className="product-image-box"
                    />
                </section>

                <section className="product-info">
                    <div className="info-row info-value product-name">{name}</div>
                    <div className="info-row info-value product-code">{code}</div>
                    {few >= 1 && (
                        <div className="info-row info-value product-stock">{few}<span>عدد</span></div>
                    )}
                    {few === 0 && (
                        <Badge variant="danger">ناموجود</Badge>
                    )}


                </section>
            </div>
            <section className="product-order">
                <div className="quantity">
                    <div className="counter-row">
                        <BastehInfo className="counter-label" label="کارتن" value={sizes?.carton} />
                        <QtyBlock
                            label="کارتن"
                            value={qty?.carton || 0}
                            onMinus={() => {
                                dec("carton");
                            }}
                        onPlus={() => {
                            inc("carton");
                        }}
                            tone="green"
                        />
                    </div>

                    <div className="counter-row">
                        <BastehInfo className="counter-label" label="بسته" value={sizes?.Basteh} />
                        <QtyBlock
                            label="بسته"
                            value={qty?.Basteh || 0}
                            onMinus={() => dec("Basteh")}
                            onPlus={() => inc("Basteh")}
                            tone="amber"
                        />
                    </div>

                    <div className="counter-row">
                        <BastehInfo label="تک" value={sizes?.tak} />
                        <QtyBlock
                            label="تک"
                            value={qty?.tak || 0}
                            onMinus={() => {
                                console.log("MINUS CLICK PRODUCT CART", qty, "carton", dec)
                                dec("tak")
                            }}
                            onPlus={() => inc("tak")}
                            tone="rose"
                        />
                    </div>

                </div>

                <div className="cost"> 

                    <PriceRow label="قیمت واحد" value={fmtCurrency(prices?.single)} />


                    <aside className="price-box total-price">
                        <strong className="">{fmt(total)}</strong>
                    </aside>
                </div>




            </section>

        </article>
    );
}
