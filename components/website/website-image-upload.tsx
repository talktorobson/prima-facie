'use client'

import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { useSupabase } from '@/components/providers'

const BUCKET = 'website-assets'

interface WebsiteImageUploadProps {
  lawFirmId: string
  value: string
  onChange: (url: string) => void
  folder: string
  label?: string
  className?: string
}

export default function WebsiteImageUpload({
  lawFirmId,
  value,
  onChange,
  folder,
  label,
  className = '',
}: WebsiteImageUploadProps) {
  const supabase = useSupabase()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens sao permitidas')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem deve ter no maximo 5MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${lawFirmId}/${folder}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '31536000', upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

      onChange(urlData.publicUrl)
    } catch (err) {
      setError('Erro ao fazer upload. Verifique se o bucket "website-assets" existe.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleRemove() {
    onChange('')
  }

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Upload"
            className="h-24 w-24 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            aria-label="Remover imagem"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Enviar imagem
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

interface WebsiteMultiImageUploadProps {
  lawFirmId: string
  values: string[]
  onChange: (urls: string[]) => void
  folder: string
  label?: string
  max?: number
}

export function WebsiteMultiImageUpload({
  lawFirmId,
  values,
  onChange,
  folder,
  label,
  max = 3,
}: WebsiteMultiImageUploadProps) {
  const supabase = useSupabase()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens sao permitidas')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem deve ter no maximo 5MB')
      return
    }

    if (values.length >= max) {
      setError(`Maximo de ${max} imagens`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${lawFirmId}/${folder}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '31536000', upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

      onChange([...values, urlData.publicUrl])
    } catch (err) {
      setError('Erro ao fazer upload. Verifique se o bucket "website-assets" existe.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleRemove(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <div className="flex flex-wrap gap-3">
        {values.map((url, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Foto ${i + 1}`}
              className="h-24 w-24 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              aria-label="Remover imagem"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {values.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-24 w-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-5 w-5 mb-1" />
                <span className="text-xs">{values.length}/{max}</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
