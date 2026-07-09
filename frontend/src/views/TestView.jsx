import React, { useState, useEffect, useMemo } from 'react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { ShoppingCart, Plus, Trash2, Check, CalendarArrowUp, LogOutIcon, UserPlus, UserPlus2 } from 'lucide-react';
import { formatPrice, calculatePrice } from '../utils/price';
import { validateMobile, validateNationalCode } from '../utils/validation';
import './TestView.css';

const TestView = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalSize, setModalSize] = useState('medium');


    // تست محاسبات قیمت
    const sampleProduct = {
        id: 1,
        name: 'نوشابه کوکاکولا',
        price: 5000,
        unitsPerBox: 12,
        boxesPerCarton: 6,
        discount: 10
    };

    const priceTest = calculatePrice(sampleProduct, 2, 'carton');
    const [now, setNow] = useState(new Date());
    /* =========================================
       ORDER PAGE / CLOCK EFFECT
       -----------------------------------------
       بروزرسانی زمان بالای صفحه
    ========================================= */
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

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);



    return (
        <div className="test-container">
            <h1 className="test-title">🧪 تست کامپوننت‌ها و توابع</h1>

            {/* تست دکمه‌ها */}
            <section className="test-section">
                <h2>دکمه‌ها (Buttons)</h2>
                <div className="test-grid">
                    <Button variant="primary">دکمه اصلی</Button>
                    <Button variant="success">دکمه موفقیت</Button>
                    <Button variant="danger">دکمه خطر</Button>
                    <Button variant="secondary">دکمه ثانویه</Button>
                    <Button variant="outline">دکمه خطی</Button>
                    <Button variant="ghost">دکمه شبح</Button>
                    <Button variant="circle">دکمه گرد</Button>
                    <Button variant="primary" disabled>غیرفعال</Button>
                    <Button variant="primary" loading>در حال بارگذاری</Button>
                </div>

                <h3>سایزها</h3>
                <div className="test-grid">
                    <Button size="small">کوچک</Button>
                    <Button size="medium">متوسط</Button>
                    <Button size="large">بزرگ</Button>
                </div>

                <h3>با آیکون</h3>
                <div className="test-grid">
                    <Button icon={<Plus size={18} />}>افزودن</Button>
                    <Button variant="success"><span className='menu-icon'>{<Check size={18} />}</span><span className='menu-text'>تایید</span></Button>
                    <Button variant="danger"><span className='menu-icon'>{<Trash2 size={18} />}</span><span className='menu-text'>حذف</span></Button>
                    <Button variant="primary"><span className='menu-icon'>{<ShoppingCart size={18} />}</span><span className='menu-text'>سبد خرید</span></Button>
                    <Button variant="primary"><span className='menu-icon'>{<CalendarArrowUp size={18} />}</span><span className='menu-text'>ثبت سفارش</span></Button>
                    <Button variant="primary"><span className='menu-icon'>{<LogOutIcon size={18} />}</span><span className='menu-text'>خروج</span></Button>
                    <Button variant="primary"><span className='menu-icon'>{<CalendarArrowUp size={18} />}</span><span className='menu-text'>ورود</span></Button>
                    <Button variant="primary"><span className='menu-icon'>{<UserPlus size={18} />}</span><span className='menu-text'>مشتری جدید</span></Button>
                </div>
            </section>

            {/* تست Badge */}
            <section className="test-section">
                <h2>نشان‌ها (Badges)</h2>
                <div className="test-grid">
                    <Badge>پیش‌فرض</Badge>
                    <Badge variant="success">موجود</Badge>
                    <Badge variant="warning">در حال تولید</Badge>
                    <Badge variant="danger">ناموجود</Badge>
                    <Badge variant="info">اطلاعات</Badge>
                    <Badge variant="primary">اصلی</Badge>
                </div>

                <h3>سایزها</h3>
                <div className="test-grid">
                    <Badge size="small" variant="success">کوچک</Badge>
                    <Badge size="medium" variant="warning">متوسط</Badge>
                    <Badge size="large" variant="danger">بزرگ</Badge>
                </div>
            </section>

            {/* تست Modal */}
            <section className="test-section">
                <h2>مودال (Modal)</h2>
                <div className="test-grid">
                    <Button onClick={() => { setModalSize('small'); setIsModalOpen(true) }}>
                        مودال کوچک
                    </Button>
                    <Button onClick={() => { setModalSize('medium'); setIsModalOpen(true) }}>
                        مودال متوسط
                    </Button>
                    <Button onClick={() => { setModalSize('large'); setIsModalOpen(true) }}>
                        مودال بزرگ
                    </Button>
                    <Button onClick={() => { setModalSize('full'); setIsModalOpen(true) }}>
                        مودال تمام‌صفحه
                    </Button>
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="عنوان نمونه مودال"
                    size={modalSize}
                >
                    <p>این یک مودال تست است. می‌توانید با کلیک روی پس‌زمینه یا دکمه X آن را ببندید.</p>
                    <p>همچنین می‌توانید با فشردن کلید ESC مودال را ببندید.</p>

                    <div style={{ marginTop: '1.5rem' }}>
                        <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                            بستن مودال
                        </Button>
                    </div>
                </Modal>
            </section>

            {/* تست فرمت قیمت */}
            <section className="test-section">
                <h2>محاسبات قیمت</h2>
                <div className="test-box">
                    <p><strong>محصول:</strong> {sampleProduct.name}</p>
                    <p><strong>قیمت پایه:</strong> {formatPrice(sampleProduct.price)} تومان</p>
                    <p><strong>تعداد:</strong> 2 کارتن</p>
                    <p><strong>تخفیف:</strong> {sampleProduct.discount}%</p>
                    <hr />
                    <p><strong>قیمت واحد:</strong> {formatPrice(priceTest.unitPrice)} تومان</p>
                    <p><strong>جمع قبل از تخفیف:</strong> {formatPrice(priceTest.totalBeforeDiscount)} تومان</p>
                    <p><strong>مبلغ تخفیف:</strong> {formatPrice(priceTest.discountAmount)} تومان</p>
                    <p style={{ fontSize: '1.25rem', color: '#10b981' }}>
                        <strong>قیمت نهایی:</strong> {formatPrice(priceTest.finalPrice)} تومان
                    </p>
                </div>
            </section>

            {/* تست تاریخ */}
            <section className="test-section">
                <h2>تاریخ شمسی</h2>
                <div className="test-box">
                    <p><strong></strong> </p>
                    <p><strong></strong> </p>
                    <table className='time'>
                        <tbody className='boxis__timing'>
                            <tr><td className='timing__view'>{jalaliDate}</td></tr>
                            <tr><td className='timing__view'>{timeText}</td></tr>

                        </tbody>
                    </table>
                </div>
            </section>

            {/* تست اعتبارسنجی */}
            <section className="test-section">
                <h2>اعتبارسنجی</h2>
                <div className="test-box">
                    <ValidationTest />
                </div>
            </section>
        </div>
    )
}

// کامپوننت تست اعتبارسنجی
const ValidationTest = () => {
    const [mobile, setMobile] = useState('09123456789');
    const [nationalCode, setNationalCode] = useState('0123456789');
    const isMobileValid = validateMobile(mobile);
    const isNationalCodeValid = validateNationalCode(nationalCode);

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    شماره موبایل:
                </label>
                <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    style={{
                        padding: '0.5rem',
                        border: `2px solid ${isMobileValid ? '#10b981' : '#ef4444'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        width: '200px'
                    }}
                />
                <Badge variant={isMobileValid ? 'success' : 'danger'} style={{ marginRight: '0.5rem' }}>
                    {isMobileValid ? '✓ معتبر' : '✗ نامعتبر'}
                </Badge>
            </div>

            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    کد ملی:
                </label>
                <input
                    type="text"
                    value={nationalCode}
                    onChange={(e) => setNationalCode(e.target.value)}
                    style={{
                        padding: '0.5rem',
                        border: `2px solid ${isNationalCodeValid ? '#10b981' : '#ef4444'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        width: '200px'
                    }}
                />
                <Badge variant={isNationalCodeValid ? 'success' : 'danger'} style={{ marginRight: '0.5rem' }}>
                    {isNationalCodeValid ? '✓ معتبر' : '✗ نامعتبر'}
                </Badge>
            </div>
        </div>
    )
}

export default TestView;
