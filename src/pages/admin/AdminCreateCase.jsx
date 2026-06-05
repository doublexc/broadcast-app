import React, { useState } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// อย่าลืมใส่ URL ของคุณกลับเข้าไปด้วยนะครับ
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxwwY9wGhi4-oiLZS5l9d0U8Qa2bHSgcVT0aZOjs_S9sZGa90z_HE1w0YTst_53-jvV/exec";
const FRONTEND_BASE_URL = window.location.origin;

export default function AdminCreateCase() {
  const [caseName, setCaseName] = useState('');
  const [mode, setMode] = useState('MODE_A');
  const [loading, setLoading] = useState(false);
  
  // เปลี่ยนจาก Fixed Array มาเป็น State ที่แก้ไขได้
  const [guests, setGuests] = useState(["Victim", "Lawyer", "Witness", "Opponent"]);
  const [newGuestName, setNewGuestName] = useState('');

  const handleAddGuest = () => {
    if (newGuestName.trim() === '') return;
    if (guests.includes(newGuestName.trim())) return alert("ชื่อแขกซ้ำกันครับ!");
    setGuests([...guests, newGuestName.trim()]);
    setNewGuestName('');
  };

  const handleRemoveGuest = (guestToRemove) => {
    setGuests(guests.filter(g => g !== guestToRemove));
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!caseName) return alert("Please enter Case Name");
    if (guests.length === 0) return alert("Please add at least one guest!");
    
    setLoading(true);
    try {
      const response = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'createCase',
          payload: { caseName, visibilityMode: mode, guests: guests }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await generateAndDownloadQRs(data);
        alert("Case created successfully! ZIP file is downloading.");
      }
    } catch (error) {
      console.error("Error creating case:", error);
      alert("Failed to create case.");
    } finally {
      setLoading(false);
    }
  };

  const generateAndDownloadQRs = async (data) => {
    const zip = new JSZip();

    const addQrToZip = async (filename, path) => {
      const fullUrl = `${FRONTEND_BASE_URL}/broadcast-app/#${path}`;
      const qrDataUrl = await QRCode.toDataURL(fullUrl, { width: 500, margin: 2 });
      const base64Data = qrDataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
      zip.file(`${filename}.png`, base64Data, { base64: true });
    };

    await addQrToZip("ADMIN", data.adminUrl);

    for (let guest of data.guests) {
      // ดัดแปลงชื่อไฟล์ให้รองรับอักขระพิเศษเผื่อพิมพ์ภาษาไทย
      const safeFilename = guest.guestName.replace(/[^a-zA-Z0-9ก-๙]/g, '_').toUpperCase();
      await addQrToZip(safeFilename, guest.url);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${data.caseId}-QRCodes.zip`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Create New Broadcast Case</h2>
      <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div>
          <label><strong>Case Name:</strong></label><br />
          <input 
            type="text" 
            value={caseName} 
            onChange={e => setCaseName(e.target.value)} 
            placeholder="e.g. Case-001"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          />
        </div>

        <div>
          <label><strong>Visibility Mode:</strong></label><br />
          <select 
            value={mode} 
            onChange={e => setMode(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          >
            <option value="MODE_A">Mode A (Guests see all approved images)</option>
            <option value="MODE_B">Mode B (Guests see ONLY their approved images)</option>
          </select>
        </div>

        {/* ส่วนจัดการรายชื่อแขกที่เพิ่มเข้ามาใหม่ */}
        <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
          <label><strong>Guest List:</strong></label>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              value={newGuestName} 
              onChange={e => setNewGuestName(e.target.value)} 
              placeholder="Add new guest name..."
              style={{ flex: 1, padding: '0.5rem' }}
            />
            <button 
              type="button" 
              onClick={handleAddGuest}
              style={{ padding: '0.5rem 1rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>

          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {guests.map(g => (
              <li key={g} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'white', marginBottom: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}>
                <span>{g}</span>
                <button 
                  type="button" 
                  onClick={() => handleRemoveGuest(g)}
                  style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.5rem' }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '1rem', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}
        >
          {loading ? 'Creating Case & Generating ZIP...' : 'Create Case'}
        </button>
      </form>
    </div>
  );
}