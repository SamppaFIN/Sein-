import { useState } from 'react';

export function InfoButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 10001,
          width: 32,
          height: 32,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(20,20,40,0.85)',
          backdropFilter: 'blur(12px)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
        title="Tietoa Seinästä"
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        }}
      >
        ?
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(20,20,40,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '32px 36px',
              maxWidth: 420,
              width: '90vw',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 14,
              lineHeight: 1.6,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: '#fff' }}>⚡ Tietoa Seinästä</h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <p>
              <strong>Seinä</strong> on anonyymi julkinen ilmoitustaulu. Kuka tahansa voi jättää
              viestin — kukaan ei tiedä kuka sen kirjoitti.
            </p>

            <ul style={{ paddingLeft: 20, margin: '16px 0', color: 'rgba(255,255,255,0.7)' }}>
              <li style={{ marginBottom: 8 }}>🔒 <strong>Ei kirjautumista</strong> — et tarvitse tiliä</li>
              <li style={{ marginBottom: 8 }}>👻 <strong>Ei seurantaa</strong> — IP-osoitteita ei tallenneta</li>
              <li style={{ marginBottom: 8 }}>🕐 <strong>Viestit haalistuvat</strong> — vanhat viestit katoavat hiljalleen</li>
              <li style={{ marginBottom: 8 }}>✏️ <strong>5 minuutin muokkausaika</strong> — vain juuri jättämääsi viestiä voi muokata</li>
              <li style={{ marginBottom: 8 }}>🏷️ <strong>#tagit</strong> — kirjoita hashtageja viestiin, niin ne löytyvät helpommin</li>
            </ul>

            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 16, textAlign: 'center' }}>
              Seinä kuuntelee, Seinä näyttää, Seinä unohtaa.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
