import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/context/ToastContext';
import { UploadCloud, X, CheckCircle } from 'lucide-react';

export default function BulkUploadModal({ onClose, onSuccess }) {
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('lead'); // 'lead' or 'customer'
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to json
        const data = XLSX.utils.sheet_to_json(worksheet);
        setPreviewData(data.slice(0, 5)); // Preview first 5 rows
      } catch (error) {
        console.error('Error reading file:', error);
        addToast('Invalid file format', 'error');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      addToast('Please select a file first', 'error');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const binaryStr = event.target.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);

          if (data.length === 0) {
            addToast('The file is empty', 'error');
            setIsUploading(false);
            return;
          }

          const response = await fetch('/api/leads/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              leads: data,
              isCustomer: uploadType === 'customer'
            }),
          });

          const result = await response.json();
          if (response.ok) {
            addToast(`Successfully imported ${result.count} records`, 'success');
            onSuccess();
          } else {
            addToast(result.error || 'Failed to import', 'error');
          }
        } catch (error) {
          console.error(error);
          addToast('Error processing file', 'error');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      setIsUploading(false);
      addToast('Error uploading file', 'error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h3 className="modal-title">Bulk Upload</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ padding: '24px' }}>
          
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Upload As</label>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  type="radio" 
                  name="uploadType" 
                  value="lead" 
                  checked={uploadType === 'lead'} 
                  onChange={() => setUploadType('lead')} 
                />
                Lead
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  type="radio" 
                  name="uploadType" 
                  value="customer" 
                  checked={uploadType === 'customer'} 
                  onChange={() => setUploadType('customer')} 
                />
                Customer (Client)
              </label>
            </div>
          </div>

          <div style={{
            border: '2px dashed var(--border)',
            borderRadius: 8,
            padding: '40px 20px',
            textAlign: 'center',
            marginBottom: 20,
            background: 'var(--bg-secondary)',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <input 
              type="file" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              onChange={handleFileUpload} 
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'
              }}
            />
            {!file ? (
              <>
                <UploadCloud size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Click or drag file to this area to upload</p>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files.</p>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Expected columns: Sr. No., Name, Address, City, Pan Number, Email, Mobile, Pincode, Date Of Birth</p>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={48} style={{ color: 'var(--success)' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>{file.name}</p>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={(e) => { e.preventDefault(); setFile(null); setPreviewData([]); }}
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  Remove File
                </button>
              </div>
            )}
          </div>

          {previewData.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: 8 }}>Data Preview (first 5 rows)</h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="sheet-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>City</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={i}>
                        <td>{row.Name || '—'}</td>
                        <td>{row.Mobile || '—'}</td>
                        <td>{row.Email || '—'}</td>
                        <td>{row.City || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-outline" onClick={onClose} disabled={isUploading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
