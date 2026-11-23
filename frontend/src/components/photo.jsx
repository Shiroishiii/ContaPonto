import { useRef } from 'react'
import { useApp } from '../context/AppContext'

export function usePhotoPicker() {
  const { photo, setPhoto, toast } = useApp()
  const ref = useRef(null)
  const onChange = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('Escolha um arquivo de imagem.')
    if (file.size > 5 * 1024 * 1024) return toast('A imagem deve ter até 5 MB.')
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const s = 256, c = document.createElement('canvas'), m = Math.min(img.width, img.height)
      c.width = c.height = s
      c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s)
      setPhoto(c.toDataURL('image/jpeg', 0.85)); URL.revokeObjectURL(url); toast('Foto de perfil atualizada')
    }
    img.onerror = () => toast('Não foi possível ler a imagem.')
    img.src = url
  }
  return { photo, ref, onChange, pick: () => ref.current.click(), remove: () => { setPhoto(null); toast('Foto removida') } }
}
