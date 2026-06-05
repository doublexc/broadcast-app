import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxwwY9wGhi4-oiLZS5l9d0U8Qa2bHSgcVT0aZOjs_S9sZGa90z_HE1w0YTst_53-jvV/exec";

export default function GuestPortal() {
  const { token } = useParams();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // State ใหม่สำหรับแกลเลอรีและ Lock
  const [guestInfo, setGuestInfo] = useState({ id: '', name: '' });
  const [images, setImages] = useState([]);
  const [activeLock, setActiveLock] = useState(null);

  useEffect(() => {
    const fetchGuestData = async () => {
      try {
        const response = await fetch(GAS_WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'getGuestData', payload: { token } })
        });
        const data = await response.json();
        if (data.success) {
          setGuestInfo({ id: data.guestId, name: data.guestName });
          setImages(data.images);
          setActiveLock(data.activeLock);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    fetchGuestData();
    const intervalId = setInterval(fetchGuestData, 2000);
    return () => clearInterval(intervalId);
  }, [token]);

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));

  const handleUpload = async () => {
    if (files.length === 0) return alert("Please select images first.");
    setUploading(true);
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target.result.split(',')[1];
        await fetch(GAS_WEB_APP_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'uploadRawImage',
            payload: { token, mimeType: file.type, data: base64Data }
          })
        });
      };
      reader.readAsDataURL(file);
    }
    alert("Upload complete!");
    setUploading(false);
    setFiles([]); 
  };

  const handleLockImage = async (imageId) => {
    if (activeLock) return; // ถ้าล็อกอยู่แล้วกดไม่ได้
    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'setLock', payload: { token, imageId } })
      });
    } catch (error) {
      console.error("Lock error:", error);
    }
  };

  // --- หน้าจอเมื่อมีการล็อก (Locked Screen) ---
  if (activeLock) {
    const isMyLock = activeLock.guestId === guestInfo.id;
    return (
      <div style={{ padding: '2rem', textAlign: 'center', background: isMyLock ? '#d4edda' : '#f8d7da', minHeight: '100vh' }}>
        <h1 style={{ color: isMyLock ? '#155724' : '#721c24', fontSize: '3rem', margin: '0' }}>
          {isMyLock ? 'YOUR SELECTION' : 'LOCKED'}
        </h1>
        <h2 style={{ marginTop: '1rem' }}>
          {isMyLock ? 'You selected this image.' : `Selected By: ${activeLock.guestName}`}
        </h2>
        <p>Please wait for staff.</p>
        
        {/* แสดงภาพที่ถูกล็อก (ดึงภาพจาก Google Drive) */}
        <div style={{ marginTop: '2rem' }}>
          {images.filter(img => img.imageId === activeLock.imageId).map(img => (
            <img 
              key={img.imageId} 
              src={`https://drive.google.com/thumbnail?id=${img.fileId}&sz=w1000`} 
              alt="Locked" 
              style={{ maxWidth: '100%', border: '5px solid #333', borderRadius: '8px' }} 
            />
          ))}
        </div>
      </div>
    );
  }

  // --- หน้าจอปกติ (Upload + Gallery) ---
  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>Welcome, {guestInfo.name}</h2>
      
      <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>1. Send New Image</h3>
        <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ marginBottom: '1rem', width: '100%' }} />
        <button onClick={handleUpload} disabled={uploading} style={{ padding: '1rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', width: '100%', cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : 'Upload Images'}
        </button>
      </div>

      <div>
        <h3>2. Select Broadcast Image</h3>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Tap an image to show it on air.</p>
        
        {images.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '2rem 0' }}>No approved images yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {images.map(img => (
              <img 
                key={img.imageId} 
                src={`https://drive.google.com/thumbnail?id=${img.fileId}&sz=w1000`}
                alt="Approved"
                onClick={() => handleLockImage(img.imageId)}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}