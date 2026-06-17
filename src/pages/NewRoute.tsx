import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X, Mountain } from 'lucide-react'
import { api } from '@/lib/api'

const PROVINCES = [
  '北京','天津','上海','重庆','河北','山西','辽宁','吉林','黑龙江',
  '江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南',
  '广东','海南','四川','贵州','云南','陕西','甘肃','青海','台湾',
  '内蒙古','广西','西藏','宁夏','新疆',
]

const SEASONS = ['春季', '夏季', '秋季', '冬季']
const DIFFICULTIES = [
  { value: '简单', label: '简单' },
  { value: '中等', label: '中等' },
  { value: '困难', label: '困难' },
  { value: '专家', label: '专家' },
]

const STEP_LABELS = ['基本信息', '照片上传', '确认发布']

export default function NewRoute() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [province, setProvince] = useState('')
  const [startPoint, setStartPoint] = useState('')
  const [distance, setDistance] = useState('')
  const [elevationGain, setElevationGain] = useState('')
  const [elevationLoss, setElevationLoss] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [duration, setDuration] = useState('')
  const [seasons, setSeasons] = useState<string[]>([])
  const [precautions, setPrecautions] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)
  const gpxRef = useRef<HTMLInputElement>(null)

  function toggleSeason(s: string) {
    setSeasons((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    files.forEach((f) => {
      setPhotos((prev) => [...prev, f])
      const reader = new FileReader()
      reader.onload = (ev) => setPhotoPreview((prev) => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
    setPhotoPreview((prev) => prev.filter((_, i) => i !== idx))
  }

  function validateStep0() {
    if (!name || !province || !startPoint || !distance || !difficulty || !duration) {
      setError('请填写所有必填项')
      return false
    }
    setError('')
    return true
  }

  function nextStep() {
    if (step === 0 && !validateStep0()) return
    setStep((s) => Math.min(s + 1, 2))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('province', province)
      fd.append('startPoint', startPoint)
      fd.append('distance', distance)
      fd.append('elevationGain', elevationGain)
      fd.append('elevationLoss', elevationLoss)
      fd.append('difficulty', difficulty)
      fd.append('duration', duration)
      fd.append('seasonRecommendation', JSON.stringify(seasons))
      fd.append('precautions', precautions)
      photos.forEach((p) => fd.append('photos', p))
      if (gpxFile) fd.append('gpx', gpxFile)
      const route = await api.routes.create(fd)
      navigate(`/route/${route.id}`)
    } catch (e: any) {
      setError(e.message || '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="text-forest-600 hover:text-forest-700 mb-4 flex items-center gap-1 text-sm">← 返回</button>
      <h1 className="section-title text-2xl mb-6">发布新路线</h1>

      <div className="flex items-center gap-2 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              i <= step ? 'bg-forest-600 text-white' : 'bg-fog-200 text-gray-400'
            }`}>{i + 1}</div>
            <span className={`ml-2 text-sm hidden sm:inline ${i <= step ? 'text-forest-700 font-medium' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-forest-500' : 'bg-fog-200'}`} />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {step === 0 && (
        <div className="space-y-4 animate-fade-in">
          <div><label className="label-text">路线名称 *</label><input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="如：武功山穿越" /></div>
          <div><label className="label-text">省份 *</label><select value={province} onChange={(e) => setProvince(e.target.value)} className="input-field"><option value="">选择省份</option>{PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
          <div><label className="label-text">起点 *</label><input value={startPoint} onChange={(e) => setStartPoint(e.target.value)} className="input-field" placeholder="如：沈子村" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-text">距离 (km) *</label><input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} className="input-field" step="0.1" /></div>
            <div><label className="label-text">预计耗时 *</label><input value={duration} onChange={(e) => setDuration(e.target.value)} className="input-field" placeholder="如：2天1夜" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label-text">累计爬升 (m)</label><input type="number" value={elevationGain} onChange={(e) => setElevationGain(e.target.value)} className="input-field" /></div>
            <div><label className="label-text">累计下降 (m)</label><input type="number" value={elevationLoss} onChange={(e) => setElevationLoss(e.target.value)} className="input-field" /></div>
          </div>
          <div><label className="label-text">难度 *</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-field"><option value="">选择难度</option>{DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
          <div><label className="label-text">推荐季节</label><div className="flex gap-2 mt-1">{SEASONS.map((s) => (<button key={s} type="button" onClick={() => toggleSeason(s)} className={`px-4 py-2 rounded-lg text-sm transition-all ${seasons.includes(s) ? 'bg-forest-600 text-white' : 'bg-fog-100 text-gray-600 hover:bg-fog-200'}`}>{s}</button>))}</div></div>
          <div><label className="label-text">注意事项</label><textarea value={precautions} onChange={(e) => setPrecautions(e.target.value)} rows={3} className="input-field resize-none" placeholder="安全提示、装备要求等" /></div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="label-text">路线照片</label>
            <div
              onClick={() => photoRef.current?.click()}
              className="border-2 border-dashed border-fog-300 rounded-xl p-8 text-center cursor-pointer hover:border-forest-400 hover:bg-fog-50 transition-all"
            >
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">点击或拖拽上传照片</p>
              <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式</p>
            </div>
            <input ref={photoRef} type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
          </div>
          {photoPreview.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {photoPreview.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt="" className="w-full h-24 object-cover rounded-lg" />
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div>
            <label className="label-text">GPX 轨迹文件</label>
            <div
              onClick={() => gpxRef.current?.click()}
              className="border-2 border-dashed border-fog-300 rounded-xl p-6 text-center cursor-pointer hover:border-forest-400 hover:bg-fog-50 transition-all"
            >
              <Mountain className="w-8 h-8 mx-auto text-gray-400 mb-1" />
              <p className="text-sm text-gray-500">{gpxFile ? gpxFile.name : '点击上传 GPX 文件'}</p>
            </div>
            <input ref={gpxRef} type="file" accept=".gpx" onChange={(e) => setGpxFile(e.target.files?.[0] || null)} className="hidden" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="card-static rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-forest-800 text-lg">{name}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <span>📍 {province} · {startPoint}</span>
              <span>📏 {distance} km</span>
              <span>⬆️ 爬升 {elevationGain || '-'} m</span>
              <span>⬇️ 下降 {elevationLoss || '-'} m</span>
              <span>⏱️ {duration}</span>
              <span>🏔️ {difficulty}</span>
            </div>
            {seasons.length > 0 && <div className="flex gap-1">{seasons.map((s) => <span key={s} className="badge-easy">{s}</span>)}</div>}
            {precautions && <p className="text-sm text-gray-500 bg-fog-50 rounded-lg p-3">{precautions}</p>}
            <p className="text-sm text-gray-500">📷 {photos.length} 张照片{gpxFile ? ' · GPX 轨迹' : ''}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="btn-secondary flex-1">上一步</button>}
        {step < 2 ? (
          <button onClick={nextStep} className="btn-primary flex-1">下一步</button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">{submitting ? '发布中...' : '确认发布'}</button>
        )}
      </div>
    </div>
  )
}
