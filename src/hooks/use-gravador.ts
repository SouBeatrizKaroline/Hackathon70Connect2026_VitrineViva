// Captura de voz para a demo: usa o reconhecimento de fala do próprio navegador
// (quando existe) para gerar TEXTO. Nenhum áudio é gravado, guardado ou enviado
// pela vivIA. Sem suporte ou sem permissão, o fluxo segue por texto.
import { useCallback, useEffect, useRef, useState } from 'react'

export type EstadoGravador = 'pronto' | 'gravando' | 'pausado' | 'finalizado'
export type ErroGravador = 'permissao' | 'falha' | null

function obterReconhecedor(): any {
  if (typeof window === 'undefined') return null
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function useGravador(limiteSegundos = 90) {
  const [estado, setEstado] = useState<EstadoGravador>('pronto')
  const [segundos, setSegundos] = useState(0)
  const [texto, setTexto] = useState('')
  const [parcial, setParcial] = useState('')
  const [erro, setErro] = useState<ErroGravador>(null)

  const suportado = !!obterReconhecedor()
  const recRef = useRef<any>(null)
  const baseRef = useRef('')
  const ouvindoRef = useRef(false)

  const iniciarSessao = useCallback(() => {
    const Reconhecedor = obterReconhecedor()
    if (!Reconhecedor) return
    const rec = new Reconhecedor()
    rec.lang = 'pt-BR'
    rec.interimResults = true
    // No Android o modo contínuo repete trechos; lá usamos sessões curtas encadeadas.
    rec.continuous = !/Android/i.test(navigator.userAgent)
    let finaisDaSessao = ''

    rec.onresult = (ev: any) => {
      let finais = ''
      let provisorio = ''
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i]
        if (r.isFinal) finais += r[0].transcript.trim() + ' '
        else provisorio += r[0].transcript
      }
      finaisDaSessao = finais
      setTexto(`${baseRef.current} ${finais}`.trim())
      setParcial(provisorio)
    }
    rec.onerror = (ev: any) => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        ouvindoRef.current = false
        setErro('permissao')
        setEstado('pronto')
      } else if (ev.error !== 'no-speech' && ev.error !== 'aborted') {
        ouvindoRef.current = false
        setErro('falha')
        setEstado((s) => (s === 'gravando' ? 'finalizado' : s))
      }
    }
    rec.onend = () => {
      baseRef.current = `${baseRef.current} ${finaisDaSessao}`.trim()
      finaisDaSessao = ''
      setParcial('')
      if (ouvindoRef.current) {
        try {
          iniciarSessao()
        } catch {
          ouvindoRef.current = false
          setEstado('finalizado')
        }
      }
    }
    recRef.current = rec
    rec.start()
  }, [])

  const parar = (abortar = false) => {
    ouvindoRef.current = false
    try {
      if (abortar) recRef.current?.abort()
      else recRef.current?.stop()
    } catch {
      // já parado
    }
  }

  const iniciar = useCallback(() => {
    setErro(null)
    baseRef.current = ''
    setTexto('')
    setParcial('')
    setSegundos(0)
    ouvindoRef.current = true
    try {
      iniciarSessao()
      setEstado('gravando')
    } catch {
      ouvindoRef.current = false
      setErro('falha')
    }
  }, [iniciarSessao])

  const pausar = useCallback(() => {
    parar()
    setEstado('pausado')
  }, [])

  const retomar = useCallback(() => {
    ouvindoRef.current = true
    try {
      iniciarSessao()
      setEstado('gravando')
    } catch {
      ouvindoRef.current = false
      setErro('falha')
    }
  }, [iniciarSessao])

  const finalizar = useCallback(() => {
    parar()
    setEstado('finalizado')
  }, [])

  const descartar = useCallback(() => {
    parar(true)
    baseRef.current = ''
    setTexto('')
    setParcial('')
    setSegundos(0)
    setErro(null)
    setEstado('pronto')
  }, [])

  // Cronômetro + limite de duração.
  useEffect(() => {
    if (estado !== 'gravando') return
    const id = window.setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [estado])

  useEffect(() => {
    if (estado === 'gravando' && segundos >= limiteSegundos) finalizar()
  }, [estado, segundos, limiteSegundos, finalizar])

  // Ao sair da tela, encerra a escuta.
  useEffect(() => () => parar(true), [])

  return {
    suportado,
    estado,
    segundos,
    texto,
    parcial,
    erro,
    iniciar,
    pausar,
    retomar,
    finalizar,
    descartar,
  }
}
