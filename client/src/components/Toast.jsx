import { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, onConfirm, duration = 0, confirmText = 'OK', cancelText = 'Cancel' }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return { bg: '#dcfce7', color: '#166534', border: '#86efac', icon: '✓' };
            case 'error':
                return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: '✕' };
            case 'warning':
                return { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', icon: '⚠' };
            default:
                return { bg: '#dbeafe', color: '#1e3a8a', border: '#93c5fd', icon: 'ℹ' };
        }
    };

    const styles = getTypeStyles();

    return (
        <>
            {/* Overlay */}
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9998,
                    animation: 'fadeInOverlay 0.2s ease-out'
                }}
                onClick={onClose}
            />
            
            {/* Modal */}
            <div 
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999,
                    backgroundColor: 'white',
                    borderRadius: '1rem',
                    padding: '2rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    minWidth: '320px',
                    maxWidth: '500px',
                    animation: 'scaleIn 0.2s ease-out'
                }}
            >
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: styles.bg,
                        border: `2px solid ${styles.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: styles.color,
                        fontWeight: 'bold',
                        flexShrink: 0
                    }}>
                        {styles.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ 
                            margin: '0 0 0.5rem 0', 
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: '#1e293b'
                        }}>
                            {type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Info'}
                        </h3>
                        <p style={{ 
                            margin: 0, 
                            color: '#64748b',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                        }}>
                            {message}
                        </p>
                    </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    {onConfirm ? (
                        <>
                            <button
                                onClick={onClose}
                                style={{
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    padding: '0.625rem 1.5rem',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                style={{
                                    backgroundColor: type === 'error' || type === 'warning' ? '#ef4444' : '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    padding: '0.625rem 1.5rem',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                                onMouseOut={(e) => e.target.style.opacity = '1'}
                            >
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            style={{
                                backgroundColor: type === 'error' ? '#ef4444' : '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.625rem 1.5rem',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.opacity = '0.9'}
                            onMouseOut={(e) => e.target.style.opacity = '1'}
                        >
                            OK
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default Toast;
