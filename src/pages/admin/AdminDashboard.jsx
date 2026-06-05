import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// อย่าลืมใส่ URL ของคุณ!
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxwwY9wGhi4-oiLZS5l9d0U8Qa2bHSgcVT0aZOjs_S9sZGa90z_HE1w0YTst_53-jvV/exec";
export default function AdminDashboard() {
  const { caseId } = useParams();
  const [guests, setGuests] = useState([]);
  const [images, setImages] = useState([]);
  const [activeLock, setActiveLock] = useState(null); // เพิ่ม State รับค่า Lock
  const [uploading, setUploading] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(GAS_WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'getDashboardData', payload: { caseId } })
        });
        const data = await response.json();
        if (data.success) {
          setGuests(data.guests);
          setImages(data.approvedImages);
          setActiveLock(data.activeLock); // อัปเดตสถานะล็อก
          if (!selectedGuestId && data.guests.length > 0) {
            setSelectedGuestId(data.guests[0].guestId);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    fetchData(); 
    const intervalId = setInterval(fetchData, 2000); 
    return () => clearInterval(intervalId);
  }, [caseId, selectedGuestId]);

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));

  const handleUpload = async () => {
    if (files.length === 0) return alert("Please select images.");
    if (!selectedGuestId) return alert("Please select an owner for these images.");
    
    setUploading(true);
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result.split(',')[1];
        await fetch(GAS_WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'uploadBroadcastImage',
            payload: { caseId, ownerGuestId: selectedGuestId, mimeType: file.type, data: base64Data }
          })
        });
      };
      reader.readAsDataURL(file);
    }
    
    alert("Approved images uploaded successfully!");
    setUploading(false);
    setFiles([]);
  };

  // ฟังก์ชันยิงคำสั่งปลดล็อก
  const handleReleaseLock = async () => {
    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'releaseLock', payload: { caseId } })
      });
      // ไม่ต้องทำอะไรเพิ่ม เดี๋ยว Polling รอบถัดไป (ภายใน 2 วิ) จะอัปเดตหน้าจอให้เอง
    } catch (error) {
      console.error("Release lock error:", error);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Admin Dashboard: {caseId}</h2>
      
      {/* ส่วนแสดงสถานะการล็อกของรายการสด (Live Status) */}
      <div style={{ background: activeLock ? '#f8d7da' : '#d4edda', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: `2px solid ${activeLock ? '#dc3545' : '#28a745'}` }}>
        <h3 style={{ margin: '0 0 1rem 0', color: activeLock ? '#721c24' : '#155724' }}>
          Live Broadcast Status: {activeLock ? 'LOCKED 🔴' : 'STANDBY 🟢'}
        </h3>
        
        {activeLock ? (
          <div>
            <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Selected by: {activeLock.guestName}</p>
		<p style={{ fontFamily: 'monospace', color: '#666' }}>Image ID: {activeLock.imageId}</p>
            {(() => {
              const lockedImage = images.find(img => img.imageId === activeLock.imageId);
              return lockedImage ? (
                <div style={{ margin: '1rem 0', textAlign: 'center' }}>
                  <img 
                    src={`https://drive.google.com/thumbnail?id=${lockedImage.fileId}&sz=w800`} 
                    alt="Locked Broadcast" 
                    style={{ maxWidth: '100%', maxHeight: '400px', border: '4px solid #dc3545', borderRadius: '8px', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <p>Image ID: {activeLock.imageId}</p>
              );
            })()}
            <button 
              onClick={handleReleaseLock}
              style={{ padding: '0.8rem 1.5rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' }}
            >
              Unlock / Release for Next Image
            </button>
          </div>
        ) : (
          <p>Waiting for guests to select an image...</p>
        )}
      </div>

      {/* ส่วนอัปโหลดรูป (อันเดิม) */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>Upload Approved Images</h3>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <select 
            value={selectedGuestId} 
            onChange={e => setSelectedGuestId(e.target.value)}
            style={{ padding: '0.5rem', flex: 1 }}
          >
            {guests.map(g => (
              <option key={g.guestId} value={g.guestId}>Owner: {g.guestName}</option>
            ))}
          </select>
          <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ flex: 2 }} />
        </div>
        <button 
          onClick={handleUpload} disabled={uploading}
          style={{ width: '100%', padding: '1rem', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.1rem', cursor: 'pointer' }}
        >
          {uploading ? 'Uploading to Broadcast...' : 'Upload Approved Images'}
        </button>
      </div>

      <div>
        <h3>System Status</h3>
        <p>Total Approved Images in system: {images.length}</p>
        <p style={{ color: 'green' }}>🟢 Live Polling Active (Updates every 2s)</p>
      </div>
    </div>
  );
}