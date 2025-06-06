import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FiDownload } from 'react-icons/fi';

export default function ExportButton() {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('json');

  const handleExport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_export_data')
        .select('*');

      if (error) throw error;

      let output;
      if (format === 'json') {
        output = JSON.stringify(data, null, 2);
        downloadFile(output, 'journal-export.json', 'application/json');
      } else {
        const headers = Object.keys(data[0]).join(',');
        const csv = data.map(row => 
          Object.values(row).map(field => 
            `"${field?.toString().replace(/"/g, '""') || ''}"`
          ).join(',')
        ).join('\n');
        output = `${headers}\n${csv}`;
        downloadFile(output, 'journal-export.csv', 'text/csv');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex items-center space-x-2">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        className="px-2 py-1 border rounded"
      >
        <option value="json">JSON</option>
        <option value="csv">CSV</option>
      </select>
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        <FiDownload className="mr-1" />
        {loading ? 'Exporting...' : 'Export Data'}
      </button>
    </div>
  );
}
