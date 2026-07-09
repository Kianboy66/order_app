import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import Button from '../ui/Button';
import './Header.css';

export default function Header({
    toggleDrawer,
    isLoggedIn,
    activeTab,
    searchTerm,        // دریافت مقدار سرچ از App
    onSearchChange,    // دریافت هندلر تغییر سرچ از App
    customerSearchValue,
    onCustomerSearchChange,
    onAddCustomerClick,
}) {

    const getPageTitle = () => {
        const titles = {
            'product-list': 'لیست محصولات',
            'categories': 'دسنه بندی محصولات',
            'success-orders': 'سفارشات موفق',
            'pending-orders': 'سفارشات در انتظار',
            'failed-orders': 'سفارشات شکست خورده',
            'customer-management': 'مدیریت مشتریان',
            'product-label': 'برچسب محصولات',
            'shopping-cart': 'سبد خرید'
        };
        return isLoggedIn ? titles[activeTab] : 'پنل مدیریت';
    };


    const [now, setNow] = useState(new Date());

    /* =========================================
       CLOCK EFFECT
       -----------------------------------------
       بروزرسانی زمان بالای صفحه به صورت استاندارد
    ========================================= */
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const jalaliDate = useMemo(() => {
        try {
            return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).format(now);
        } catch {
            return "----/--/--";
        }
    }, [now]);

    const timeText = useMemo(() => {
        try {
            return new Intl.DateTimeFormat("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }).format(now);
        } catch {
            return "--:--:--";
        }
    }, [now]);

    const handleClearSearch = () => {
        onSearchChange?.('');
    };

    // شرط نمایش نوار جستجو: فقط در حالت لاگین و صرفاً در تب لیست محصولات
    const showSearchProducts = isLoggedIn && activeTab === 'product-list';

    const showSearchCustomers = isLoggedIn && activeTab === 'customer-management';

    return (
        <header className="header">
            <div className="header-container">
                <button className="hamburger-btn" onClick={toggleDrawer}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <h1 className="header-title">{getPageTitle()}</h1>

                <table className='time'>
                    <tbody className='boxis__timing'>
                        <tr><td className='timing__view'>{jalaliDate}</td></tr>
                        <tr><td className='timing__view'>{timeText}</td></tr>
                    </tbody>
                </table>

                {showSearchProducts && (
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="جستجوی محصول..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <Button
                                variant="circle"
                                onClick={handleClearSearch}
                                style={{ marginRight: '5px' }}
                            >
                                x
                            </Button>
                        )}
                    </div>
                )}


                {showSearchCustomers && (
                    <div className="search-box" >
                        <Button
                            variant='circle'
                            className=""
                            onClick={onAddCustomerClick}
                        ><span className='menu-icon'>{<UserPlus size={15} />}</span>
                        </Button>

                        <input
                            type="text"
                            placeholder="جستجوی مشتری..."
                            value={customerSearchValue}
                            onChange={(e) => onCustomerSearchChange?.(e.target.value)}
                            className="search-input"
                        />

                        {customerSearchValue && (
                            <Button
                                variant="circle"
                                onClick={() => onCustomerSearchChange("")}
                                style={{ marginRight: '5px' }}
                            >
                                x
                            </Button>
                        )}


                    </div>
                )}

            </div>
        </header>
    );
}
