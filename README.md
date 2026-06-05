# Broadcast App 📺

ระบบจัดการคิวภาพออกอากาศสดแบบเรียลไทม์ สำหรับลดข้อผิดพลาดในการสื่อสารระหว่างทีมงาน (Admin) และแขกรับเชิญ (Guest) ระหว่างการถ่ายทำรายการสด

---

## ✨ ความสามารถหลัก

### 👨‍💻 สำหรับทีมงาน (Admin)
- **Case Management** — สร้างห้องสำหรับแต่ละคิวรายการสด พร้อมตั้งค่าโหมดการมองเห็นภาพ
- **Auto QR Code** — สร้าง QR Code แยกรายบุคคล ดาวน์โหลดเป็น `.zip` ได้ทันที
- **Image Approval** — อัปโหลดภาพที่ผ่านการตกแต่งแล้วกลับเข้าระบบ
- **Live Dashboard** — ตรวจสอบสถานะการเลือกภาพแบบเรียลไทม์ (Polling ทุก 2 วินาที)
- **Lock & Release** — เมื่อแขกเลือกภาพ ระบบแสดงสถานะ **LOCKED 🔴** พร้อมปุ่มปลดล็อก

### 📱 สำหรับแขกรับเชิญ (Guest)
- **สแกน QR** — เข้าสู่หน้า Portal ส่วนตัวผ่านมือถือได้ทันที ไม่ต้องติดตั้งแอป
- **อัปโหลดรูปดิบ** — ส่งภาพจากอัลบั้มมือถือเข้าระบบโดยตรง
- **แกลเลอรีส่วนตัว** — ดูภาพที่ผ่านการอนุมัติแล้ว
- **One-Tap Select** — กดภาพเพื่อส่งสัญญาณขึ้นจอออกอากาศสด

---

## 🛠️ Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 19, Vite, React Router DOM (HashRouter) |
| Backend | Google Apps Script (GAS) |
| Database | Google Sheets |
| File Storage | Google Drive |
| Deployment | GitHub Pages |

---

## 🚀 วิธีติดตั้ง (Setup Guide)

> ⏱️ ใช้เวลาประมาณ 20–30 นาที ทำครั้งเดียว ใช้ได้ตลอด

### สิ่งที่ต้องมีก่อนเริ่ม
- บัญชี Google (Gmail)
- บัญชี GitHub
- Node.js ติดตั้งอยู่ในเครื่อง ([ดาวน์โหลดที่นี่](https://nodejs.org))

---

### ขั้นที่ 1 — เตรียม Google Drive

1. เปิด [Google Drive](https://drive.google.com)
2. กด **+ ใหม่** → **โฟลเดอร์** → ตั้งชื่อว่า `Cases` (หรือชื่ออื่นก็ได้)
3. เปิดโฟลเดอร์ที่สร้าง → ดู URL ในแถบที่อยู่ของเบราว์เซอร์

   ```
   https://drive.google.com/drive/folders/1rhzJcHRgWYfcXF1koKR33vGMYtlzObMF
                                          ↑ ส่วนนี้คือ Folder ID
   ```

4. **คัดลอก Folder ID เก็บไว้** จะใช้ในขั้นถัดไป

---

### ขั้นที่ 2 — เตรียม Google Sheets

1. เปิด [Google Sheets](https://sheets.google.com) → สร้าง Spreadsheet ใหม่เปล่า ๆ
2. ตั้งชื่อ Spreadsheet เป็นอะไรก็ได้ เช่น `Broadcast App DB`
3. สร้าง Sheet ให้ครบ **5 แผ่น** โดยกด **+** ที่มุมล่างซ้าย แล้วตั้งชื่อตามนี้ทุกตัวอักษร:

   | ชื่อ Sheet | หน้าที่ |
   |---|---|
   | `Cases` | เก็บข้อมูลห้องรายการ |
   | `Guests` | เก็บข้อมูลแขกรับเชิญ |
   | `RawImages` | เก็บประวัติรูปดิบที่แขกอัปโหลด |
   | `BroadcastImages` | เก็บรูปที่ Admin อนุมัติแล้ว |
   | `Locks` | เก็บสถานะการล็อกภาพ |

4. ใส่ header row ในแต่ละ Sheet โดย Import ไฟล์ `.csv` จากโฟลเดอร์ `sheets/` ในโปรเจกต์นี้

   **วิธี Import:**
   - เลือก Sheet ที่ต้องการ เช่น `Cases`
   - ไปที่เมนู **ไฟล์ → นำเข้า → อัปโหลด**
   - เลือกไฟล์ `sheets/Cases.csv`
   - ตั้งค่า Import location เป็น **"แทนที่ชีตปัจจุบัน"**
   - กด **นำเข้าข้อมูล**
   - ทำซ้ำกับทุก Sheet จนครบทั้ง 5

---

### ขั้นที่ 3 — ติดตั้ง Google Apps Script

1. ใน Google Sheets ที่สร้างไว้ ไปที่เมนู **ส่วนขยาย → Apps Script**
2. จะเปิดหน้าต่างใหม่ ลบโค้ดเดิมทั้งหมดออก
3. เปิดไฟล์ `gas/Code.gs` จากโปรเจกต์นี้ → คัดลอกโค้ดทั้งหมด → วางในหน้า Apps Script
4. แก้บรรทัดแรก: เปลี่ยน `"วาง-FOLDER-ID-ของคุณตรงนี้"` เป็น Folder ID ที่คัดลอกไว้จากขั้นที่ 1

   ```js
   const ROOT_FOLDER_ID = "1rhzJcHRgWYfcXF1koKR33vGMYtlzObMF"; // ← ใส่ของคุณตรงนี้
   ```

5. กด **บันทึก** (Ctrl+S)
6. Deploy เป็น Web App:
   - กด **Deploy** → **New deployment**
   - กดไอคอน ⚙️ ข้าง "Select type" → เลือก **Web app**
   - ตั้งค่าดังนี้:
     - Description: `Broadcast App`
     - Execute as: **Me**
     - Who has access: **Anyone**
   - กด **Deploy**
   - ระบบจะขอ Permission → กด **Authorize access** → เลือกบัญชี Google → กด **Allow**
   - **คัดลอก Web App URL เก็บไว้** (จะขึ้นว่า `https://script.google.com/macros/s/...`)

---

### ขั้นที่ 4 — ตั้งค่า Frontend

1. Clone หรือดาวน์โหลด repo นี้มาไว้ในเครื่อง
2. สร้างไฟล์ `.env` ที่ root ของโปรเจกต์ (ข้าง ๆ ไฟล์ `package.json`)
3. ใส่เนื้อหาดังนี้:

   ```env
   VITE_GAS_URL=วาง-Web-App-URL-ตรงนี้
   ```

   ตัวอย่าง:
   ```env
   VITE_GAS_URL=https://script.google.com/macros/s/AKfycbxxxxxxxx/exec
   ```

---

### ขั้นที่ 5 — Deploy ขึ้น GitHub Pages

เปิด Terminal (หรือ Command Prompt) ที่โฟลเดอร์โปรเจกต์ แล้วรันคำสั่งตามลำดับ:

```bash
# ติดตั้ง dependencies
npm install

# Build และ Deploy ขึ้น GitHub Pages
npm run deploy
```

รอสักครู่ เมื่อเสร็จจะได้ URL ของเว็บที่ใช้งานได้จริง เช่น:
```
https://yourusername.github.io/broadcast-app/
```

---

## 📁 โครงสร้างโปรเจกต์

```
broadcast-app/
├── src/                  # React source code
├── public/               # Static assets
├── gas/
│   └── Code.gs           # Google Apps Script (Backend)
├── sheets/
│   ├── Cases.csv         # Template header สำหรับ Sheet: Cases
│   ├── Guests.csv        # Template header สำหรับ Sheet: Guests
│   ├── RawImages.csv     # Template header สำหรับ Sheet: RawImages
│   ├── BroadcastImages.csv
│   └── Locks.csv
├── .env                  # ไฟล์ config (ไม่ได้ commit เข้า repo)
└── package.json
```

---

## 🔄 การทำงานของระบบ

```
Admin สร้าง Case
    ↓
ระบบสร้างโฟลเดอร์ใน Drive + บันทึกลง Sheet + ออก QR Code
    ↓
Guest สแกน QR → อัปโหลดรูปดิบเข้าโฟลเดอร์ raw/
    ↓
Admin แต่งรูปเสร็จ → อัปโหลดเข้าโฟลเดอร์ broadcast/
    ↓
Guest เห็นรูปตัวเอง → กดเลือก → ระบบ LOCK
    ↓
Admin Dashboard เห็น LOCKED 🔴 → สั่งออกอากาศ → กด Release
```

---

## ❓ แก้ปัญหาเบื้องต้น

**ปัญหา: กด Deploy แล้วขึ้น Error "Script function not found"**
→ ตรวจสอบว่าบันทึกโค้ดใน Apps Script แล้ว และมีฟังก์ชัน `doPost` อยู่ในโค้ด

**ปัญหา: แขก Scan QR แล้วหน้าเว็บขึ้น Error**
→ ตรวจสอบว่าใส่ `VITE_GAS_URL` ถูกต้องในไฟล์ `.env` และ run `npm run deploy` ใหม่อีกครั้ง

**ปัญหา: อัปโหลดรูปไม่ได้ ขึ้น "Invalid token"**
→ ตรวจสอบว่า Import CSV ครบทั้ง 5 Sheet และชื่อ Sheet ตรงตามที่กำหนดทุกตัวอักษร

**ปัญหา: Deploy GAS แล้ว ระบบยังใช้โค้ดเก่าอยู่**
→ ต้อง Deploy ใหม่ทุกครั้งที่แก้โค้ด (New Deployment) ไม่ใช่แค่บันทึก
