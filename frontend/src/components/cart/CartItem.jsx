import React from "react";
import { fmtCurrency, fmt } from "../../utils/number";
import Badge from '../ui/Badge'
import Button from "../ui/Button";
import { Trash2, Trash } from "lucide-react";
import { BastehInfo, PriceRow, QtyBlock } from '../ProductCard/ProductCard'
import '../ProductCard/ProductCard.css';

export default function CartItem({
    item,
    onIncrease,
    onDecrease,
    onRemove,
    total
}) {

    const few = item.few
    const sizes = item.sizes
    const qty = item.qty
    const prices = item.prices

    return (
        <article className='product-item' dir="rtl" role="group" aria-label={item.name}>
            <div className="row__first--cart">
                <section className="product-image-section">
                    <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="product-image-box"
                    />
                </section>

                <section className="product-info">
                    <div className="info-row info-value product-name">{item.name}</div>
                    <div className="info-row info-value product-code">{item.code}</div>
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
                                console.log("MINUS CLICK", item.id, "carton", onDecrease)
                                onDecrease?.(item, "carton")
                            }}
                            onPlus={() => {
                                console.log("PLUS CLICK", item.id, "carton", onIncrease)
                                onIncrease?.(item, "carton")
                            }}
                            tone="green"
                        />
                    </div>

                    <div className="counter-row">
                        <BastehInfo className="counter-label" label="بسته" value={sizes?.Basteh} />
                        <QtyBlock
                            label="بسته"
                            value={qty?.Basteh || 0}
                            onMinus={() => {
                                console.log("MINUS CLICK", item.id, "Basteh", onDecrease)
                                onDecrease?.(item, "Basteh")
                            }}
                            onPlus={() => {
                                console.log("PLUS CLICK", item.id, "Basteh", onIncrease)
                                onIncrease?.(item, "Basteh")
                            }}
                            tone="amber"
                        />
                    </div>

                    <div className="counter-row">
                        <BastehInfo className="counter-label" label="تک" value={sizes?.tak} />
                        <QtyBlock
                            label="تک"
                            value={qty?.tak || 0}
                            onMinus={() => {
                                console.log("MINUS CLICK", item.id, "tak", onDecrease)
                                onDecrease?.(item, "tak")
                            }}
                            onPlus={() => {
                                console.log("PLUS CLICK", item.id, "tak", onIncrease)
                                onIncrease?.(item, "tak")
                            }}
                            tone="rose"
                        />
                    </div>

                </div>

                <div className="cost">

                    <PriceRow label="قیمت واحد" value={fmtCurrency(prices?.single)} />


                    <aside className="price-box total-price">
                        <strong className="">{fmtCurrency(total)}</strong>
                    </aside>
                </div>




            </section>

            <div className="cart-item-actions">

                <Button
                    variant="circle"
                    className="remove-btn"
                    onClick={() => onRemove(item)}
                >
                    <span className='menu-icon'>{<Trash size={18} />}</span>
                    {/* 🗑️ */}
                </Button>

            </div>

        </article>
    );
}
