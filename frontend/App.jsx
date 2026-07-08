import React, { useEffect, useState, useMemo } from 'react';

/* =========================================================================
   1. کامپوننت‌های پروژه (Components & UI)
   ========================================================================= */
import Header from './components/header/Header';
import Drawer from './components/drawer/Drawer';
import ProductList from './components/ProductList/ProductList';
import CustomerManagment from './components/CustomerManagement';
import ShoppingCart from './components/ShoppingCart';
import FloatingBar from './components/footer/FloatingBar';
import AuthModal from './components/modal/AuthModal';
import CustomerRegistration from './components/modal/CustomerRegistration';
import CartModal from './components/cart/cartModal';

/* ===== المان‌های مشترک UI ===== */
import Button from './components/ui/Button';
import Modal from './components/ui/Modal';
import WelcomeToast from './components/ui/WelcomeToast';
import { Key, LockKeyholeOpen, X, UserRound } from 'lucide-react';

/* =========================================================================
   2. سرویس‌ها و هوک‌های کمکی (Services, Hooks & Utils)
   ========================================================================= */
import { fetchCustomers } from './services/customers';
import { fetchExperts } from './services/expertService';
import { useAuthExpert } from './hooks/useAuthExpert';

/* 
   ⚠️ ابهام واردات (Import Check):
   کد زیر ایمپورت شده اما پایین‌تر از متد درون هوک useAuthExpert استفاده شده است.
   همچنین ته آن به ; ختم نشده بود.
   هرگز نباید هم‌نام با متغیرهای هوک، کامپوننت یا متد خارجی ایمپورت کنیم.
*/
import loginAsGuest from './hooks/guestExpert';

import { getCartItems, getCartTotals } from "./utils/cartSelectors";
import { buildOrderPayload } from './utils/buildOrderPayload';
import { normalizeText } from './utils/text';
import { saveOrderCart } from "./utils/cartStorage";
import { fmt } from "./utils/number";

import "./App.css";

/* ===============    09155714585   مهدي عرب عامري (کامپيوتر نيکان - نمايندگي هلو)    ===============   */

/**
 * کامپوننت اصلی و ریشه اپلیکیشن (App Component)
 */
export default function App() {

  /* =========================================================================
     3. وضعیت‌های مربوط به سرچ و کالاها (Product & Search States)
     ========================================================================= */
  /* 
     ⚠️ مورد بررسی: searchTerm تعریف شده اما در سرچ هدر از productSearchValue استفاده می‌شود.
     بهتر است searchTerm حذف یا ادغام گردد.
     // نمونه بهتر: استفاده یکپارچه از productSearchValue
  */
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [productSearchValue, setProductSearchValue] = useState("");

  /* =========================================================================
     4. وضعیت‌های منو و ناوبری (Drawer & Navigation States)
     ========================================================================= */
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const [activeTab, setActiveTab] = useState('product-list');

  /* 
     ⚠️ تداخل وضعیت احراز هویت:
     این وضعیت (isLoggedIn) با وضعیت هوک (isAuthenticated) تداخل دارد. 
     بهتر است کاملاً حذف شده و مقدار isLoggedIn از isAuthenticated مشتق شود.
     // نمونه بهتر:
     // const isLoggedIn = isAuthenticated; // مستقیم از هوک خوانده شود.
  */
  // const [isLoggedIn, setIsLoggedIn] = useState();
  const isLoggedIn = isAuthenticated;

  /* =========================================================================
     5. وضعیت‌های مودال خوش‌آمدگویی و دسترسی اولیه (Initial Modal States)
     ========================================================================= */
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [modalSize, setModalSize] = useState('medium');

  /* =========================================================================
     6. وضعیت‌های دسته‌بندی کالاها (Category States)
     ========================================================================= */
  const [categories, setCategories] = useState([]);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState("همه");
  const [selectedSubCategory, setSelectedSubCategory] = useState("همه");
  const [openThirdLevel, setOpenThirdLevel] = useState(null);

  /* =========================================================================
     7. وضعیت‌های مدیریت مشتریان (Customer States)
     ========================================================================= */
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchValue, setCustomerSearchValue] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);


  const [openModal, setOpenModal] = useState(false);

  

  /* =========================================================================
     8. هوک احراز هویت کارشناسان (Authentication Hook)
     ========================================================================= */
  const {
    isAuthOpen,
    authStep,
    pendingExpert,
    authUsername,
    authPassword,
    acceptedTerms,
    authError,
    loadingAuth,
    confirmPassword,
    simpleCode,
    setAuthUsername,
    setAuthPassword,
    setAcceptedTerms,
    isAuthenticated,
    selectedExpert,
    showWelcome,
    setShowWelcome,
    setSimpleCode,
    setConfirmPassword,
    openAuth,
    closeAuth,
    lookupExpert,
    login,
    register,
    backToLookup,
    loginAsGuest,
    logout,
  } = useAuthExpert();

  /* =========================================================================
     9. اثرات جانبی و سنکرون‌سازی (Effects & Synchronizations)
     ========================================================================= */

  // مدیریت باز/بسته شدن مودال انتخاب نحوه ورود بر اساس وضعیت لاگین
  useEffect(() => {
    if (!isAuthenticated) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [isAuthenticated]);

  // ذخیره‌سازی وضعیت محصولات سبد خرید در LocalStorage
  useEffect(() => {
    if (!products?.length) return;
    saveOrderCart(products);
  }, [products]);

  /* =========================================================================
     10. مدیریت لاگین و مهمان (Login Handlers)
     ========================================================================= */

  const handleOpenLoginModal = () => {
    setIsModalOpen(false);
    openAuth();
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    setIsModalOpen(false);
  };

  /* =========================================================================
     11. مدیریت وضعیت مشتری انتخاب شده (Selected Customer State)
     ========================================================================= */
  const [selectedCustomer, setSelectedCustomer] = useState(() => {
    try {
      const savedCustomer = localStorage.getItem("selected_customer");
      return savedCustomer ? JSON.parse(savedCustomer) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (selectedCustomer) {
      localStorage.setItem("selected_customer", JSON.stringify(selectedCustomer));
    } else {
      localStorage.removeItem("selected_customer");
    }
  }, [selectedCustomer]);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleAddCustomerClick = () => {
    setShowAddCustomer(true);
  };

  /* =========================================================================
     12. محاسبات بهینه سبد خرید (Cart Memoized Selectors)
     ========================================================================= */
  const cartItems = useMemo(() => getCartItems(products), [products]);
  const totals = useMemo(() => getCartTotals(products), [products]);

  // شمارش تعداد ردیف‌های فعال سبد خرید
  const cartLinesCount = useMemo(() => {
    return products.filter(p =>
      (Number(p.qty?.carton) || 0) > 0 ||
      (Number(p.qty?.Basteh) || 0) > 0 ||
      (Number(p.qty?.single) || Number(p.qty?.tak) || 0) > 0
    ).length;
  }, [products]);

  // کل تعداد اقلام فیزیکی موجود در سبد خرید
  const totalItemsCount = useMemo(() => {
    return totals.totalCartonCount + totals.totalBastehCount + totals.totalTakCount;
  }, [totals]);

  const cartBadgeCount =
    totals.totalCartonCount +
    totals.totalBastehCount +
    totals.totalTakCount;

  /* =========================================================================
     13. هندلرهای عمومی سبد خرید و مشتریان (General Handlers)
     ========================================================================= */
  const handleCloseCart = () => {
    setActiveTab('product-list');
  };

  const onCustomerSearchChange = (value) => {
    setCustomerSearchValue(value);
  };

  const handleCustomerAdded = (newCustomer) => {
    setCustomers(prev => [newCustomer, ...prev]);
  };

  const handleProductsLoad = ({ products, categories }) => {
    setProducts(products);
    setCategories(categories);
  };

  /* =========================================================================
     14. مدیریت دسته‌بندی‌ها و ناوبری کاتالوگ (Category Filtering)
     ========================================================================= */
  const handleCategorySelect = (mainCategory, subCategory = "همه") => {
    setSelectedMainCategory(mainCategory);
    setSelectedSubCategory(subCategory);
    // setActiveTab("product-list");
  };

  const onSelectMainCategory = (categoryTitle) => {
    setSelectedMainCategory(categoryTitle);
    setSelectedSubCategory("همه");
    // setActiveTab("product-list");
  };

  const onSelectSubCategory = (subCategoryTitle) => {
    setSelectedSubCategory(subCategoryTitle);
    // setActiveTab("product-list");
    setIsDrawerOpen(false);
  };


  const onResetCategoryFilter = () => {
    setSelectedMainCategory("همه");
    setSelectedSubCategory("همه");
    // setActiveTab("categories");
    // setActiveTab("product-list");
  };

  const onOpenDrawer = () => {
    setIsDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  const onProductSearchChange = (value) => {
    setProductSearchValue(value);
  };

  const handleMenuClick = (tabName) => {
    setActiveTab(tabName);
    setIsDrawerOpen(false);
  };

  /* =========================================================================
     15. توابع خروج و ورود دمو (Auth Helpers)
     ========================================================================= */
  const handleLogout = () => {
    /* 
       ⚠️ هشدار: متد logout هوک useAuthExpert صدا زده نشده است!
       اگر کاربر لاگ اوت کند وضعیت isAuthenticated در هوک تغییر نخواهد کرد.
       // نمونه بهتر: 
       // logout();
    */
    logout();
    setActiveTab('product-list');
    setIsDrawerOpen(false);
  };

  const handleLogin = () => {
    // setIsLoggedIn(true);
    login();
  };

  /* =========================================================================
     16. تغییرات تعداد و اقلام سبد خرید (Cart Quantity Handlers)
     ========================================================================= */
  const handleClearCart = () => {
    setProducts(products.map(p => ({
      ...p,
      qty: 0
    })));
  };

  function handleRemoveItem(id) {
    setProducts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, qty: { carton: 0, Basteh: 0, tak: 0 }, total: 0 }
          : p
      )
    );
  }

  const handleQtyChange = (id, type, delta) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;

        const normalizedType = type === "tak" ? "single" : type;
        const current = p.qty?.[normalizedType] || 0;
        const next = Math.max(0, current + delta);

        return {
          ...p,
          qty: {
            ...p.qty,
            [normalizedType]: next,
            ...(normalizedType === "single" && { tak: next })
          }
        };
      })
    );
  };

  /* =========================================================================
     17. فیلتر کردن مشتریان بر اساس سرچ (Customer Filter Memo)
     ========================================================================= */
  const filteredCustomers = useMemo(() => {
    const search = normalizeText(customerSearchValue);

    return customers
      .filter((customer) => {
        const name = normalizeText(customer?.name);
        const code = normalizeText(customer?.code);
        const id = normalizeText(customer?.id);
        const mobile = normalizeText(customer?.mobile);
        const erpcode = normalizeText(customer?.erpcode);

        return (
          name.includes(search) ||
          code.includes(search) ||
          id.includes(search) ||
          mobile.includes(search) ||
          erpcode.includes(search)
        );
      })
      .map((customer) => ({
        value: customer,
        label: `${customer?.name || "بدون نام"} (${customer?.id || "---"}) ${customer?.erpcode} ${customer?.mobile}`,
      }));
  }, [customers, customerSearchValue]);

  // لود اولیه مشتریان با قابلیت fallback در صورت بروز خطا
  useEffect(() => {
    let alive = true;

    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await fetchCustomers();
        if (!alive) return;
        setCustomers(Array.isArray(res) ? res : []);
      } catch (e) {
        if (!alive) return;
        /* 
           ⚠️ باگ بالقوه: متغیر res در بلوک catch تعریف نشده است و خطا خواهد داد!
           باید داده‌ی پیش‌فرض یا متغیر خطا بررسی شود.
           // نمونه بهتر: 
           // const fallbackMapped = [];
        */
        const fallbackMapped = Array.isArray(res)
          ? res.map((item, index) =>
            mapCustomerToViewModel(item, index)
          )
          : [];

        setCustomers(fallbackMapped);
      } finally {
        if (!alive) return;
        setLoadingCustomers(false);
      }
    };

    loadCustomers();

    return () => {
      alive = false;
    };
  }, []);

  /* =========================================================================
     18. فیلتر کردن محصولات کاتالوگ (Product Filter Memo)
     ========================================================================= */
  const filteredProducts = useMemo(() => {
    let result = Array.isArray(products) ? products : [];

    if (selectedMainCategory !== "همه") {
      result = result.filter(
        item => String(item?.category || "").trim() === selectedMainCategory
      );
    }

    if (selectedSubCategory !== "همه") {
      result = result.filter(
        item => String(item?.subCategory || "").trim() === selectedSubCategory
      );
    }

    const q = normalizeText(productSearchValue);

    if (q) {
      result = result.filter(item => {
        const fields = [
          item?.name,
          item?.code,
          item?.material,
          item?.place,
          item?.category,
          item?.subCategory
        ];

        return fields.some(field =>
          normalizeText(field).includes(q)
        );
      });
    }

    return result;
  }, [
    products,
    selectedMainCategory,
    selectedSubCategory,
    productSearchValue,
  ]);

  /* =========================================================================
     19. ارسال نهایی سفارش به سرور (Order Submitting Handlers)
     ========================================================================= */
  /* 
     ⚠️ متغیرهای تعریف نشده: 
     متغیرهای isSubmitting, orderDescription, currentUser, discountpercent, discountprice, submitOrder, onCloseSubmit 
     در این کامپوننت تعریف نشده‌اند. باید بررسی شود که از هوک یا پراپ خاصی خوانده شوند یا خیر.
     // نمونه بهتر: تعریف state برای مقادیر فوق یا انتقال تابع ثبت سفارش به CartModal.
  */
  const onConfirmSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (isSubmitting) return; // ⚠️ isSubmitting تعریف نشده است.

    try {
      const payload = buildOrderPayload({
        selectedCustomer,
        cartItems,
        orderDescription, // ⚠️ تعریف نشده است.
        discountpercent,  // ⚠️ تعریف نشده است.
        discountprice     // ⚠️ تعریف نشده است.
      });

      const result = await submitOrder(payload); // ⚠️ submitOrder تعریف نشده است.

      if (result?.type === "success") {
        handleClearCart();
        setSelectedCustomer?.(null);
        onCloseSubmit(); // ⚠️ تعریف نشده است.
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  // استخراج زیر دسته‌ها بر اساس دسته اصلی انتخاب شده
  const availableSubCategories = useMemo(() => {
    const mainCategory = categories.find(
      (item) => item.title === selectedMainCategory
    );
    return mainCategory?.children || [];
  }, [categories, selectedMainCategory]);



  /* =========================================================================
     21. رندر کردن محتوا بر اساس وضعیت احراز هویت و تب فعال (Conditional Tab Renderer)
     ========================================================================= */
  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <>
          <div className="login-container">
            <Modal
              isOpen={isModalOpen}
              // onClose={() => { }}
              title={<LockKeyholeOpen size={26} />}
              size={modalSize}
            >
              <div className="login-box">
                <h2>ورود به پنل مدیریت</h2>
                <p>برای دسترسی به سیستم، وارد شوید یا به‌صورت مهمان ادامه دهید</p>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "1rem",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="outline"
                    onClick={handleOpenLoginModal}
                    icon={<Key size={18} />}
                  >
                    ورود
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      handleGuestLogin();
                    }}
                    icon={<UserRound size={18} />}
                  >
                    ورود به‌عنوان مهمان
                  </Button>
                </div>
              </div>
            </Modal>
          </div>


          <AuthModal
            isOpen={isAuthOpen}
            onClose={closeAuth}
            authStep={authStep}
            pendingExpert={pendingExpert}
            username={authUsername}
            password={authPassword}
            onUsernameChange={setAuthUsername}
            onPasswordChange={setAuthPassword}
            acceptedTerms={acceptedTerms}
            onAcceptedTermsChange={setAcceptedTerms}
            loading={loadingAuth}
            error={authError}
            onLookup={lookupExpert}
            onLogin={login}
            onRegister={register}
            onBackToLookup={backToLookup}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            simpleCode={simpleCode}
            onSimpleCodeChange={setSimpleCode}
          />

        </>
      );
    }

    switch (activeTab) {
      case 'product-list':
        return (
          <ProductList
            products={filteredProducts}
            onQtyChange={handleQtyChange}
            searchTerm={searchTerm}
            onProductsLoad={handleProductsLoad}
          />
        );
      case 'categories':
        return (
          <ProductList
            products={filteredProducts}
            onQtyChange={handleQtyChange}
            searchTerm={searchTerm}
            onProductsLoad={handleProductsLoad}
          />
        );
      case 'product-label':
        return <ShoppingCart />;
      case 'customer-management':
        return (
          <CustomerManagment
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={handleSelectCustomer}
            loadingCustomers={loadingCustomers}
            customerSearchValue={customerSearchValue}
            setCustomerSearchValue={setCustomerSearchValue}
            filteredCustomers={filteredCustomers}
            showAddCustomer={showAddCustomer}
            setShowAddCustomer={setShowAddCustomer}
            authUser={selectedExpert}
          />
        );
      case 'shopping-cart':
        return (
          <CartModal
            items={cartItems}
            totals={totals}
            onClose={handleCloseCart}
            handleQtyChange={handleQtyChange}
            handleRemoveItem={handleRemoveItem}
            handleClearCart={handleClearCart}
            selectedCustomer={selectedCustomer}
            cartLinesCount={cartLinesCount}
            authUser={selectedExpert}
            comment={orderDescription}
            onCommentChange={setOrderDescription}
          />
        );
      default:
        return <ProductList />;
    }
  }

  /* =========================================================================
     22. ساختار درختی خروجی نهایی (DOM Structure)
     ========================================================================= */
  return (
    <div className="app" dir="rtl">
      <Header
        toggleDrawer={toggleDrawer}
        isLoggedIn={isAuthenticated}
        activeTab={activeTab}
        searchTerm={productSearchValue}
        onSearchChange={setProductSearchValue}
        showSearchCustomers={activeTab === "customers"}
        customerSearchValue={customerSearchValue}
        onCustomerSearchChange={onCustomerSearchChange}
        onAddCustomerClick={handleAddCustomerClick}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onMenuClick={handleMenuClick}
        activeTab={activeTab}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onOpenDrawer={onOpenDrawer}
        onClose={onCloseDrawer}
        categories={categories}
        selectedMainCategory={selectedMainCategory}
        setSelectedMainCategory={setSelectedMainCategory}
        selectedSubCategory={selectedSubCategory}
        setSelectedSubCategory={setSelectedSubCategory}
        availableSubCategories={availableSubCategories}
        onSelectMainCategory={onSelectMainCategory}
        onSelectSubCategory={onSelectSubCategory}
        onResetCategoryFilter={onResetCategoryFilter}
        handleItemClick={handleMenuClick}
        cartBadgeCount={cartBadgeCount}
        cartLinesCount={cartLinesCount}
        authUser={selectedExpert}
      />

      <main className="dashboard-content">
        {renderContent()}
      </main>

      <FloatingBar
        onMenuClick={handleMenuClick}
        totalPrice={totals.totalPrice}
        totalKartonCount={totals.totalCartonCount}
        totalBastehCount={totals.totalBastehCount}
        totalTakCount={totals.totalTakCount}
        onOpenCart={() => setActiveTab('shopping-cart')}
        cartLinesCount={cartLinesCount}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
        authUser={selectedExpert}
      />

      <CustomerRegistration
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onCustomerAdded={handleCustomerAdded}
      />

      {showWelcome && (
        <WelcomeToast
          name={selectedExpert?.name || "دوست عزیز"}
          onClose={() => setShowWelcome(false)}
        />
      )}
    </div>
  );
}
