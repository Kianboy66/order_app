
import { memo } from 'react';
import { Minus, Plus } from 'lucide-react';
import Button from '../ui/Button';

function QuantityControl({
    label,
    icon: Icon,
    size,
    quantity,
    tone = 'green',
    disabled = false,
    onIncrease,
    onDecrease
}) {
    return (
        <div className={`quantity-control quantity-control--${tone}`}>
            {/* بخش راست: لیبل + سایز */}
            <div className="quantity-control__label">
                {Icon && <Icon size={16} strokeWidth={2} />}
                <span className="quantity-control__label-text">{label}</span>
                <span className="quantity-control__size">{size}</span>
            </div>

            {/* بخش چپ: کنترل‌ها */}
            <div className="quantity-control__actions">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDecrease}
                    disabled={disabled || quantity === 0}
                    aria-label={`کم کردن ${label}`}
                    className="quantity-control__btn"
                >
                    <Minus size={16} />
                </Button>

                <input
                    type="text"
                    inputMode="numeric"
                    value={quantity}
                    readOnly
                    className="quantity-control__input"
                    aria-label={`تعداد ${label}`}
                    aria-live="polite"
                />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onIncrease}
                    disabled={disabled}
                    aria-label={`افزودن ${label}`}
                    className="quantity-control__btn"
                >
                    <Plus size={16} />
                </Button>
            </div>
        </div>
    );
}

export default memo(QuantityControl);
