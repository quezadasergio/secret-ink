import { addEventListeners, clientEntry, css, on, type Handle } from 'remix/ui'

import { COUNTRY_CODES, flagEmoji } from './country-codes.ts'
import { decrypt, encrypt } from './crypto.ts'
import { COLORS, FONT_STACK } from './theme.ts'

const FIELD_TYPES = ['Name', 'Nick Name', 'Email', 'Phone Number'] as const
type FieldType = (typeof FIELD_TYPES)[number]

type Tab = 'encrypt' | 'decrypt'
type CopyTarget = 'encrypt' | 'decrypt'

export const CryptoApp = clientEntry(import.meta.url, function CryptoApp(handle: Handle) {
  let activeTab: Tab = 'encrypt'

  // Selected identity type per party. Only the type needs to trigger a
  // re-render (to show/hide fields); the text values are read from the form
  // on submit so typing never causes a re-render.
  let encFromType: FieldType = 'Name'
  let encToType: FieldType = 'Name'
  let decFromType: FieldType = 'Name'
  let decToType: FieldType = 'Name'

  let encryptedOutput = ''
  let decryptedOutput = ''
  let decryptError = ''
  let copied: CopyTarget | '' = ''

  // When non-empty, a centered modal lists the fields that still need values.
  let missingFields: string[] = []

  // Close the validation modal with the Escape key. Guarded so it only runs in
  // the browser (the component setup also runs during server rendering, where
  // `window` does not exist).
  if (typeof window !== 'undefined') {
    addEventListeners(window, handle.signal, {
      keydown(event) {
        if (event.key === 'Escape' && missingFields.length > 0) {
          closeModal()
        }
      },
    })
  }

  function closeModal() {
    missingFields = []
    handle.update()
  }

  function selectTab(tab: Tab) {
    if (activeTab === tab) return
    activeTab = tab
    handle.update()
  }

  // Returns the human-readable labels of the required fields that are empty for
  // a given party, based on the currently selected identity type.
  function validateParty(data: FormData, prefix: string, type: FieldType, who: string): string[] {
    const value = (field: string) => String(data.get(`${prefix}-${field}`) ?? '').trim()
    const missing: string[] = []

    if (type === 'Name') {
      if (!value('firstName')) missing.push(`${who} — First Name`)
      if (!value('lastName')) missing.push(`${who} — Last Name`)
    } else if (type === 'Nick Name') {
      if (!value('nickName')) missing.push(`${who} — Nick Name`)
    } else if (type === 'Email') {
      if (!value('email')) missing.push(`${who} — Email`)
    } else if (type === 'Phone Number') {
      if (!value('phone')) missing.push(`${who} — Phone Number`)
    }

    return missing
  }

  // Builds the deterministic string used to derive the cipher key for a party.
  // It must produce the exact same value on Encrypt and Decrypt for matching
  // inputs, which is why all required data has to be re-entered to decrypt.
  function partyKey(data: FormData, prefix: string, type: FieldType): string {
    const value = (field: string) => String(data.get(`${prefix}-${field}`) ?? '').trim()

    if (type === 'Name') return value('firstName') + value('lastName')
    if (type === 'Nick Name') return value('nickName')
    if (type === 'Email') return value('email')
    return value('dial') + value('phone')
  }

  async function copy(text: string, target: CopyTarget) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      copied = target
      await handle.update()
      setTimeout(() => {
        copied = ''
        handle.update()
      }, 1500)
    } catch {
      /* clipboard not available */
    }
  }

  async function onEncryptSubmit(event: Event) {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const data = new FormData(form)

    const message = String(data.get('message') ?? '')
    const password = String(data.get('enc-password') ?? '')
    const missing = [
      ...validateParty(data, 'enc-from', encFromType, 'From'),
      ...validateParty(data, 'enc-to', encToType, 'To'),
    ]
    if (!password) missing.push('Password')
    if (!message.trim()) missing.push('Message')

    if (missing.length > 0) {
      missingFields = missing
      handle.update()
      return
    }

    const from = partyKey(data, 'enc-from', encFromType)
    const to = partyKey(data, 'enc-to', encToType)

    encryptedOutput = await encrypt(message, from, to, password)
    handle.update()
  }

  async function onDecryptSubmit(event: Event) {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const data = new FormData(form)

    const cipher = String(data.get('cipher') ?? '').trim()
    const password = String(data.get('dec-password') ?? '')
    const missing = [
      ...validateParty(data, 'dec-from', decFromType, 'From'),
      ...validateParty(data, 'dec-to', decToType, 'To'),
    ]
    if (!password) missing.push('Password')
    if (!cipher) missing.push('Encrypted text')

    if (missing.length > 0) {
      missingFields = missing
      handle.update()
      return
    }

    const from = partyKey(data, 'dec-from', decFromType)
    const to = partyKey(data, 'dec-to', decToType)

    // decrypt never throws: it returns the original message on success or a
    // deterministic decoy when the data/keys are wrong.
    decryptedOutput = await decrypt(cipher, from, to, password)
    decryptError = ''
    handle.update()
  }

  function renderParty(legend: string, idPrefix: string, type: FieldType, onType: (t: FieldType) => void) {
    return (
      <fieldset mix={fieldsetStyle}>
        <legend mix={legendStyle}>{legend}</legend>

        <div mix={fieldRowStyle}>
          <label mix={fieldStyle}>
            <span mix={labelStyle}>Identify by</span>
            <select
              name={`${idPrefix}-type`}
              value={type}
              mix={[controlStyle, on('change', (event) => onType(event.currentTarget.value as FieldType))]}
            >
              {FIELD_TYPES.map((option) => (
                <option value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        {type === 'Name' && (
          <div mix={fieldRowStyle}>
            <label mix={fieldStyle}>
              <span mix={labelStyle}>First Name</span>
              <input name={`${idPrefix}-firstName`} type="text" placeholder="First Name" mix={controlStyle} />
            </label>
            <label mix={fieldStyle}>
              <span mix={labelStyle}>Last Name</span>
              <input name={`${idPrefix}-lastName`} type="text" placeholder="Last Name" mix={controlStyle} />
            </label>
          </div>
        )}

        {type === 'Nick Name' && (
          <div mix={fieldRowStyle}>
            <label mix={fieldStyle}>
              <span mix={labelStyle}>Nick Name</span>
              <input name={`${idPrefix}-nickName`} type="text" placeholder="Nick Name" mix={controlStyle} />
            </label>
          </div>
        )}

        {type === 'Email' && (
          <div mix={fieldRowStyle}>
            <label mix={fieldStyle}>
              <span mix={labelStyle}>Email</span>
              <input name={`${idPrefix}-email`} type="email" placeholder="name@example.com" mix={controlStyle} />
            </label>
          </div>
        )}

        {type === 'Phone Number' && (
          <div mix={fieldRowStyle}>
            <label mix={[fieldStyle, dialFieldStyle]}>
              <span mix={labelStyle}>Code</span>
              <select name={`${idPrefix}-dial`} mix={controlStyle}>
                {COUNTRY_CODES.map((country) => (
                  <option value={country.dial}>
                    {flagEmoji(country.iso)} {country.code3} ({country.dial})
                  </option>
                ))}
              </select>
            </label>
            <label mix={[fieldStyle, css({ flex: '3 1 0' })]}>
              <span mix={labelStyle}>Phone Number</span>
              <input
                name={`${idPrefix}-phone`}
                type="tel"
                inputMode="numeric"
                placeholder="Phone Number"
                mix={[
                  controlStyle,
                  on('input', (event) => {
                    const input = event.currentTarget
                    const digitsOnly = input.value.replace(/[^0-9]/g, '')
                    if (input.value !== digitsOnly) input.value = digitsOnly
                  }),
                ]}
              />
            </label>
          </div>
        )}
      </fieldset>
    )
  }

  return () => (
    <div mix={rootStyle}>
      <div mix={cardStyle}>
      <div role="tablist" aria-label="Mode" mix={tabsStyle}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'encrypt'}
          mix={[tabButtonStyle, on('click', () => selectTab('encrypt'))]}
          style={activeTab === 'encrypt' ? activeTabStyleVars : undefined}
        >
          Encrypt
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'decrypt'}
          mix={[tabButtonStyle, on('click', () => selectTab('decrypt'))]}
          style={activeTab === 'decrypt' ? activeTabStyleVars : undefined}
        >
          Decrypt
        </button>
      </div>

      <form
        mix={[panelStyle, on<HTMLFormElement>('submit', onEncryptSubmit)]}
        style={{ display: activeTab === 'encrypt' ? 'flex' : 'none' }}
      >
        {renderParty('From', 'enc-from', encFromType, (t) => {
          encFromType = t
          handle.update()
        })}
        {renderParty('To', 'enc-to', encToType, (t) => {
          encToType = t
          handle.update()
        })}

        <label mix={fieldStyle}>
          <span mix={labelStyle}>Password</span>
          <input name="enc-password" type="password" placeholder="Shared password" autoComplete="off" mix={controlStyle} />
        </label>

        <label mix={fieldStyle}>
          <span mix={labelStyle}>Message</span>
          <textarea name="message" rows={5} placeholder="Write the message you want to keep secret..." mix={textareaStyle} />
        </label>

        <button type="submit" mix={primaryButtonStyle}>
          Encrypt
        </button>

        <label mix={fieldStyle}>
          <span mix={labelStyle}>Encrypted message</span>
          <textarea readOnly rows={4} value={encryptedOutput} placeholder="Your encrypted message will appear here." mix={[textareaStyle, readonlyStyle]} />
        </label>

        <button type="button" mix={[secondaryButtonStyle, on('click', () => copy(encryptedOutput, 'encrypt'))]}>
          {copied === 'encrypt' ? 'Copied!' : 'Copy'}
        </button>
      </form>

      <form
        mix={[panelStyle, on<HTMLFormElement>('submit', onDecryptSubmit)]}
        style={{ display: activeTab === 'decrypt' ? 'flex' : 'none' }}
      >
        {renderParty('From', 'dec-from', decFromType, (t) => {
          decFromType = t
          handle.update()
        })}
        {renderParty('To', 'dec-to', decToType, (t) => {
          decToType = t
          handle.update()
        })}

        <label mix={fieldStyle}>
          <span mix={labelStyle}>Password</span>
          <input name="dec-password" type="password" placeholder="Shared password" autoComplete="off" mix={controlStyle} />
        </label>

        <label mix={fieldStyle}>
          <span mix={labelStyle}>Encrypted text</span>
          <textarea name="cipher" rows={5} placeholder="Paste the encrypted message here..." mix={textareaStyle} />
        </label>

        <button type="submit" mix={primaryButtonStyle}>
          Decrypt
        </button>

        {decryptError ? <p mix={errorStyle}>{decryptError}</p> : null}

        <label mix={fieldStyle}>
          <span mix={labelStyle}>Decrypted message</span>
          <textarea readOnly rows={4} value={decryptedOutput} placeholder="Your decrypted message will appear here." mix={[textareaStyle, readonlyStyle]} />
        </label>

        <button type="button" mix={[secondaryButtonStyle, on('click', () => copy(decryptedOutput, 'decrypt'))]}>
          {copied === 'decrypt' ? 'Copied!' : 'Copy'}
        </button>
      </form>
      </div>

      {missingFields.length > 0 ? (
        <div
          mix={[
            overlayStyle,
            on('click', (event) => {
              if (event.target === event.currentTarget) closeModal()
            }),
          ]}
        >
          <div role="dialog" aria-modal="true" aria-labelledby={`${handle.id}-modal-title`} mix={modalStyle}>
            <button type="button" aria-label="Close" mix={[modalCloseStyle, on('click', closeModal)]}>
              ×
            </button>
            <h3 id={`${handle.id}-modal-title`} mix={modalTitleStyle}>
              Missing information
            </h3>
            <p mix={modalTextStyle}>Please fill in the following before continuing:</p>
            <ul mix={modalListStyle}>
              {missingFields.map((field) => (
                <li>{field}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
})

const activeTabStyleVars = {
  background: '#ffffff',
  color: COLORS.blue,
  boxShadow: '0 2px 8px rgba(27, 31, 36, 0.12)',
}

// `display: contents` so this wrapper generates no box: the card stays the flex
// item in the page layout, and the fixed modal is NOT trapped by the card's
// backdrop-filter, so it can center against the whole viewport.
const rootStyle = css({
  display: 'contents',
})

const cardStyle = css({
  width: '100%',
  maxWidth: '560px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  padding: '24px',
  borderRadius: '20px',
  background: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(6px)',
  border: `1px solid ${COLORS.slate}33`,
  boxShadow: `0 24px 60px ${COLORS.slate}22`,
  fontFamily: FONT_STACK,
  color: COLORS.ink,
})

const tabsStyle = css({
  display: 'flex',
  gap: '6px',
  padding: '6px',
  borderRadius: '14px',
  background: `${COLORS.slate}1a`,
})

const tabButtonStyle = css({
  flex: '1 1 0',
  appearance: 'none',
  border: 0,
  cursor: 'pointer',
  padding: '12px 16px',
  borderRadius: '10px',
  fontFamily: FONT_STACK,
  fontSize: '15px',
  fontWeight: 700,
  color: COLORS.slate,
  background: 'transparent',
  transition: 'background-color 150ms ease, color 150ms ease, box-shadow 150ms ease',
})

const panelStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
})

const fieldsetStyle = css({
  margin: 0,
  border: `1px solid ${COLORS.slate}33`,
  borderRadius: '14px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
})

const legendStyle = css({
  padding: '0 8px',
  fontSize: '13px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: COLORS.blue,
})

const fieldRowStyle = css({
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-end',
  '@media (max-width: 520px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
})

const fieldStyle = css({
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
})

const dialFieldStyle = css({
  flex: '0 0 96px',
  minWidth: 0,
  '@media (max-width: 520px)': {
    flex: '1 1 auto',
  },
})

const labelStyle = css({
  fontSize: '12px',
  fontWeight: 600,
  color: COLORS.slate,
})

const controlStyle = css({
  width: '100%',
  boxSizing: 'border-box',
  // Fixed height so <select> and <input> line up perfectly. Without it the
  // native select renders a couple of pixels taller than the input, leaving a
  // gap that made the focus ring look like the field jumped on focus.
  height: '42px',
  padding: '0 12px',
  borderRadius: '10px',
  border: `1px solid ${COLORS.slate}55`,
  background: COLORS.paper,
  color: COLORS.ink,
  fontFamily: FONT_STACK,
  fontSize: '15px',
  lineHeight: '1.2',
  outline: 'none',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
  // Inset focus ring so the field's outer box never changes size on focus
  // (an outset ring looked like the field was jumping up/out).
  '&:focus': {
    borderColor: COLORS.blue,
    boxShadow: `inset 0 0 0 2px ${COLORS.blue}55`,
  },
})

const textareaStyle = css({
  width: '100%',
  boxSizing: 'border-box',
  resize: 'vertical',
  padding: '12px 14px',
  borderRadius: '12px',
  border: `1px solid ${COLORS.slate}55`,
  background: COLORS.paper,
  color: COLORS.ink,
  fontFamily: FONT_STACK,
  fontSize: '15px',
  lineHeight: 1.6,
  outline: 'none',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
  '&::placeholder': { color: `${COLORS.ink}66` },
  // Inset focus ring so the field's outer box never changes size on focus.
  '&:focus': {
    borderColor: COLORS.blue,
    boxShadow: `inset 0 0 0 2px ${COLORS.blue}55`,
  },
})

const readonlyStyle = css({
  background: `${COLORS.slate}12`,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  wordBreak: 'break-all',
})

const primaryButtonStyle = css({
  appearance: 'none',
  border: 0,
  cursor: 'pointer',
  padding: '14px 18px',
  borderRadius: '12px',
  fontFamily: FONT_STACK,
  fontSize: '16px',
  fontWeight: 700,
  color: '#ffffff',
  background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.cyan})`,
  boxShadow: `0 10px 24px ${COLORS.blue}44`,
  transition: 'transform 120ms ease, box-shadow 120ms ease',
  '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 14px 30px ${COLORS.blue}55` },
  '&:active': { transform: 'translateY(0)' },
})

const secondaryButtonStyle = css({
  appearance: 'none',
  cursor: 'pointer',
  padding: '12px 18px',
  borderRadius: '12px',
  fontFamily: FONT_STACK,
  fontSize: '15px',
  fontWeight: 600,
  color: COLORS.blue,
  background: 'transparent',
  border: `1px solid ${COLORS.blue}66`,
  transition: 'background-color 150ms ease',
  '&:hover': { background: `${COLORS.blue}12` },
})

const errorStyle = css({
  margin: 0,
  fontSize: '14px',
  color: COLORS.orange,
})

const overlayStyle = css({
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: 'rgba(27, 31, 36, 0.45)',
  backdropFilter: 'blur(2px)',
})

const modalStyle = css({
  position: 'relative',
  width: '100%',
  maxWidth: '420px',
  boxSizing: 'border-box',
  padding: '28px 24px 24px',
  borderRadius: '18px',
  background: '#ffffff',
  boxShadow: '0 30px 70px rgba(27, 31, 36, 0.35)',
  fontFamily: FONT_STACK,
  color: COLORS.ink,
})

const modalCloseStyle = css({
  position: 'absolute',
  top: '12px',
  right: '12px',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  appearance: 'none',
  border: 0,
  cursor: 'pointer',
  borderRadius: '8px',
  fontSize: '22px',
  lineHeight: 1,
  color: COLORS.slate,
  background: 'transparent',
  transition: 'background-color 150ms ease, color 150ms ease',
  '&:hover, &:focus-visible': {
    background: `${COLORS.slate}1a`,
    color: COLORS.ink,
    outline: 'none',
  },
})

const modalTitleStyle = css({
  margin: '0 0 8px',
  fontSize: '18px',
  fontWeight: 700,
  color: COLORS.blue,
})

const modalTextStyle = css({
  margin: '0 0 12px',
  fontSize: '14px',
  lineHeight: 1.5,
  color: COLORS.slate,
})

const modalListStyle = css({
  margin: 0,
  padding: '0 0 0 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '15px',
  lineHeight: 1.5,
  color: COLORS.ink,
})
