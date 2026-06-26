import { css } from 'remix/ui'

import { CryptoApp } from '../assets/crypto-app.tsx'
import { COLORS, FONT_STACK } from '../assets/theme.ts'
import { Document } from './document.tsx'

export function HomePage() {
  return () => (
    <Document title="Secret Ink">
      <main
        mix={css({
          '& *, & *::before, & *::after': { boxSizing: 'border-box' },
          margin: 0,
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'stretch',
          fontFamily: FONT_STACK,
          color: '#0d1b2a',
          background: `radial-gradient(circle at 15% 20%, ${COLORS.cyan}22, transparent 55%), radial-gradient(circle at 85% 30%, ${COLORS.yellow}22, transparent 55%), radial-gradient(circle at 50% 100%, ${COLORS.orange}22, transparent 55%), linear-gradient(135deg, #f4f8ff 0%, #eaf1fb 100%)`,
          '@media (max-width: 900px)': {
            flexDirection: 'column',
          },
        })}
      >
        <section
          mix={css({
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '24px',
            padding: '48px',
            '@media (max-width: 900px)': {
              alignItems: 'center',
              textAlign: 'center',
              padding: '48px 24px 24px',
            },
          })}
        >
          <span
            aria-hidden="true"
            mix={css({
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              color: '#ffffff',
              background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.cyan})`,
              boxShadow: `0 12px 30px ${COLORS.slate}55`,
            })}
          >
            🔒
          </span>

          <h1
            mix={css({
              margin: 0,
              fontSize: 'clamp(44px, 6vw, 80px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              background: `linear-gradient(120deg, ${COLORS.blue}, ${COLORS.cyan}, ${COLORS.orange})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            })}
          >
            Secret Ink
          </h1>

          <p
            mix={css({
              margin: 0,
              fontSize: 'clamp(16px, 1.6vw, 19px)',
              lineHeight: 1.6,
              color: COLORS.slate,
              maxWidth: '440px',
            })}
          >
            A message encryption app. Write your words in invisible ink: turn any
            message into secure, unreadable ciphertext and share it with confidence,
            knowing only the right key can reveal it.
          </p>

          <ol
            mix={css({
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontSize: '15px',
              lineHeight: 1.5,
              color: COLORS.ink,
              maxWidth: '440px',
            })}
          >
            <li>1. Pick who the message is From and who it is To.</li>
            <li>2. Type your message and press Encrypt to get secure text.</li>
            <li>3. Share it, then use Decrypt to read it back.</li>
          </ol>

          <div
            aria-hidden="true"
            mix={css({ display: 'flex', gap: '10px', marginTop: '4px' })}
          >
            {[COLORS.blue, COLORS.cyan, COLORS.yellow, COLORS.orange, COLORS.slate].map(
              (color) => (
                <span
                  mix={css({ width: '14px', height: '14px', borderRadius: '999px' })}
                  style={{ background: color }}
                />
              ),
            )}
          </div>
        </section>

        <section
          mix={css({
            flex: '1 1 50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
            borderLeft: `1px solid ${COLORS.slate}22`,
            '@media (max-width: 900px)': {
              borderLeft: 'none',
              padding: '0 24px 48px',
            },
          })}
        >
          <CryptoApp />
        </section>
      </main>
    </Document>
  )
}
