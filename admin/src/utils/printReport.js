/**
 * printReport.js
 * Professional Restaurant Report Printing Engine
 * Supports filtered order views, high-resolution branding, color headers,
 * status badges, and comprehensive financial summaries.
 * STRICTLY VERTICAL (PORTRAIT A4) ORIENTATION.
 */

export const printOrdersReport = ({
  orders = [],
  filterMeta = {},
  adminUser = null,
  isKm = true
}) => {
  const now = new Date();
  const printDateStr = now.toLocaleDateString(isKm ? 'km-KH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const printTimeStr = now.toLocaleTimeString(isKm ? 'km-KH' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const adminName = adminUser?.name || adminUser?.username || (isKm ? 'អ្នកគ្រប់គ្រង' : 'Administrator');

  // Summary Metrics
  const totalCount = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.order_status === 'completed');
  const pendingOrders = orders.filter((o) => ['pending', 'confirmed', 'preparing', 'delivering'].includes(o.status || o.order_status));
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled' || o.order_status === 'cancelled');

  const totalUSD = orders.reduce((sum, o) => sum + (Number(o.total_usd || o.total) || 0), 0);
  const totalKHR = orders.reduce((sum, o) => {
    if (o.total_khr) return sum + Number(o.total_khr);
    return sum + (Number(o.total_usd || o.total || 0) * 4100);
  }, 0);

  // Status Badge Colors & Labels
  const getStatusBadge = (status) => {
    const s = String(status || 'pending').toLowerCase();
    switch (s) {
      case 'completed':
        return {
          bg: '#dcfce7',
          color: '#15803d',
          border: '#86efac',
          label: isKm ? 'បានបញ្ចប់' : 'Completed'
        };
      case 'confirmed':
      case 'preparing':
        return {
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fde68a',
          label: isKm ? 'កំពុងរៀបចំ' : 'Preparing'
        };
      case 'delivering':
        return {
          bg: '#e0f2fe',
          color: '#0369a1',
          border: '#bae6fd',
          label: isKm ? 'កំពុងដឹក' : 'Delivering'
        };
      case 'cancelled':
        return {
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fca5a5',
          label: isKm ? 'បានបោះបង់' : 'Cancelled'
        };
      default:
        return {
          bg: '#fef9c3',
          color: '#a16207',
          border: '#fef08a',
          label: isKm ? 'រង់ចាំពិនិត្យ' : 'Pending'
        };
    }
  };

  // Filter description string
  const activeFilters = [];
  if (filterMeta.status && filterMeta.status !== 'all') {
    activeFilters.push(`${isKm ? 'ស្ថានភាព' : 'Status'}: ${getStatusBadge(filterMeta.status).label}`);
  }
  if (filterMeta.date) {
    activeFilters.push(`${isKm ? 'កាលបរិច្ឆេទ' : 'Date'}: ${filterMeta.date}`);
  }
  if (filterMeta.search) {
    activeFilters.push(`${isKm ? 'ពាក្យស្វែងរក' : 'Search'}: "${filterMeta.search}"`);
  }
  const filterDesc = activeFilters.length > 0 ? activeFilters.join(' • ') : (isKm ? 'ទិន្នន័យទាំងអស់ (All Records)' : 'All Records');

  const rowsHtml = orders.map((order, idx) => {
    const orderId = order.id || order.order_id || String(order._id || '').slice(-6).toUpperCase();
    const dateObj = new Date(order.created_at || order.createdAt || Date.now());
    const dateFormatted = dateObj.toLocaleDateString(isKm ? 'km-KH' : 'en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
    const timeFormatted = dateObj.toLocaleTimeString(isKm ? 'km-KH' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const custName = order.customer?.name || order.customer_name || (isKm ? 'អតិថិជនទូទៅ' : 'Guest Customer');
    const custPhone = order.customer?.phone || order.customer_phone || '-';

    const itemsSummary = (order.items || []).map((it) => {
      const name = isKm ? (it.name_km || it.name || it.title) : (it.name_en || it.name || it.title);
      return `<div style="font-size: 10.5px; line-height: 1.3;">• ${name} <strong style="color: #881337;">×${it.quantity || 1}</strong></div>`;
    }).join('');

    const statusBadge = getStatusBadge(order.status || order.order_status);
    const amountUsd = Number(order.total_usd || order.total || 0).toFixed(2);
    const amountKhr = Number(order.total_khr || (amountUsd * 4100)).toLocaleString();
    const payMethod = order.payment_method ? order.payment_method.toUpperCase() : 'CASH';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#fafaf9'};">
        <td style="padding: 7px 5px; text-align: center; font-weight: 700; color: #475569; font-size: 10px;">
          ${idx + 1}
        </td>
        <td style="padding: 7px 5px; font-weight: 800; color: #881337; font-family: monospace; font-size: 11px;">
          #${orderId}
        </td>
        <td style="padding: 7px 5px; font-size: 10px; color: #334155;">
          <div>${dateFormatted}</div>
          <div style="color: #64748b; font-size: 9.5px;">${timeFormatted}</div>
        </td>
        <td style="padding: 7px 5px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${custName}</div>
          <div style="color: #64748b; font-size: 10px; font-family: monospace;">${custPhone}</div>
        </td>
        <td style="padding: 7px 5px;">
          ${itemsSummary || '<span style="color: #94a3b8; font-size: 10px;">-</span>'}
        </td>
        <td style="padding: 7px 5px; text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 9999px; font-size: 9.5px; font-weight: 700; background: ${statusBadge.bg}; color: ${statusBadge.color}; border: 1px solid ${statusBadge.border}; white-space: nowrap;">
            ${statusBadge.label}
          </span>
          <div style="font-size: 8.5px; color: #64748b; margin-top: 2px; font-weight: 600;">${payMethod}</div>
        </td>
        <td style="padding: 7px 5px; text-align: right;">
          <div style="font-weight: 800; color: #0f172a; font-size: 11px;">$${amountUsd}</div>
          <div style="color: #64748b; font-size: 9px;">${amountKhr} ៛</div>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="${isKm ? 'km' : 'en'}">
    <head>
      <meta charset="UTF-8">
      <title>${isKm ? 'របាយការណ៍ការកុម្ម៉ង់ - ភោជនីយដ្ឋាន ភូមិយើង' : 'Orders Report - Phum Yeung Restaurant'}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Kantumruy Pro', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f172a;
          background: #ffffff;
          padding: 16px 20px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Strictly VERTICAL / PORTRAIT Orientation */
        @page {
          size: A4 portrait;
          margin: 8mm 6mm;
        }

        @media print {
          body {
            padding: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
        }

        .header-wrap {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 12px;
          border-bottom: 3px double #881337;
          margin-bottom: 14px;
        }

        .brand-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #881337;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          box-shadow: 0 3px 8px rgba(136, 19, 55, 0.25);
          flex-shrink: 0;
        }

        .brand-titles h1 {
          font-size: 18px;
          font-weight: 800;
          color: #881337;
          line-height: 1.2;
          margin-bottom: 2px;
        }

        .brand-titles h2 {
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .meta-col {
          text-align: right;
          font-size: 10px;
          color: #475569;
          line-height: 1.45;
        }

        .meta-col strong {
          color: #0f172a;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }

        .card {
          padding: 8px 10px;
          border-radius: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .card-label {
          font-size: 9.5px;
          color: #64748b;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .card-value {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
        }

        .card--primary {
          background: #fff1f2;
          border-color: #fecdd3;
        }
        .card--primary .card-value {
          color: #881337;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 10.5px;
        }

        .report-table th {
          background-color: #881337 !important;
          color: #ffffff !important;
          font-weight: 700;
          text-align: left;
          padding: 8px 5px;
          letter-spacing: 0.2px;
          border: 1px solid #881337;
          font-size: 10.5px;
        }

        .signature-row {
          display: flex;
          justify-content: space-between;
          margin-top: 28px;
          padding-top: 14px;
          border-top: 1px dashed #cbd5e1;
        }

        .sig-box {
          text-align: center;
          width: 170px;
        }

        .sig-box .title {
          font-weight: 700;
          font-size: 11px;
          color: #334155;
          margin-bottom: 45px;
        }

        .sig-box .line {
          border-bottom: 1px solid #475569;
          margin-bottom: 5px;
        }

        .sig-box .sub {
          font-size: 9.5px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <!-- Letterhead -->
      <div class="header-wrap">
        <div class="brand-col">
          <div class="logo-circle">PY</div>
          <div class="brand-titles">
            <h1>${isKm ? 'ភោជនីយដ្ឋាន ភូមិយើង' : 'PHUM YEUNG RESTAURANT'}</h1>
            <h2>${isKm ? 'របាយការណ៍លម្អិតនៃការកុម្ម៉ង់' : 'DETAILED ORDERS REPORT'}</h2>
            <div style="font-size: 10px; color: #475569; margin-top: 2px;">
              📍 ${isKm ? 'រាជធានីភ្នំពេញ, កម្ពុជា' : 'Phnom Penh, Cambodia'} • 📞 012 345 678 / 098 765 432
            </div>
          </div>
        </div>

        <div class="meta-col">
          <div>${isKm ? 'កាលបរិច្ឆេទ' : 'Date'}: <strong>${printDateStr}</strong> (${printTimeStr})</div>
          <div>${isKm ? 'អ្នកគ្រប់គ្រង' : 'Generated by'}: <strong>${adminName}</strong></div>
          <div style="margin-top: 3px; padding: 2px 6px; background: #f1f5f9; border-radius: 4px; display: inline-block;">
            🎯 ${filterDesc}
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards (Compact 4-col in Portrait) -->
      <div class="summary-cards">
        <div class="card card--primary">
          <div class="card-label">${isKm ? 'ចំណូលសរុប (Revenue)' : 'Total Revenue'}</div>
          <div class="card-value">$${totalUSD.toFixed(2)}</div>
          <div style="font-size: 9px; color: #be123c; margin-top: 1px;">≈ ${totalKHR.toLocaleString()} ៛</div>
        </div>

        <div class="card">
          <div class="card-label">${isKm ? 'ចំនួនកុម្ម៉ង់សរុប' : 'Total Orders'}</div>
          <div class="card-value">${totalCount}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 1px;">${isKm ? 'តាមតម្រងបច្ចុប្បន្ន' : 'Filtered'}</div>
        </div>

        <div class="card">
          <div class="card-label">${isKm ? 'ការកុម្ម៉ង់បានបញ្ចប់' : 'Completed'}</div>
          <div class="card-value" style="color: #15803d;">${completedOrders.length}</div>
          <div style="font-size: 9px; color: #15803d; margin-top: 1px;">${totalCount > 0 ? Math.round((completedOrders.length / totalCount) * 100) : 0}% ${isKm ? 'ជោគជ័យ' : 'Success'}</div>
        </div>

        <div class="card">
          <div class="card-label">${isKm ? 'កំពុងដំណើរការ/រង់ចាំ' : 'Pending / Cooking'}</div>
          <div class="card-value" style="color: #b45309;">${pendingOrders.length}</div>
          <div style="font-size: 9px; color: #b45309; margin-top: 1px;">${isKm ? 'ត្រូវការតាមដាន' : 'Active'}</div>
        </div>
      </div>

      <!-- Orders Data Table with Elegant Burgundy Header -->
      <table class="report-table">
        <thead>
          <tr>
            <th style="width: 26px; text-align: center;">#</th>
            <th style="width: 72px;">${isKm ? 'លេខកូដ' : 'Order ID'}</th>
            <th style="width: 82px;">${isKm ? 'កាលបរិច្ឆេទ' : 'Date / Time'}</th>
            <th style="width: 110px;">${isKm ? 'អតិថិជន & ទូរស័ព្ទ' : 'Customer'}</th>
            <th>${isKm ? 'មុខម្ហូប & បរិមាណ' : 'Items & Qty'}</th>
            <th style="width: 78px; text-align: center;">${isKm ? 'ស្ថានភាព' : 'Status'}</th>
            <th style="width: 82px; text-align: right;">${isKm ? 'តម្លៃសរុប' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #94a3b8;">${isKm ? 'មិនមានទិន្នន័យការកុម្ម៉ង់ស្របតាមតម្រងនេះទេ' : 'No order records matching active filter.'}</td></tr>`}
        </tbody>
      </table>

      <!-- Signature & Verification Block -->
      <div class="signature-row">
        <div class="sig-box">
          <div class="title">${isKm ? 'អ្នករៀបចំរបាយការណ៍' : 'Prepared By'}</div>
          <div class="line"></div>
          <div class="sub">${adminName}</div>
        </div>

        <div class="sig-box">
          <div class="title">${isKm ? 'ប្រធានគណនេយ្យ' : 'Accounting / Finance'}</div>
          <div class="line"></div>
          <div class="sub">${isKm ? 'ហត្ថលេខា & ឈ្មោះ' : 'Signature & Name'}</div>
        </div>

        <div class="sig-box">
          <div class="title">${isKm ? 'អ្នកគ្រប់គ្រងទូទៅ' : 'General Manager'}</div>
          <div class="line"></div>
          <div class="sub">${isKm ? 'ការយល់ព្រម & ត្រាផ្លូវការ' : 'Approval & Stamp'}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Hidden Iframe directly triggering browser print dialog in Vertical / Portrait mode
  let printFrame = document.getElementById('py-report-print-iframe');
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'py-report-print-iframe';
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '800px';
    printFrame.style.height = '1000px';
    printFrame.style.border = 'none';
    printFrame.style.opacity = '0';
    document.body.appendChild(printFrame);
  }

  const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  // Trigger print dialog directly from iframe in vertical mode
  setTimeout(() => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (e) {
      console.warn('[Print frame fallback]', e);
      const win = window.open('', '_blank', 'width=850,height=1100');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 300);
      }
    }
  }, 400);
};

/**
 * printSingleInvoice
 * Prints a clean, single-page official restaurant invoice & receipt for an individual order.
 */
export const printSingleInvoice = ({
  order = {},
  adminUser = null,
  isKm = true
}) => {
  const now = new Date();
  const printDateStr = now.toLocaleDateString(isKm ? 'km-KH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const printTimeStr = now.toLocaleTimeString(isKm ? 'km-KH' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const orderId = order.id || order.orderId || 'PY-ORD-0000';
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString(isKm ? 'km-KH' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : `${printDateStr}, ${printTimeStr}`;

  const adminSaleName =
    order.adminSale ||
    order.lastUpdatedBy ||
    adminUser?.name ||
    adminUser?.username ||
    (isKm ? 'អ្នកគ្រប់គ្រង (Admin)' : 'Administrator');

  const orderTotal = Number(order.total || 0);
  const orderTotalKhr = Number(order.totalKhr || (orderTotal * 4100));
  const orderSubtotal = Number(order.subtotal || orderTotal);
  const orderDeliveryFee = Number(order.deliveryFee || 0);
  const orderDiscount = Number(order.discount || 0);
  const items = Array.isArray(order.items) ? order.items : [];
  const activityLogs = Array.isArray(order.activityLogs) ? order.activityLogs : [];

  const html = `
    <!DOCTYPE html>
    <html lang="${isKm ? 'km' : 'en'}">
    <head>
      <meta charset="utf-8">
      <title>Invoice #${orderId} - Phum Yeung Restaurant</title>
      <style>
        @page {
          size: portrait;
          margin: 8mm 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Kantumruy Pro', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #ffffff;
          color: #0f172a;
          font-size: 11pt;
          line-height: 1.4;
          padding: 10px 14px;
          max-width: 600px;
          margin: 0 auto;
        }
        .invoice-card {
          border: 1.5px solid #1e293b;
          border-radius: 8px;
          padding: 16px 20px;
          background: #ffffff;
        }
        .brand-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #881337;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .brand-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-logo {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 2px solid #881337;
          object-fit: cover;
        }
        .brand-names h2 {
          font-size: 1.25rem;
          color: #881337;
          font-weight: 800;
          line-height: 1.2;
        }
        .brand-names .en {
          font-size: 0.8rem;
          color: #475569;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .brand-names .desc {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 2px;
        }
        .invoice-badge-box {
          text-align: right;
        }
        .invoice-badge {
          display: inline-block;
          background: #881337;
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .invoice-num {
          font-size: 1rem;
          font-weight: 800;
          color: #0f172a;
          margin-top: 4px;
        }
        .invoice-date {
          font-size: 0.78rem;
          color: #64748b;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 12px;
          margin-bottom: 14px;
          font-size: 0.86rem;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          gap: 6px;
        }
        .meta-label {
          color: #64748b;
          font-weight: 600;
        }
        .meta-val {
          font-weight: 700;
          color: #0f172a;
          text-align: right;
        }
        .admin-sale-badge {
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
          padding: 1px 6px;
          font-weight: 700;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 0.88rem;
        }
        .items-table th {
          background: #f1f5f9;
          border-top: 1px solid #cbd5e1;
          border-bottom: 1px solid #cbd5e1;
          padding: 6px 8px;
          font-weight: 700;
          font-size: 0.82rem;
          color: #1e293b;
        }
        .items-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #f1f5f9;
          color: #0f172a;
        }
        .summary-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-left: auto;
          max-width: 280px;
          padding-top: 6px;
          border-top: 1px dashed #cbd5e1;
          font-size: 0.88rem;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          color: #475569;
        }
        .grand-total-row {
          border-top: 2px solid #881337;
          padding-top: 6px;
          margin-top: 4px;
          font-size: 1.05rem;
          font-weight: 800;
          color: #881337;
        }
        .activity-section {
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px dashed #cbd5e1;
          font-size: 0.78rem;
        }
        .activity-title {
          font-weight: 700;
          color: #334155;
          margin-bottom: 4px;
        }
        .activity-item {
          color: #64748b;
          margin-bottom: 2px;
        }
        .footer-note {
          text-align: center;
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 0.78rem;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <!-- Header -->
        <div class="brand-header">
          <div class="brand-info">
            <img src="/phum_yeung_logo.jpg" alt="Phum Yeung" class="brand-logo" onerror="this.style.display='none'"/>
            <div class="brand-names">
              <h2>ភោជនីយដ្ឋាន ភូមិយើង</h2>
              <div class="en">PHUM YEUNG RESTAURANT</div>
              <div class="desc">រសជាតិខ្មែរពិតៗ • Authentic Khmer Cuisine</div>
            </div>
          </div>
          <div class="invoice-badge-box">
            <div class="invoice-badge">${isKm ? 'វិក្កយបត្រ / RECEIPT' : 'OFFICIAL INVOICE'}</div>
            <div class="invoice-num">#${orderId}</div>
            <div class="invoice-date">${orderDate}</div>
          </div>
        </div>

        <!-- Meta Details -->
        <div class="meta-grid">
          <div class="meta-row">
            <span class="meta-label">${isKm ? 'អតិថិជន:' : 'Customer:'}</span>
            <span class="meta-val">${order.customerName || 'N/A'}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${isKm ? 'អ្នកលក់/បេឡា:' : 'Admin Sale:'}</span>
            <span class="meta-val"><span class="admin-sale-badge">${adminSaleName}</span></span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${isKm ? 'លេខទូរស័ព្ទ:' : 'Phone:'}</span>
            <span class="meta-val">${order.phone || 'N/A'}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">${isKm ? 'វិធីទូទាត់:' : 'Payment:'}</span>
            <span class="meta-val">${order.paymentMethod === 'khqr' ? 'Bakong KHQR (PAID)' : 'Bakong KHQR'}</span>
          </div>
          <div class="meta-row" style="grid-column: span 2;">
            <span class="meta-label">${isKm ? 'អាសយដ្ឋានដឹកជញ្ជូន:' : 'Delivery Address:'}</span>
            <span class="meta-val">${order.address || 'Central Kitchen Pickup'}</span>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th style="text-align: left;">${isKm ? 'មុខម្ហូប' : 'Item Description'}</th>
              <th style="width: 50px; text-align: center;">${isKm ? 'ចំនួន' : 'Qty'}</th>
              <th style="width: 80px; text-align: right;">${isKm ? 'តម្លៃ' : 'Price'}</th>
              <th style="width: 90px; text-align: right;">${isKm ? 'សរុប' : 'Amount'}</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="font-weight: 600;">${it.name || it.name_km || it.name_en || 'Food Item'}</td>
                <td style="text-align: center;">${it.quantity || 1}</td>
                <td style="text-align: right;">$${Number(it.price || 0).toFixed(2)}</td>
                <td style="text-align: right; font-weight: 700;">$${(Number(it.price || 0) * (it.quantity || 1)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals Summary -->
        <div class="summary-box">
          ${orderSubtotal > 0 && orderSubtotal !== orderTotal ? `
            <div class="summary-row">
              <span>${isKm ? 'សរុបដើម:' : 'Subtotal:'}</span>
              <span>$${orderSubtotal.toFixed(2)}</span>
            </div>
          ` : ''}
          ${orderDeliveryFee > 0 ? `
            <div class="summary-row">
              <span>${isKm ? 'ថ្លៃដឹកជញ្ជូន:' : 'Delivery Fee:'}</span>
              <span>$${orderDeliveryFee.toFixed(2)}</span>
            </div>
          ` : ''}
          ${orderDiscount > 0 ? `
            <div class="summary-row" style="color: #16a34a; font-weight: 600;">
              <span>${isKm ? 'បញ្ចុះតម្លៃ:' : 'Discount:'}</span>
              <span>-$${orderDiscount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="summary-row grand-total-row">
            <span>${isKm ? 'តម្លៃសរុប:' : 'Grand Total:'}</span>
            <span>$${orderTotal.toFixed(2)} (${orderTotalKhr.toLocaleString()} ៛)</span>
          </div>
        </div>

        <!-- Activity Logs & Audit Trail -->
        <div class="activity-section">
          <div class="activity-title">${isKm ? '📋 ប្រវត្តិសកម្មភាពរបស់អ្នកគ្រប់គ្រង (Admin Audit Logs):' : '📋 Admin Activity Logs:'}</div>
          ${activityLogs.length > 0 ? activityLogs.map(log => `
            <div class="activity-item">
              • <strong>${log.adminName || 'Admin'}</strong>: ${log.description || log.action} <span style="color: #94a3b8;">(${new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
            </div>
          `).join('') : `
            <div class="activity-item">
              • ${isKm ? 'ការកុម្ម៉ង់ត្រូវបានបង្កើតឡើងដោយអតិថិជន និងគ្រប់គ្រងដោយ' : 'Order placed by customer & managed by'} <strong>${adminSaleName}</strong>
            </div>
          `}
        </div>

        <!-- Footer -->
        <div class="footer-note">
          <div>${isKm ? '🙏 សូមអរគុណសម្រាប់ការគាំទ្រភោជនីយដ្ឋាន ភូមិយើង!' : '🙏 Thank you for dining with Phum Yeung Restaurant!'}</div>
          <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">Tel: 012 345 678 / 098 765 432 • Phnom Penh, Cambodia</div>
        </div>
      </div>
    </body>
    </html>
  `;

  let printFrame = document.getElementById('py-single-invoice-iframe');
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'py-single-invoice-iframe';
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '700px';
    printFrame.style.height = '900px';
    printFrame.style.border = 'none';
    printFrame.style.opacity = '0';
    document.body.appendChild(printFrame);
  }

  const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    } catch (e) {
      console.warn('[Print invoice iframe fallback]', e);
      const win = window.open('', '_blank', 'width=750,height=950');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 300);
      }
    }
  }, 350);
};
