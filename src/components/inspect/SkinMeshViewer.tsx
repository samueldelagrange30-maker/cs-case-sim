import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { AppliedSticker, OpenedSkin } from '../../types'
import { getStickers } from '../../lib/stickers'

/** Slightly wider / flatter slab so skin art reads clearly */
const TEX_W = 1280
const TEX_H = 512

const CORS_PROXY_PREFIX = 'https://wsrv.nl/?url='

/** Wrap external Steam/community URLs with a CORS-friendly image proxy. */
export function corsImageUrl(url: string): string {
  if (!url) return url
  // Already proxied or same-origin / data / blob
  if (
    url.startsWith(CORS_PROXY_PREFIX) ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('/') ||
    url.startsWith('./')
  ) {
    return url
  }
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined' ? window.location.href : 'https://localhost',
    )
    if (
      typeof window !== 'undefined' &&
      parsed.origin === window.location.origin
    ) {
      return url
    }
  } catch {
    return url
  }
  return `${CORS_PROXY_PREFIX}${encodeURIComponent(url)}`
}

function loadImageOnce(
  src: string,
  withCors: boolean,
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    if (withCors) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/**
 * Fallback chain:
 * 1. proxied + crossOrigin anonymous
 * 2. original + crossOrigin anonymous
 * 3. original WITHOUT crossOrigin (for HTML path only — may taint canvas)
 */
async function loadImage(
  src: string,
  allowNoCors = false,
): Promise<{ img: HTMLImageElement | null; usedNoCors: boolean }> {
  const proxied = corsImageUrl(src)
  if (proxied !== src) {
    const viaProxy = await loadImageOnce(proxied, true)
    if (viaProxy) return { img: viaProxy, usedNoCors: false }
  }
  const withCors = await loadImageOnce(src, true)
  if (withCors) return { img: withCors, usedNoCors: false }
  if (allowNoCors) {
    const bare = await loadImageOnce(src, false)
    if (bare) return { img: bare, usedNoCors: true }
  }
  return { img: null, usedNoCors: false }
}

function drawStickersOnCtx(
  ctx: CanvasRenderingContext2D,
  stickers: AppliedSticker[],
  images: Map<number, HTMLImageElement | null>,
) {
  const slotCount = 5
  const stickerSize = Math.min(TEX_H * 0.28, 140)
  const startX = TEX_W * 0.12
  const span = TEX_W * 0.76
  const baseY = TEX_H * 0.55

  for (const st of stickers) {
    if (st.scraped) continue
    const img = images.get(st.slot) ?? null
    const t = slotCount <= 1 ? 0.5 : st.slot / (slotCount - 1)
    const cx = startX + span * t
    const cy = baseY + Math.sin(st.slot * 1.1) * 18
    const rot = (st.slot - 2) * 0.12

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.globalAlpha = 0.92
    if (img) {
      try {
        ctx.drawImage(
          img,
          -stickerSize / 2,
          -stickerSize / 2,
          stickerSize,
          stickerSize,
        )
      } catch {
        ctx.fillStyle = st.item.rarity.color || '#4b69ff'
        ctx.beginPath()
        ctx.arc(0, 0, stickerSize / 3, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      ctx.fillStyle = st.item.rarity.color || '#4b69ff'
      ctx.beginPath()
      ctx.arc(0, 0, stickerSize / 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
}

function softBackdrop(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, TEX_W, TEX_H)
  grad.addColorStop(0, '#12161f')
  grad.addColorStop(1, '#0c1018')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, TEX_W, TEX_H)
}

function drawWeapon(
  ctx: CanvasRenderingContext2D,
  weaponImg: CanvasImageSource,
  iw: number,
  ih: number,
) {
  const scale = Math.min(TEX_W / iw, TEX_H / ih) * 0.94
  const w = iw * scale
  const h = ih * scale
  const x = (TEX_W - w) / 2
  const y = (TEX_H - h) / 2
  ctx.drawImage(weaponImg, x, y, w, h)
}

type CompositeResult =
  | { ok: true; texture: THREE.CanvasTexture }
  | { ok: false }

async function loadStickerImages(
  stickers: AppliedSticker[],
): Promise<Map<number, HTMLImageElement | null>> {
  const map = new Map<number, HTMLImageElement | null>()
  await Promise.all(
    stickers.map(async (st) => {
      if (st.scraped) {
        map.set(st.slot, null)
        return
      }
      const { img } = await loadImage(st.item.image, false)
      map.set(st.slot, img)
    }),
  )
  return map
}

async function buildCompositeTexture(
  skin: OpenedSkin,
  stickers: AppliedSticker[],
): Promise<CompositeResult> {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!
  softBackdrop(ctx)

  // Prefer CORS-safe images for canvas; no no-cors path (would taint)
  const { img: weaponImg } = await loadImage(skin.item.image, false)
  if (!weaponImg) return { ok: false }

  try {
    drawWeapon(ctx, weaponImg, weaponImg.width, weaponImg.height)
  } catch {
    return { ok: false }
  }

  const stickerImgs = await loadStickerImages(stickers)
  drawStickersOnCtx(ctx, stickers, stickerImgs)

  try {
    ctx.getImageData(0, 0, 1, 1)
  } catch {
    return { ok: false }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return { ok: true, texture }
}

function loadTextureViaLoader(url: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
        tex.needsUpdate = true
        resolve(tex)
      },
      undefined,
      () => resolve(null),
    )
  })
}

/** Build a canvas texture from an already-loaded THREE texture + stickers. */
async function compositeFromTextureImage(
  baseTex: THREE.Texture,
  stickers: AppliedSticker[],
): Promise<THREE.CanvasTexture | null> {
  const img = baseTex.image as
    | HTMLImageElement
    | HTMLCanvasElement
    | ImageBitmap
    | null
  if (!img) return null

  const iw =
    'naturalWidth' in img
      ? img.naturalWidth || img.width
      : 'width' in img
        ? (img as HTMLCanvasElement | ImageBitmap).width
        : 0
  const ih =
    'naturalHeight' in img
      ? img.naturalHeight || img.height
      : 'height' in img
        ? (img as HTMLCanvasElement | ImageBitmap).height
        : 0
  if (!iw || !ih) return null

  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!
  softBackdrop(ctx)
  try {
    drawWeapon(ctx, img, iw, ih)
  } catch {
    return null
  }

  const stickerImgs = await loadStickerImages(stickers)
  drawStickersOnCtx(ctx, stickers, stickerImgs)

  try {
    ctx.getImageData(0, 0, 1, 1)
  } catch {
    return null
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

interface Props {
  skin: OpenedSkin
  className?: string
  /** Called when WebGL texture path failed and HTML card is primary. */
  onTainted?: (tainted: boolean) => void
  /** Called when viewer falls back to HTML 3D card as primary view. */
  onHtmlFallback?: (active: boolean) => void
}

export function SkinMeshViewer({
  skin,
  className,
  onTainted,
  onHtmlFallback,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [htmlFallback, setHtmlFallback] = useState(false)
  const [dragRot, setDragRot] = useState({ y: -12, x: 6 })
  const dragRef = useRef<{
    active: boolean
    lx: number
    ly: number
    ry: number
    rx: number
  } | null>(null)

  const stickersKey = JSON.stringify(
    getStickers(skin).map((s) => `${s.slot}:${s.uid}:${s.item.image}`),
  )
  const stickers = getStickers(skin)

  useEffect(() => {
    setHtmlFallback(false)
    onHtmlFallback?.(false)
    onTainted?.(false)

    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let raf = 0
    let idle = true
    let lastInteract = Date.now()
    let currentMap: THREE.Texture | null = null

    const w = mount.clientWidth || 640
    const h = mount.clientHeight || 420

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0d12)

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100)
    camera.position.set(0, 0.28, 3.0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1.6
    controls.maxDistance = 6
    controls.target.set(0, 0, 0)
    controls.addEventListener('start', () => {
      idle = false
      lastInteract = Date.now()
    })
    controls.addEventListener('end', () => {
      lastInteract = Date.now()
      idle = true
    })

    const ambient = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xffffff, 0.9)
    key.position.set(2, 3, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x88aaff, 0.35)
    fill.position.set(-3, 1, -2)
    scene.add(fill)

    const meshGroup = new THREE.Group()
    scene.add(meshGroup)

    // Larger / flatter gun slab
    const geo = new THREE.BoxGeometry(2.9, 0.78, 0.14, 1, 1, 1)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.15,
    })
    const mesh = new THREE.Mesh(geo, mat)
    meshGroup.add(mesh)

    const edgeGeo = new THREE.BoxGeometry(2.98, 0.86, 0.1)
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x1a2333,
      roughness: 0.8,
      metalness: 0.05,
    })
    const edge = new THREE.Mesh(edgeGeo, edgeMat)
    edge.position.z = -0.02
    meshGroup.add(edge)

    const applyMap = (tex: THREE.Texture) => {
      if (currentMap) currentMap.dispose()
      currentMap = tex
      mat.map = tex
      mat.needsUpdate = true
    }

    const activateHtmlFallback = () => {
      if (disposed) return
      mesh.visible = false
      edge.visible = false
      setHtmlFallback(true)
      onHtmlFallback?.(true)
      onTainted?.(true)
      renderer.domElement.style.display = 'none'
    }

    const stickersList = getStickers(skin)

    ;(async () => {
      // 1) Proxied canvas composite (weapon + stickers)
      const composite = await buildCompositeTexture(skin, stickersList)
      if (disposed) {
        if (composite.ok) composite.texture.dispose()
        return
      }

      if (composite.ok) {
        applyMap(composite.texture)
        onTainted?.(false)
        onHtmlFallback?.(false)
        return
      }

      // 2) TextureLoader on proxied URL, then re-composite stickers if possible
      const proxied = corsImageUrl(skin.item.image)
      const simpleTex = await loadTextureViaLoader(proxied)
      if (disposed) {
        simpleTex?.dispose()
        return
      }

      if (simpleTex) {
        const withStickers = await compositeFromTextureImage(
          simpleTex,
          stickersList,
        )
        if (disposed) {
          simpleTex.dispose()
          withStickers?.dispose()
          return
        }
        if (withStickers) {
          simpleTex.dispose()
          applyMap(withStickers)
        } else {
          applyMap(simpleTex)
        }
        onTainted?.(false)
        onHtmlFallback?.(false)
        return
      }

      // 3) HTML 3D card as primary (real <img>, drag-rotate)
      activateHtmlFallback()
    })()

    const onResize = () => {
      if (!mount) return
      const nw = mount.clientWidth
      const nh = mount.clientHeight
      camera.aspect = nw / Math.max(nh, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(mount)

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (idle && Date.now() - lastInteract > 1800 && mesh.visible) {
        meshGroup.rotation.y += 0.004
      }
      controls.update()
      if (mesh.visible) renderer.render(scene, camera)
    }
    tick()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      geo.dispose()
      edgeGeo.dispose()
      edgeMat.dispose()
      if (currentMap) currentMap.dispose()
      mat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin.uid, skin.item.image, stickersKey])

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    dragRef.current = {
      active: true,
      lx: e.clientX,
      ly: e.clientY,
      ry: dragRot.y,
      rx: dragRot.x,
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d?.active) return
    const dy = e.clientX - d.lx
    const dx = e.clientY - d.ly
    setDragRot({
      y: d.ry + dy * 0.35,
      x: Math.max(-28, Math.min(28, d.rx - dx * 0.25)),
    })
  }
  const onPointerUp = () => {
    if (dragRef.current) dragRef.current.active = false
  }

  return (
    <div
      className={`relative ${className ?? 'w-full h-full min-h-[280px]'}`}
      style={{ touchAction: 'none' }}
    >
      <div ref={mountRef} className="absolute inset-0" />
      {htmlFallback && (
        <div
          className="absolute inset-0 z-[1] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="relative w-[88%] max-w-xl aspect-[2.4/1] rounded-xl border border-white/10 shadow-2xl bg-gradient-to-br from-[#161b26] to-[#0c1018]"
            style={{
              transform: `perspective(900px) rotateY(${dragRot.y}deg) rotateX(${dragRot.x}deg)`,
              transition: dragRef.current?.active
                ? 'none'
                : 'transform 0.15s ease-out',
            }}
          >
            <img
              src={skin.item.image}
              alt={skin.item.name}
              className="absolute inset-0 m-auto max-h-[88%] max-w-[92%] object-contain pointer-events-none"
              draggable={false}
            />
            {stickers.map((st) => {
              if (st.scraped) return null
              const left = 12 + (st.slot / 4) * 70
              return (
                <img
                  key={st.uid + st.slot}
                  src={st.item.image}
                  alt=""
                  className="absolute w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-lg pointer-events-none"
                  style={{
                    left: `${left}%`,
                    top: '58%',
                    transform: `translate(-50%, -50%) rotate(${(st.slot - 2) * 8}deg)`,
                  }}
                  draggable={false}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
