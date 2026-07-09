import { useState } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { X, LogOutIcon, LockKeyholeOpen, ShoppingCart } from 'lucide-react';
import './Drawer.css';

export default function Drawer({
    isOpen,
    onOpenDrawer,
    onClose,
    onMenuClick,
    activeTab,
    isLoggedIn,
    onLogout,
    onLogin,
    categories,
    selectedMainCategory,
    setSelectedMainCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    availableSubCategories,
    children,
    onSelectMainCategory,
    onSelectSubCategory,
    onResetCategoryFilter,
    onOpenCart,
    cartLinesCount,
    isAuthenticated
}) {


    const [searchTerm, setSearchTerm] = useState('');

    const [openSubmenu, setOpenSubmenu] = useState(null);

    const [openThirdLevel, setOpenThirdLevel] = useState(null);

    const toggleSubmenu = (menu) => {
        setOpenSubmenu(prev => prev === menu ? null : menu);
    };

    const handleItemClick = (tabName) => {
        onMenuClick(tabName);
        setOpenSubmenu(null);
    };

    return (
        <>
            <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>

            <div className={`drawer ${isOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h2>پنل مدیریت</h2>
                    <Button variant='primary' icon={<X size={14} />} onClick={onClose} />
                </div>

                {isAuthenticated ? (
                    <nav className="drawer-menu">

                        {/* لیست محصولات */}
                        <div className="menu-section">
                            <Button
                                variant="primary"
                                className={`menu-item ${openSubmenu === 'category' ? 'open' : ''}`}
                                onClick={() => {
                                    onResetCategoryFilter();
                                    handleItemClick('product-list');
                                    onClose?.();
                                }}
                            >
                                <span className="menu-icon">📦</span>
                                <span className="menu-text">لیست محصولات</span>
                            </Button>

                            <Button
                                variant="primary"
                                className={`menu-item ${openSubmenu === 'category' ? 'open' : ''}`}
                                onClick={() => {
                                    toggleSubmenu('category');
                                    onResetCategoryFilter();
                                }}
                            >
                                <span className="menu-icon">📦</span>
                                <span className="menu-text">دسته بندی محصولات</span>
                                <span className={`arrow ${openSubmenu === 'category' ? 'rotated' : ''}`}>◀</span>
                            </Button>



                            {openSubmenu === 'category' && (
                                <div className="menu-section">
                                    <div className="submenu open">
                                        {categories.map((item) => {
                                            const isActiveMain = selectedMainCategory === item.title;
                                            const isThirdOpen = openThirdLevel === item.title;

                                            return (
                                                <div key={item.title} className="submenu-group">
                                                    {/* =================== First Button ================= */}
                                                    <Button
                                                        className={`submenu-item ${isActiveMain ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setSelectedMainCategory(item.title);
                                                            setSelectedSubCategory('همه');
                                                            setOpenThirdLevel(null);
                                                            onSelectMainCategory(item.title);
                                                        }}
                                                    >
                                                        <span>{item.title} ({item.count})</span>

                                                        <span className={`arrow ${isActiveMain ? 'rotated' : ''}`}>
                                                            ◁
                                                        </span>
                                                    </Button>

                                                    {isActiveMain && (
                                                        <div className="drawer__tabs">
                                                            {availableSubCategories.map((subItem) => {
                                                                const isActiveSub = selectedSubCategory === subItem.title;
                                                                const isThirdLevelOpen = openThirdLevel === subItem.title;

                                                                return (
                                                                    <div key={subItem.key} className="submenu-group">
                                                                        <Button
                                                                            className={
                                                                                isActiveSub
                                                                                    ? "submenu-item active"
                                                                                    : "submenu-item drawer__button--sub--deactive"
                                                                            }
                                                                            onClick={() => {
                                                                                onSelectSubCategory(subItem.title);
                                                                                setOpenThirdLevel(prev => (prev === subItem.title ? null : subItem.title));
                                                                                handleItemClick('categories');
                                                                                onClose?.();
                                                                            }}
                                                                        >
                                                                            <span>{subItem.title} ({subItem.count})</span>

                                                                            {subItem.children?.length > 0 && (
                                                                                <span className={`arrow ${isThirdLevelOpen ? 'rotated' : ''}`}>
                                                                                    ◁
                                                                                </span>
                                                                            )}
                                                                        </Button>

                                                                        {isThirdLevelOpen && (
                                                                            <div className="drawer__third-level">
                                                                                {subItem.children?.map((child) => (
                                                                                    <Button
                                                                                        key={child.key}
                                                                                        className="drawer__button--child"
                                                                                        onClick={() => {
                                                                                            onSelectMainCategory(item.title);
                                                                                            onClose?.();
                                                                                        }}
                                                                                    >
                                                                                        {child.title} ({child.count})
                                                                                    </Button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}


                        </div>                        {/* سفارشات */}
                        <div className="menu-section">
                            <Button
                                className={`menu-item ${openSubmenu === 'orders' ? 'active' : ''}`}
                                onClick={() => toggleSubmenu('orders')}
                            >
                                <span className="menu-icon">📦</span>
                                <span className="menu-text">مدیریت سفارشات</span>
                                <span className={`arrow ${openSubmenu === 'orders' ? 'rotated' : ''}`}>◀</span>
                            </Button>

                            <div className={`submenu ${openSubmenu === 'orders' ? 'open' : ''}`}>
                                {/* سبد خرید */}
                                <Button
                                    variant="primary"
                                    className={`menu-item ${activeTab === 'shopping-cart' ? 'active' : ''}`}
                                    onClick={() => handleItemClick('shopping-cart')}
                                >
                                    {/* <span className="menu-icon">🛒</span> */}
                                    <span className="menu-icon">{<ShoppingCart size={18} />}</span>
                                    <span className="menu-text">سبد خرید فعال</span>
                                    {cartLinesCount > 0 && (
                                        <Badge variant="success" size="small">
                                            {cartLinesCount}
                                        </Badge>
                                    )}
                                </Button>
                                <Button
                                    className={`submenu-item ${activeTab === 'success-orders' ? 'active' : ''}`}
                                    onClick={() => handleItemClick('success-orders')}
                                >
                                    <span className="submenu-icon">✅</span>
                                    سفارشات موفق
                                </Button>
                                <Button
                                    className={`submenu-item ${activeTab === 'pending-orders' ? 'active' : ''}`}
                                    onClick={() => handleItemClick('pending-orders')}
                                >
                                    <span className="submenu-icon">⏳</span>
                                    در صف انتظار
                                </Button>
                                <Button
                                    className={`submenu-item ${activeTab === 'failed-orders' ? 'active' : ''}`}
                                    onClick={() => handleItemClick('failed-orders')}
                                >
                                    <span className="submenu-icon">❌</span>
                                    سفارشات شکست خورده
                                </Button>
                            </div>
                        </div>

                        {/* مدیریت مشتریان */}
                        <Button
                            variant="primary"
                            className={`menu-item ${activeTab === 'customer-management' ? 'active' : ''}`}
                            onClick={() => handleItemClick('customer-management')} 
                        >
                            <span className="menu-icon">👥</span>
                            <span className="menu-text">مدیریت مشتریان</span>
                        </Button>

                        {/* برچسب محصول */}
                        <Button
                            className={`menu-item ${activeTab === 'product-label' ? 'active' : ''}`}
                            onClick={() => handleItemClick('product-label')}
                        >
                            <span className="menu-icon">🏷️</span>
                            <span className="menu-text">برچسب محصولات</span>
                        </Button>

                        <div className="drawer-divider"></div>

                        {/* خروج */}
                        <Button
                            variant="primary"
                            className="menu-item"
                            onClick={onLogout}
                        >
                            <span
                                className='menu-icon'
                            >
                                {<LogOutIcon size={18} />}
                            </span>
                            <span
                                className='menu-text'
                            >
                                خروج
                            </span>
                        </Button>
                    </nav>
                ) : (
                    <div className="drawer-login-message">
                            <Button
                                variant="primary"
                                className={`menu-item ${openSubmenu === 'category' ? 'open' : ''}`}
                                onClick={() => {
                                    onResetCategoryFilter();
                                    handleItemClick('product-list');
                                    onClose?.();
                                }}
                            >
                                <span className="menu-icon">📦</span>
                                <span className="menu-text">لیست محصولات</span>
                            </Button>
                            
                        <h3><LockKeyholeOpen size={26} /></h3>
                        <p>لطفا وارد سیستم شوید</p>
                            <Button
                                variant="primary"
                                onClick={onLogin}>
                                <span
                                    className='menu-icon'
                                >
                                    {<LogOutIcon size={18} />}
                                </span>
                                <span>
                                    ورود
                                </span>
                            </Button>
                    </div>
                )}

                <div className="drawer-footer">
                    <p>نسخه 1.0.0</p>
                </div>
            </div>
        </>
    );
}
