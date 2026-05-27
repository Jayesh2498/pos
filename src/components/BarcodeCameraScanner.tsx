import { useEffect, useRef, useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
}

export default function BarcodeCameraScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'loading' | 'active' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let codeReader: import('@zxing/browser').BrowserMultiFormatReader | null = null
    let active = true

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        codeReader = new BrowserMultiFormatReader()
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const deviceId = devices[devices.length - 1]?.deviceId // prefer back camera

        if (!active) return
        setStatus('active')

        await codeReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (result && active) {
              active = false
              onDetected(result.getText())
            }
            if (err && !(err instanceof Error && err.name === 'NotFoundException')) {
              console.warn('Scan error:', err)
            }
          }
        )
      } catch (e) {
        setStatus('error')
        setErrorMsg(e instanceof Error ? e.message : 'Camera unavailable')
      }
    }

    start()

    return () => {
      active = false
      try { (codeReader as any)?.reset?.() } catch {}
    }
  }, [onDetected])

  return (
    <div className="bcs-root">
      <div className="bcs-header">
        <span className="bcs-title">📷 Camera scanner</span>
        <button className="bcs-close" onClick={onClose}><X size={16} /></button>
      </div>

      {status === 'error' ? (
        <div className="flex items-center gap-2 text-sm py-8 justify-center" style={{ color: '#EF4444' }}>
          Camera error: {errorMsg}
        </div>
      ) : (
        <div className="bcs-video-wrap">
          <video ref={videoRef} className="bcs-video" muted />
          {status === 'loading' && (
            <div className="bcs-aim" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'white' }} />
            </div>
          )}
          {status === 'active' && (
            <div className="bcs-aim">
              <div className="bcs-aim-line" />
            </div>
          )}
        </div>
      )}

      <p className="bcs-hint">Point the camera at a barcode</p>
    </div>
  )
}
