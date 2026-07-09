
import { memo } from 'react';

function ProductInfo({ name, code, stock, isOutOfStock }) {
    return (
        <div className="product-info">
            <h3 className="product-info__name">{name}</h3>
            <p className="product-info__code">{code}</p>

            {!isOutOfStock && stock >= 1 && (
                <p className="product-info__stock">
                    <span className="product-info__stock-value">{stock}</span>
                    <span className="product-info__stock-unit">عدد</span>
                </p>
            )}
        </div>
    );
}

export default memo(ProductInfo);
