import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { createCustomer } from '../../services/customers';
import "./CustomerRegistration.css";

export default function CustomerRegistration({ isOpen, onClose, onCustomerAdded }) {
  const initialForm = { name: '', isVaseteh: false, isseller: false, ispurchaser: false, mobile: '', ostan: '', city: '', address: '' };
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);


    const payload = {
      id: String(Date.now()).slice(-5),
      name: formData.name,
      mobile: formData.mobile,
      ostan: formData.ostan,
      city: formData.city,
      address: formData.address,

      cityCode: formData.cityCode,
      isvaseteh: formData.cityCode === 13,
      ispurchaser: formData.cityCode === 14 || formData.cityCode === 15,
      isseller: false,

      custtype: 0,
    };

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/Customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();

      console.log('HTTP Status:', response.status);
      console.log('Raw Server Response:', rawText);

      let data = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        console.error('Response is not valid JSON:', rawText);
        alert('پاسخ سرور JSON معتبر نیست.');
        return;
      }

      console.log('Parsed Server Response:', data);

      if (!response.ok) {
        console.error('Server HTTP Error:', data);
        alert((data && (data.message || data.error)) || 'خطای سرور در ثبت مشتری');
        return;
      }

      let holooResponse = data;

      try {
        if (data && data.body && typeof data.body === 'string') {
          holooResponse = JSON.parse(data.body);
        } else if (data && data.data && data.data.body && typeof data.data.body === 'string') {
          holooResponse = JSON.parse(data.data.body);
        } else if (
          data &&
          data.holoo_response &&
          data.holoo_response.body &&
          typeof data.holoo_response.body === 'string'
        ) {
          holooResponse = JSON.parse(data.holoo_response.body);
        } else if (
          data &&
          data.holooResponse &&
          data.holooResponse.body &&
          typeof data.holooResponse.body === 'string'
        ) {
          holooResponse = JSON.parse(data.holooResponse.body);
        }
      } catch {
        console.error('Holoo body is not valid JSON:', data);
        alert('پاسخ هلو JSON معتبر نیست.');
        return;
      }

      console.log('Parsed Holoo Response:', holooResponse);

      const successPayload =
        (holooResponse && (holooResponse.Success || holooResponse.success)) ||
        (data && (data.Success || data.success || data.customer)) ||
        null;

      const isSuccess =
        Boolean(successPayload) ||
        (data && (data.status === 'success' || data.status === 'ok' || data.cached === true));

      if (isSuccess) {
        const createdCustomer = {
          ...payload,
          code:
            (successPayload && (successPayload.Code || successPayload.code)) ||
            payload.code ||
            payload.id,
          erpCode:
            (successPayload && (successPayload.ErpCode || successPayload.erpCode)) ||
            payload.erpCode ||
            '',
          holooId:
            (successPayload && (successPayload.Id || successPayload.id)) ||
            '',
          bedSarfasl:
            (successPayload && (successPayload.BedSarfasl || successPayload.bedSarfasl)) ||
            '',
        };

        onCustomerAdded(createdCustomer);
        onClose();
        setFormData(initialForm);

        alert('مشتری با موفقیت ثبت شد.');
        return;
      }

      console.error('Server Business Error:', {
        data,
        holooResponse,
      });

      alert(
        (holooResponse && (holooResponse.Message || holooResponse.message)) ||
        (data && (data.message || data.error)) ||
        'خطا در ثبت مشتری'
      );
    } catch (error) {
      console.error('Network/Fetch Error:', error);
      alert('ارتباط با سرور برقرار نشد!');
    } finally {
      setIsSubmitting(false);
    }
  }


    return (
      <Modal isOpen={isOpen} onClose={onClose} title="ثبت مشتری جدید" size="medium">
        <form onSubmit={handleSubmit} className="cr-form">

          <div className="cr-group">
            <label>نام و نام خانوادگی</label>
            <input className="cr-input" required type="text" name="name" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>



          <div className="cr-group">
            <label>شماره موبایل</label>
            <input className="cr-input" type="tel" required value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
          </div>



          <div className="cr-group">
            <label>نوع عضویت</label>
            <div className="cr-radio-box" >
              <label><input type="radio" checked={formData.isVaseteh} onChange={() => setFormData({ ...formData, isVaseteh: true, cityCode: 13 })} /> کارشناس فروش</label>

              <label>
                <input type="radio" checked={formData.isVaseteh === false && formData.cityCode === 14} onChange={() => setFormData({ ...formData, cityCode: 14, isVaseteh: false })} />
                مشتری عمده
              </label>
              <label>
                <input type="radio" checked={formData.isVaseteh === false && formData.cityCode === 15} onChange={() => setFormData({ ...formData, cityCode: 15, isVaseteh: false })} />
                مشتری فروشگاهی
              </label>
            </div>
          </div>



          <div className="cr-row">
            <div className="cr-group"><label>استان</label><input className="cr-input" type="text" name="ostan" value={formData.ostan} onChange={(e) => setFormData({ ...formData, ostan: e.target.value })} placeholder="تهران" /></div>



            <div className="cr-group"><label>شهر</label><input className="cr-input" type="text" name="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="تهران" /></div>
          </div>


          <div className="cr-group">
            <label>آدرس</label>
            <textarea className="cr-input" name="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows="3" placeholder="آدرس کامل..." />
          </div>



          <div className="cr-actions" >
            <Button variant="secondary" onClick={onClose}>انصراف</Button>
            <Button type="submit" variant="primary" icon={<UserPlus size={18} />} disabled={isSubmitting}>
              {isSubmitting ? 'در حال ثبت...' : 'ثبت مشتری'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

