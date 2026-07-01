import { MessageSquare } from 'lucide-react';

export default function EmptyState({ message }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '64px 24px',
      textAlign:      'center',
    }}>
      <div style={{
        width:          56,
        height:         56,
        borderRadius:   12,
        background:     '#f3f4f6',
        border:         '1px solid #e5e7eb',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        marginBottom:   14,
      }}>
        <MessageSquare size={22} color="#9ca3af" />
      </div>
      <p style={{ fontSize: 14, color: '#57606a' }}>{message}</p>
    </div>
  );
}
