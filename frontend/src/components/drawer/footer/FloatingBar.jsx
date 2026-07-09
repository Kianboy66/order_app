import "./FloatingBar.css";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { ShoppingCart, Plus, Trash2, Check, LogOutIcon, ClipboardList, Key } from 'lucide-react';

/* =========================================
   FLOATING BAR COMPONENT
========================================= */
export default function FloatingBar({
    isAuthenticated,
    onLogout,
    isDisabled,
    totalPrice,
    totalKartonCount,
    totalBastehCount,
    totalTakCount,
    onMenuClick,
    cartLinesCount,
}) {

    
    /* =========================================
   ORDER PAGE / FORMATTERS
   -----------------------------------------
   فرمت نمایش اعداد
========================================= */
    const fmt = (n) =>
        (n ?? 0).toLocaleString("fa-IR", { maximumFractionDigits: 0 });

    const handleItemClick = (tabName) => {
        onMenuClick(tabName);
        // setOpenSubmenu(null);
    };

    

    

    return (
        <section className="floating-bar" aria-label="نوار عملیات پایین">

            <Button variant="primary" icon={<ShoppingCart size={18} />} 
                onClick={() => handleItemClick('shopping-cart')} >سبد خرید
                {cartLinesCount > 0 && (
                    <Badge variant="success" size="small">
                        {cartLinesCount}
                    </Badge>
                )}
                </Button>

            <div className="floating-bar__summary">
                <div className="floating-bar__line">
                    <span>جمع فاکتور:</span>
                    <strong>{fmt(totalPrice)}</strong>
                </div>
                <div className="floating-bar__line">
                    <span>کارتن</span>
                    <strong>{totalKartonCount}</strong>
                    <span className="floating-bar__sep">|</span>
                    <span>بسته</span>
                    <strong>{totalBastehCount}</strong>
                    <span className="floating-bar__sep">|</span>
                    <span>عدد</span>
                    <strong>{totalTakCount}</strong>
                </div>
            </div>

            {!isAuthenticated ? (
                <Button
                    variant="outline"
                    icon={<Key size={18} />}
                ></Button>
            ) : (
            <Button
                variant="primary"
                onClick={onLogout}
            >
                <span
                    className='menu-icon'
                >
                    {<LogOutIcon size={18} />}
                </span>
                <span>
                    خروج از حساب کاربری
                </span>
            </Button>
            )}
            


            
            
        </section>
    );
}
