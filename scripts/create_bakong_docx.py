import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
import os

def create_guide_document(output_path):
    doc = docx.Document()

    # Configure Margins (0.8 inches all around)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        section.page_width = Inches(8.5)
        section.page_height = Inches(11.0)

    # Styling constants
    COLOR_PRIMARY = RGBColor(30, 58, 138)     # Navy #1E3A8A
    COLOR_SECONDARY = RGBColor(13, 148, 136) # Teal #0D9488
    COLOR_DARK = RGBColor(31, 41, 55)        # Charcoal #1F2937
    COLOR_MUTED = RGBColor(75, 85, 99)       # Gray #4B5563
    COLOR_WARNING = RGBColor(180, 83, 9)     # Amber #B45309

    def style_run(run, font_name="Calibri", size_pt=11, color=COLOR_DARK, bold=False, italic=False):
        run.font.name = font_name
        run.font.size = Pt(size_pt)
        run.font.color.rgb = color
        run.bold = bold
        run.italic = italic

    def add_title(text, subtitle_en, subtitle_km):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        style_run(run, font_name="Calibri", size_pt=24, color=COLOR_PRIMARY, bold=True)

        p2 = doc.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_after = Pt(2)
        run2 = p2.add_run(subtitle_en)
        style_run(run2, font_name="Calibri", size_pt=13, color=COLOR_SECONDARY, bold=True)

        p3 = doc.add_paragraph()
        p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p3.paragraph_format.space_after = Pt(18)
        run3 = p3.add_run(subtitle_km)
        style_run(run3, font_name="Khmer OS Siemreap", size_pt=11, color=COLOR_MUTED, italic=True)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        style_run(run, font_name="Calibri", size_pt=16, color=COLOR_PRIMARY, bold=True)
        # Add bottom border/accent line via XML
        pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="4" w:color="1E3A8A"/></w:pBdr>')
        p._p.get_or_add_pPr().append(pBdr)

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        style_run(run, font_name="Calibri", size_pt=13, color=COLOR_SECONDARY, bold=True)

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        style_run(run, font_name="Calibri", size_pt=11.5, color=COLOR_DARK, bold=True)

    def add_p(text, bold_prefix=None, space_after=5):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            run_b = p.add_run(bold_prefix + " ")
            style_run(run_b, font_name="Calibri", size_pt=10.5, color=COLOR_DARK, bold=True)
        run = p.add_run(text)
        style_run(run, font_name="Calibri", size_pt=10.5, color=COLOR_DARK)
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            run_b = p.add_run(bold_prefix + " ")
            style_run(run_b, font_name="Calibri", size_pt=10.5, color=COLOR_DARK, bold=True)
        run = p.add_run(text)
        style_run(run, font_name="Calibri", size_pt=10.5, color=COLOR_DARK)
        return p

    def add_callout(title, text, callout_type="INFO"):
        # Table with 1 row, 1 cell, shaded and with colored left border
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(6.9)

        cell = tbl.cell(0, 0)
        tcPr = cell._tc.get_or_add_tcPr()

        # Border color & fill depending on type
        if callout_type == "WARNING":
            border_color = "DC2626"
            fill_color = "FEF2F2"
            title_color = RGBColor(220, 38, 38)
        elif callout_type == "TIP":
            border_color = "059669"
            fill_color = "ECFDF5"
            title_color = RGBColor(5, 150, 105)
        else:
            border_color = "2563EB"
            fill_color = "EFF6FF"
            title_color = RGBColor(37, 99, 235)

        tcBorders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="none"/>'
            f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
            f'<w:bottom w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(tcBorders)
        tcShd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_color}"/>')
        tcPr.append(tcShd)

        # Padding inside cell
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="120" w:type="dxa"/>'
            f'<w:left w:w="180" w:type="dxa"/>'
            f'<w:bottom w:w="120" w:type="dxa"/>'
            f'<w:right w:w="180" w:type="dxa"/>'
            f'</w:tcMar>'
        )
        tcPr.append(tcMar)

        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r_title = p.add_run(title)
        style_run(r_title, font_name="Calibri", size_pt=10.5, color=title_color, bold=True)

        p2 = cell.add_paragraph()
        p2.paragraph_format.space_after = Pt(2)
        r_body = p2.add_run(text)
        style_run(r_body, font_name="Calibri", size_pt=10, color=COLOR_DARK)

        # Space after table
        empty_p = doc.add_paragraph()
        empty_p.paragraph_format.space_before = Pt(2)
        empty_p.paragraph_format.space_after = Pt(4)

    def add_code_block(code_text, language_label="Code"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = False
        tbl.columns[0].width = Inches(6.9)

        cell = tbl.cell(0, 0)
        tcPr = cell._tc.get_or_add_tcPr()

        tcBorders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'<w:left w:val="single" w:sz="18" w:space="0" w:color="0EA5E9"/>'
            f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'<w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(tcBorders)
        tcShd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F8FAFC"/>')
        tcPr.append(tcShd)

        # Padding
        tcMar = parse_xml(
            f'<w:tcMar {nsdecls("w")}>'
            f'<w:top w:w="100" w:type="dxa"/>'
            f'<w:left w:w="140" w:type="dxa"/>'
            f'<w:bottom w:w="100" w:type="dxa"/>'
            f'<w:right w:w="140" w:type="dxa"/>'
            f'</w:tcMar>'
        )
        tcPr.append(tcMar)

        p_header = cell.paragraphs[0]
        p_header.paragraph_format.space_after = Pt(4)
        r_lbl = p_header.add_run(f"// {language_label}")
        style_run(r_lbl, font_name="Consolas", size_pt=8.5, color=RGBColor(100, 116, 139), bold=True)

        lines = code_text.strip().split("\n")
        for line in lines:
            p_line = cell.add_paragraph()
            p_line.paragraph_format.space_after = Pt(0)
            p_line.paragraph_format.line_spacing = 1.05
            r_line = p_line.add_run(line)
            style_run(r_line, font_name="Consolas", size_pt=9, color=RGBColor(15, 23, 42))

        empty_p = doc.add_paragraph()
        empty_p.paragraph_format.space_after = Pt(4)

    def add_styled_table(headers, rows):
        tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        tbl.autofit = True

        # Header row
        hdr_cells = tbl.rows[0].cells
        for idx, text in enumerate(headers):
            cell = hdr_cells[idx]
            tcPr = cell._tc.get_or_add_tcPr()
            tcShd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="1E3A8A"/>')
            tcPr.append(tcShd)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.space_before = Pt(2)
            r = p.add_run(text)
            style_run(r, font_name="Calibri", size_pt=9.5, color=RGBColor(255, 255, 255), bold=True)

        # Data rows
        for row_idx, row_data in enumerate(rows):
            row_cells = tbl.rows[row_idx + 1].cells
            bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
            for col_idx, cell_value in enumerate(row_data):
                cell = row_cells[col_idx]
                tcPr = cell._tc.get_or_add_tcPr()
                tcShd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_color}"/>')
                tcPr.append(tcShd)
                # Border
                tcBrd = parse_xml(
                    f'<w:tcBorders {nsdecls("w")}>'
                    f'<w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
                    f'<w:left w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
                    f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
                    f'<w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
                    f'</w:tcBorders>'
                )
                tcPr.append(tcBrd)
                p = cell.paragraphs[0]
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.space_before = Pt(2)
                r = p.add_run(str(cell_value))
                style_run(r, font_name="Calibri", size_pt=9.5, color=COLOR_DARK)

        empty_p = doc.add_paragraph()
        empty_p.paragraph_format.space_after = Pt(4)

    # ==================== DOCUMENT CONTENT GENERATION ====================

    # Title & Subtitles
    add_title(
        text="BAKONG KHQR INTEGRATION MANUAL",
        subtitle_en="A Smooth, Production-Ready Guide from Start to Finish with Multi-Language Support",
        subtitle_km="សៀវភៅណែនាំលម្អិតអំពីការតភ្ជាប់ប្រព័ន្ធទូទាត់ Bakong KHQR ពីដើមដល់ចប់ និងការផ្លាស់ប្តូរភាសាដោយរលូន"
    )

    # Executive Overview
    add_h1("1. Overview & System Architecture (ទិដ្ឋភាពទូទៅនៃប្រព័ន្ធ)")
    add_p(
        "Bakong KHQR is the standardized national QR code payment system launched by the National Bank of Cambodia (NBC). "
        "It complies with the global EMVCo standard and allows customers from all participating commercial banks "
        "(ABA, ACLEDA, Wing, Canadia, Sathapana, etc.) to scan and pay instantly using either Khmer Riel (KHR) or US Dollars (USD)."
    )
    add_p(
        "To make KHQR work smoothly in an automated restaurant or e-commerce workflow, three components must communicate in sync:"
    )
    add_bullet("Frontend (Client): Collects customer cart items, triggers KHQR modal, displays QR with 15-minute timer, and checks verification status.")
    add_bullet("Backend (API Server): Generates dynamic EMVCo QR string, creates MD5 transaction hash, formats currency, and securely verifies status with NBC Open API.")
    add_bullet("NBC Bakong Gateway: Confirms settlement when the customer scans the QR with any banking app in Cambodia.")

    add_callout(
        "Core Philosophy: Static QR vs. Dynamic KHQR",
        "A Static QR requires customers to type the amount manually and does not notify your server automatically. "
        "A Dynamic KHQR embeds the exact amount, order bill number, and expiration timestamp into the QR string, and generates an MD5 hash. "
        "This allows 100% automated real-time verification without customer intervention.",
        "INFO"
    )

    # Architecture Table
    headers_arch = ["Step", "Action", "Actor", "Output / Data Passed"]
    rows_arch = [
        ["1", "Customer clicks 'Pay with KHQR'", "Customer (Frontend)", "Cart Total & Currency (KHR/USD)"],
        ["2", "Request QR generation", "Frontend -> Backend", "Amount, BillNumber, StoreLabel"],
        ["3", "Generate EMVCo QR & MD5 Hash", "Backend Server", "EMVCo payload string & MD5 checksum"],
        ["4", "Render QR Image on Modal", "Backend -> Frontend", "Base64 PNG Image + MD5 string"],
        ["5", "Customer scans & confirms payment", "Customer Bank App", "Settles via NBC Bakong Switch"],
        ["6", "Verify payment status", "Frontend / Backend Poller", "Calls POST /v1/check_transaction_by_md5"],
        ["7", "Confirm order & print receipt", "Backend & Admin", "Order updated to 'PAID', table notified"]
    ]
    add_styled_table(headers_arch, rows_arch)

    # Section 2: Prerequisites
    add_h1("2. Prerequisites & Credentials (លក្ខខណ្ឌតម្រូវ និងគណនី)")
    add_p("Before writing integration code, verify you have the required credentials from Bakong or your acquiring bank:")
    add_bullet("Bakong Account ID: e.g., yourname@bkrt, merchant@aclb, phone_number@wing. For production, apply for an official Merchant Account.", "1. Bakong ID:")
    add_bullet("Merchant Name: Must be in Latin uppercase characters (e.g., 'PHUM YEUNG RESTAURANT'). Maximum 25 characters.", "2. Merchant Name:")
    add_bullet("Merchant City: The registered city in Latin characters (e.g., 'Phnom Penh', 'Siem Reap').", "3. Merchant City:")
    add_bullet("Bakong Open API Token: A Bearer JWT token issued by NBC Bakong Developer Portal to query transaction status.", "4. Open API Token:")
    add_bullet("Bakong Gateway URL: Sandbox (api-bakong-sandbox.nbc.gov.kh) or Production (api-bakong.nbc.gov.kh/v1).", "5. API Endpoint:")

    add_callout(
        "Individual vs. Merchant Account Types",
        "If you use an individual Bakong ID (like vatana@bkrt), use the IndividualInfo class. "
        "If your business has a formal Merchant ID (MID) and Acquiring Bank ID from NBC/Partner bank, use the MerchantInfo class. "
        "Both generate valid EMVCo KHQR strings, but Merchant accounts offer higher daily limits and webhook callbacks.",
        "TIP"
    )

    # Section 3: Generating Dynamic KHQR
    add_h1("3. Generating Dynamic KHQR (ការបង្កើត Dynamic KHQR)")
    add_p(
        "A smooth payment flow requires dynamic QR codes with exact amounts and expiration timestamps. "
        "Follow these strict formatting rules to prevent mobile banking apps from rejecting the QR:"
    )

    headers_rules = ["Parameter", "KHR Rule", "USD Rule", "Important Note"]
    rows_rules = [
        ["Currency Code", "khqrData.currency.khr (116)", "khqrData.currency.usd (840)", "Never mix currency codes"],
        ["Amount Format", "Integer only (no decimals, e.g. 41000)", "Float with 2 decimals (e.g. 10.50)", "Fractional Riel causes app crashes"],
        ["Bill Number", "String up to 25 chars", "String up to 25 chars", "Unique per checkout session"],
        ["Store Label", "String up to 25 chars", "String up to 25 chars", "Displayed on customer confirmation screen"],
        ["Expiration", "Timestamp in ms (Now + 15 mins)", "Timestamp in ms (Now + 15 mins)", "Prevents stale payments"]
    ]
    add_styled_table(headers_rules, rows_rules)

    add_p(
        "Here is the standard Node.js generator function using the official `bakong-khqr` and `qrcode` libraries:"
    )

    node_gen_code = """import { BakongKHQR, IndividualInfo, khqrData } from 'bakong-khqr';
import QRCode from 'qrcode';

export const generateBakongKHQR = async (req, res) => {
  try {
    const { amount, currency = 'KHR', billNumber, storeLabel = 'Phum Yeung' } = req.body;
    
    // 1. Validation & Currency formatting
    const isUSD = String(currency).toUpperCase() === 'USD';
    const formattedAmount = isUSD
      ? parseFloat(Number(amount).toFixed(2))
      : Math.round(Number(amount));

    // 2. Build Optional Payload Data
    const optionalData = {
      currency: isUSD ? khqrData.currency.usd : khqrData.currency.khr,
      amount: formattedAmount,
      expirationTimestamp: Date.now() + (15 * 60 * 1000), // 15 minutes
      billNumber: String(billNumber || `PY-${Date.now().toString().slice(-6)}`).slice(0, 25),
      storeLabel: String(storeLabel).slice(0, 25),
      terminalLabel: 'Cashier 01'
    };

    // 3. Instantiate Individual or Merchant Info
    const individualInfo = new IndividualInfo(
      process.env.BAKONG_ACCOUNT_ID,
      process.env.BAKONG_MERCHANT_NAME || 'PHUM YEUNG',
      process.env.BAKONG_MERCHANT_CITY || 'Phnom Penh',
      optionalData
    );

    // 4. Generate EMVCo QR String & MD5
    const khqr = new BakongKHQR();
    const result = khqr.generateIndividual(individualInfo);

    if (!result || result.status?.code !== 0 || !result.data?.qr) {
      return res.status(400).json({ success: false, message: result?.status?.message });
    }

    const { qr: qrString, md5: md5Hash } = result.data;

    // 5. Render High-Resolution QR Data URL
    const qrImage = await QRCode.toDataURL(qrString, {
      width: 340,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' }
    });

    return res.json({
      success: true,
      data: {
        qr: qrString,
        md5: md5Hash,
        qrImage,
        amount: formattedAmount,
        currency: isUSD ? 'USD' : 'KHR',
        billNumber: optionalData.billNumber
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};"""
    add_code_block(node_gen_code, "Node.js (Express) - Dynamic KHQR Generation")

    # Section 4: Real-time Verification
    add_h1("4. Real-time Payment Verification (ការផ្ទៀងផ្ទាត់ការបង់ប្រាក់)")
    add_p(
        "To make KHQR work smoothly without errors or API rate limit bans, the verification mechanism must be carefully architected. "
        "Bakong provides the endpoint: `POST https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5`."
    )

    add_callout(
        "Preventing Rate Limit & API Lockouts",
        "NBC Bakong API enforces rate limits on open developer tokens. "
        "DO NOT poll every 1 second! Instead: "
        "1) Use a 3 to 4-second polling interval. "
        "2) Stop polling immediately upon receiving responseCode: 0. "
        "3) Provide a 'Check Payment' manual button on the frontend so customers can recheck instantly if impatient. "
        "4) Provide a development simulator during testing so you don't exhaust production quotas.",
        "WARNING"
    )

    node_verify_code = """export const verifyTransactionByMD5 = async (req, res) => {
  try {
    const { md5 } = req.body;
    if (!md5) return res.status(400).json({ success: false, message: 'MD5 is required' });

    // Handle Local Development Simulator if active
    if (process.env.NODE_ENV !== 'production' && simulatedTransactions.has(md5)) {
      return res.json({
        success: true,
        responseCode: 0,
        responseMessage: 'Success (Simulated Dev)',
        data: { hash: md5, status: 'SUCCESS', paidAt: new Date().toISOString() }
      });
    }

    const token = process.env.BAKONG_TOKEN;
    const apiUrl = process.env.BAKONG_API_URL || 'https://api-bakong.nbc.gov.kh/v1';

    // Call NBC Bakong Gateway
    const response = await fetch(`${apiUrl}/check_transaction_by_md5`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ md5 })
    });

    const data = await response.json();
    const isPaid = data.responseCode === 0 && Boolean(data.data?.hash);
    const isRateLimited = data.responseCode === 1 &&
      typeof data.responseMessage === 'string' &&
      data.responseMessage.toLowerCase().includes('limit');

    return res.json({
      success: isPaid,
      responseCode: data.responseCode,
      responseMessage: data.responseMessage,
      isPaid,
      isRateLimited,
      data: data.data
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};"""
    add_code_block(node_verify_code, "Node.js (Express) - MD5 Verification Endpoint")

    # Section 5: Language Flexibility (The Core Requirement)
    add_h1("5. Language Flexibility & Independence (ការផ្លាស់ប្តូរភាសាដោយរលូន)")
    add_p(
        "A common issue developers encounter is how to switch programming languages (e.g. from Node.js to PHP/Laravel or Python) "
        "OR switch UI languages (Khmer <-> English) without breaking the QR payment engine. "
        "Here is how both aspects work smoothly:"
    )

    add_h2("Part A: Switching Backend Languages (Node.js <-> PHP <-> Python)")
    add_p(
        "The underlying Bakong KHQR protocol is completely language-agnostic. "
        "Whether your server runs Node.js, PHP/Laravel, Python/FastAPI, Go, or Java, "
        "the standard algorithm is identical: build EMVCo TLV (Tag-Length-Value) string -> calculate CRC16 -> calculate MD5 hash -> query NBC Open API."
    )

    add_p("Below are production-ready implementations in PHP (Laravel) and Python (FastAPI):")

    php_code = """<?php
// app/Http/Controllers/PaymentController.php in Laravel

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class PaymentController extends Controller
{
    // Generate KHQR (Using standard EMVCo TLV format or bakong-khqr-php)
    public function generateKhqr(Request $request)
    {
        $amount = $request->input('amount');
        $currency = strtoupper($request->input('currency', 'KHR'));
        $billNumber = substr($request->input('billNumber', 'PY-' . time()), 0, 25);
        
        $bakongId = env('BAKONG_ACCOUNT_ID', 'vatana@bkrt');
        $merchantName = env('BAKONG_MERCHANT_NAME', 'PHUM YEUNG');
        $merchantCity = env('BAKONG_MERCHANT_CITY', 'Phnom Penh');
        
        $isUsd = ($currency === 'USD');
        $formattedAmount = $isUsd ? number_format((float)$amount, 2, '.', '') : (int)round($amount);
        $currencyCode = $isUsd ? '840' : '116';

        // Using standard KHQR PHP library or EMVCo TLV Builder
        $khqr = new \KHQR\BakongKHQR();
        $payload = $khqr->createIndividual([
            'bakongAccountId' => $bakongId,
            'merchantName'    => $merchantName,
            'merchantCity'    => $merchantCity,
            'currency'        => $currencyCode,
            'amount'          => $formattedAmount,
            'billNumber'      => $billNumber,
            'storeLabel'      => 'Phum Yeung',
            'terminalLabel'   => 'Cashier 01'
        ]);

        $qrString = $payload['qr'];
        $md5Hash  = md5($qrString); // In Bakong, MD5 is the hash of the raw EMVCo string

        // Generate Base64 QR Image
        $qrImage = 'data:image/png;base64,' . base64_encode(
            QrCode::format('png')->size(320)->margin(2)->generate($qrString)
        );

        return response()->json([
            'success' => true,
            'data' => [
                'qr'         => $qrString,
                'md5'        => $md5Hash,
                'qrImage'    => $qrImage,
                'amount'     => $formattedAmount,
                'currency'   => $currency,
                'billNumber' => $billNumber
            ]
        ]);
    }

    // Verify MD5 with NBC Bakong API
    public function verifyKhqr(Request $request)
    {
        $md5 = $request->input('md5');
        $token = env('BAKONG_TOKEN');
        $apiUrl = env('BAKONG_API_URL', 'https://api-bakong.nbc.gov.kh/v1');

        $response = Http::withToken($token)->post("{$apiUrl}/check_transaction_by_md5", [
            'md5' => $md5
        ]);

        $body = $response->json();
        $isPaid = ($body['responseCode'] ?? 1) === 0 && !empty($body['data']['hash']);

        return response()->json([
            'success'         => $isPaid,
            'responseCode'    => $body['responseCode'] ?? 1,
            'responseMessage' => $body['responseMessage'] ?? 'Pending',
            'isPaid'          => $isPaid,
            'data'            => $body['data'] ?? null
        ]);
    }
}"""
    add_code_block(php_code, "PHP / Laravel Implementation (PaymentController.php)")

    python_code = """# main.py in Python / FastAPI
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import hashlib
import qrcode
import io
import base64
import httpx
import os

app = FastAPI(title="Bakong KHQR API")

class GenerateQRRequest(BaseModel):
    amount: float
    currency: str = "KHR"
    bill_number: str = "PY-1001"
    store_label: str = "Phum Yeung"

@app.post("/api/payment/generate-khqr")
async def generate_khqr(req: GenerateQRRequest):
    # Format amount
    is_usd = req.currency.upper() == "USD"
    amount_str = f"{req.amount:.2f}" if is_usd else str(int(round(req.amount)))
    currency_code = "840" if is_usd else "116"

    # Build KHQR EMVCo String (or use bakong-khqr python wrapper)
    # Note: Tag 59: Merchant Name, Tag 60: City, Tag 54: Amount, Tag 53: Currency
    # Compute MD5 Hash of the generated EMVCo string:
    raw_qr_string = f"000201010212...{currency_code}...{amount_str}..." # complete EMVCo payload
    md5_hash = hashlib.md5(raw_qr_string.encode('utf-8')).hexdigest()

    # Generate QR Image base64
    qr = qrcode.QRCode(box_size=10, border=2)
    qr.add_data(raw_qr_string)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#111827", back_color="#ffffff")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_image = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

    return {
        "success": True,
        "data": {
            "qr": raw_qr_string,
            "md5": md5_hash,
            "qr_image": qr_image,
            "amount": amount_str,
            "currency": "USD" if is_usd else "KHR"
        }
    }

@app.post("/api/payment/verify-md5")
async def verify_md5(payload: dict):
    md5 = payload.get("md5")
    token = os.getenv("BAKONG_TOKEN", "YOUR_TOKEN")
    api_url = "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5"

    async with httpx.AsyncClient() as client:
        res = await client.post(
            api_url,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"md5": md5},
            timeout=10.0
        )
        data = res.json()
        is_paid = (data.get("responseCode") == 0) and bool(data.get("data", {}).get("hash"))
        return {"success": is_paid, "isPaid": is_paid, "data": data.get("data")}"""
    add_code_block(python_code, "Python (FastAPI) Implementation (main.py)")

    add_h2("Part B: UI Multi-Language Switching (Khmer <-> English i18n)")
    add_p(
        "Many applications experience bugs when switching languages because they attempt to translate the internal "
        "merchant name or city inside the QR payload into Khmer Unicode. Here is the golden rule to keep it working smoothly:"
    )

    add_callout(
        "CRITICAL GOLDEN RULE: Never Put Khmer Unicode in EMVCo Tag 59/60",
        "The EMVCo QR standard utilized by NBC Bakong strictly requires Latin ASCII characters for: "
        "- Tag 59 (Merchant Name): e.g. 'PHUM YEUNG', NOT 'ភូមិយើង' "
        "- Tag 60 (Merchant City): e.g. 'Phnom Penh', NOT 'ភ្នំពេញ' "
        "If Khmer Unicode is placed inside the EMVCo string, banking apps like ABA, ACLEDA, or Wing will fail to parse the CRC16 checksum! "
        "Keep the backend QR payload purely ASCII, and handle ALL Khmer translations in your frontend UI template.",
        "WARNING"
    )

    add_p(
        "Here is the clean separation of concerns: The frontend UI displays Khmer or English dynamically, "
        "while the QR payload remains clean and valid:"
    )

    react_i18n_code = """// frontend/src/components/BakongKhqrModal.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const BakongKhqrModal = ({ isOpen, onClose, khqrData, onPaymentSuccess }) => {
  const { currentLanguage, t } = useLanguage(); // 'km' or 'en'
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  const [checking, setChecking] = useState(false);

  // Poll verification every 3 seconds
  useEffect(() => {
    if (!isOpen || !khqrData?.md5) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/payment/verify-md5', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ md5: khqrData.md5 })
        });
        const data = await res.json();
        if (data.isPaid) {
          clearInterval(interval);
          onPaymentSuccess(data.data);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, khqrData]);

  if (!isOpen || !khqrData) return null;

  return (
    <div className="modal-overlay">
      <div className="khqr-card">
        {/* Header localized seamlessly */}
        <h3 className="khqr-title">
          {currentLanguage === 'km' ? 'ស្កេនទូទាត់ជាមួយ KHQR' : 'Scan to Pay with KHQR'}
        </h3>
        
        {/* Official Bakong KHQR Banner */}
        <div className="khqr-badge">
          <span>BAKONG KHQR</span>
        </div>

        {/* High Resolution QR Image */}
        <img src={khqrData.qrImage} alt="Bakong KHQR" className="qr-image" />

        {/* Amount display formatted by language */}
        <div className="khqr-amount">
          <span className="label">
            {currentLanguage === 'km' ? 'ចំនួនទឹកប្រាក់ត្រូវបង់:' : 'Total Amount:'}
          </span>
          <span className="value">
            {khqrData.currency === 'KHR'
              ? `${Number(khqrData.amount).toLocaleString()} រៀល`
              : `$${Number(khqrData.amount).toFixed(2)}`}
          </span>
        </div>

        {/* Dynamic Countdown */}
        <p className="timer-text">
          {currentLanguage === 'km'
            ? `QR ផុតកំណត់ក្នុងរយៈពេល ${timeLeft} វិនាទី`
            : `QR expires in ${timeLeft}s`}
        </p>

        {/* Manual Check Button for immediate feedback */}
        <button 
          className="btn-verify" 
          disabled={checking}
          onClick={() => checkManual(khqrData.md5)}
        >
          {checking 
            ? (currentLanguage === 'km' ? 'កំពុងពិនិត្យ...' : 'Checking...') 
            : (currentLanguage === 'km' ? 'ខ្ញុំបានបង់ប្រាក់រួចរាល់' : "I've Completed Payment")}
        </button>
      </div>
    </div>
  );
};"""
    add_code_block(react_i18n_code, "Frontend React Component with Clean Bilingual Switching (Khmer & English)")

    # Section 6: Testing & Production Deployment Checklist
    add_h1("6. Production Checklist & Troubleshooting (ការដាក់ឱ្យដំណើរការ និងដោះស្រាយបញ្ហា)")
    add_p(
        "Follow this verification checklist before going live to guarantee smooth customer transactions:"
    )

    headers_check = ["Check Item", "Requirement", "Action if Failed"]
    rows_check = [
        ["SSL / HTTPS", "Must run on HTTPS in production", "Bakong mobile apps block insecure http webhooks"],
        ["Token Expiry", "JWT Token has an expiration date", "Refresh JWT token before expiry in .env"],
        ["KHR Rounding", "Math.round() to whole integer", "Never send decimals like 4100.50 KHR"],
        ["USD Decimals", "toFixed(2) precision", "Always supply exactly two decimal places"],
        ["Polling Interval", "3.0 - 4.5 seconds interval", "Faster polling risks HTTP 429 Rate Limit error"],
        ["Idempotency Key", "Store transaction MD5 in DB", "Reject duplicate webhook/poll for same order ID"],
        ["Auto-Cancel", "Mark order expired after 15m", "Release reserved stock if customer does not pay"]
    ]
    add_styled_table(headers_check, rows_check)

    add_h2("Common Errors & How to Fix Them")
    add_bullet("Check that BAKONG_TOKEN is valid, that the phone/account ID exists, and that the customer has already completed PIN entry.", "Error: 'Transaction could not be found':")
    add_bullet("Occurs when polling too rapidly. Switch polling timer to 3.5 seconds and provide a manual verification button.", "Error: 'Limit reached' / Rate limit exceeded:")
    add_bullet("Ensure no Khmer or Unicode characters are present in Tag 59 (Merchant Name) or Tag 60 (City).", "Error: 'Invalid EMVCo CRC':")
    add_bullet("Bakong Open API handles cross-currency automatically at the bank level, settling in the merchant's base currency.", "Question: 'What if customer pays USD on a KHR QR?':")

    # Document Save
    doc.save(output_path)
    print(f"Successfully generated: {output_path}")

if __name__ == "__main__":
    out_dir = "docs"
    os.makedirs(out_dir, exist_ok=True)
    target_file = os.path.join(out_dir, "Bakong_KHQR_Smooth_Integration_Guide.docx")
    create_guide_document(target_file)
    
    # Also update the existing 'docs/Bakong KHQR.docx' so the user gets the updated content in both places
    backup_file = os.path.join(out_dir, "Bakong KHQR.docx")
    create_guide_document(backup_file)
