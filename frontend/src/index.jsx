// ============================================================================
// File: src/index.jsx
// Description:
//   نقطه شروع (Entry Point) اپلیکیشن React.
//
// وظایف این فایل:
//   1- وارد کردن React و ReactDOM
//   2- وارد کردن کامپوننت اصلی App
//   3- Mount کردن اپلیکیشن داخل div#root در index.html
//
// Notes:
//   - از React 18 API استفاده می‌کنیم (createRoot)
//   - هیچ منطق بیزینسی در این فایل قرار نمی‌گیرد
//   - فقط Bootstrap برنامه انجام می‌شود
// ============================================================================

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
