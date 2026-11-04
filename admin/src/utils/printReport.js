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
