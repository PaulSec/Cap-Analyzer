import { useDropzone } from 'react-dropzone';

interface UploadDropZoneProps {
  onFile: (file: File) => void;
  busy?: boolean;
}

export function UploadDropZone({ onFile, busy }: UploadDropZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    disabled: busy,
    accept: {
      'application/vnd.tcpdump.pcap': ['.pcap'],
      'application/octet-stream': ['.pcap', '.pcapng']
    },
    onDropAccepted: (files) => {
      if (files[0]) onFile(files[0]);
    }
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: '2px dashed #8aa5c8',
        borderRadius: 12,
        padding: 20,
        textAlign: 'center',
        background: isDragActive ? '#e8f2ff' : '#f9fbff',
        cursor: busy ? 'not-allowed' : 'pointer',
        color: '#34455f'
      }}
    >
      <input {...getInputProps()} />
      <strong>Drag & drop .pcap / .pcapng here</strong>
      <div style={{ marginTop: 8, fontSize: 13 }}>or click to choose a capture file</div>
    </div>
  );
}
