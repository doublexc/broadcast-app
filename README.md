# Broadcast App 📺 (Line 3: PRISM OF DREAMS)

ระบบจัดการคิวภาพออกอากาศสดแบบเรียลไทม์ (Real-time Broadcast Image Management System) ที่ออกแบบมาเพื่อลดข้อผิดพลาดในการสื่อสารระหว่างทีมงาน (Admin) และแขกรับเชิญ (Guest) ระหว่างการถ่ายทำรายการสด

## ✨ Features (ความสามารถหลัก)

### 👨‍💻 สำหรับทีมงาน (Admin)
- **Case Management:** สร้างห้องสำหรับแต่ละคิวรายการสด พร้อมตั้งค่าโหมดการมองเห็น (Visibility Mode) ของภาพ
- **Auto QR Code Generation:** สร้างรหัส QR Code แบบแยกรายบุคคล (พร้อมลิงก์ที่ถูกต้อง) และดาวน์โหลดเป็นไฟล์ `.zip` อัตโนมัติ
- **Image Approval System:** อัปโหลดภาพที่ผ่านการตกแต่งแล้ว (Broadcast Images) กลับเข้าสู่ระบบและระบุความเป็นเจ้าของ
- **Live Status Monitor:** หน้า Dashboard ตรวจสอบสถานะการเลือกภาพของแขกแบบเรียลไทม์ (Polling ทุก 2 วินาที)
- **Global Lock & Release:** เมื่อแขกเลือกภาพ ระบบจะขึ้นสถานะ **LOCKED 🔴** พร้อมแสดงภาพให้ Admin เห็นทันที และมีปุ่มกดปลดล็อก (Release) เพื่อสวิตช์ภาพต่อไป

### 📱 สำหรับแขกรับเชิญ (Guest)
- **Seamless Mobile Access:** สแกน QR Code เพื่อเข้าสู่หน้า Portal ส่วนตัวผ่านมือถือได้ทันที
- **Raw Image Upload:** อัปโหลดไฟล์ภาพดิบเข้าสู่ระบบ (Google Drive) ได้โดยตรงจากอัลบั้มในมือถือ
- **Personalized Gallery:** ดูภาพที่ได้รับการอนุมัติแล้ว (ใช้ Thumbnail API เพื่อการโหลดที่รวดเร็ว)
- **One-Tap Selection:** กดคลิกที่ภาพเพื่อสั่งล็อกและส่งสัญญาณขึ้นจอออกอากาศสด

## 🛠️ Tech Stack (เทคโนโลยีที่ใช้)

* **Frontend:** React.js (Vite), React Router DOM (HashRouter สำหรับ GitHub Pages)
* **Backend / API:** Google Apps Script (GAS) `doPost`
* **Database:** Google Sheets (บันทึกข้อมูล Cases, Guests, Images, และ Locks)
* **File Storage:** Google Drive API
* **Deployment:** GitHub Pages
* **Key Libraries:** `qrcode` (สร้างคิวอาร์โค้ด), `jszip` (รวมไฟล์), `file-saver` (ดาวน์โหลดไฟล์)

## 🚀 How it Works (สถาปัตยกรรมการทำงาน)

1. **Admin** สร้าง Case ใหม่ -> ระบบบันทึกลง Google Sheets และสร้างโฟลเดอร์ใน Drive (`raw`, `broadcast`)
2. **Guest** เข้าสู่ระบบผ่าน Token พิเศษ -> อัปโหลดรูปดิบเข้าโฟลเดอร์ `raw`
3. **Admin** แต่งรูปเสร็จ -> อัปโหลดเข้าโฟลเดอร์ `broadcast`
4. **Guest** มองเห็นภาพตัวเองผ่าน Web App -> กดเลือกภาพ
5. **System** บันทึกสถานะลง Sheet `Locks`
6. **Admin Dashboard** ดึงข้อมูลสถานะล่าสุดมาแสดง -> สั่งออกอากาศภาพ -> กด Release เพื่อรอคิวต่อไป
