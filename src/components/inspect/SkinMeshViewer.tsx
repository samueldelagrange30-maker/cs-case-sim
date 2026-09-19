import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { AppliedSticker, OpenedSkin } from '../../types'
import { getStickers } from '../../lib/stickers'
import {
  isProceduralWeaponFamily,
  parseWeaponFamily,
} from '../../lib/weaponFamily'
import {
  buildWeaponMesh,
  centerAndScale,
  disposeObject3D,
} from './buildWeaponMesh'

const CORS_PROXY_PREFIX = 'https://wsrv.nl/?url='

/** Wrap external Steam/community URLs with a CORS-friendly image proxy. */
export function corsImageUrl(url: string): string {
  if (!url) return url
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

async function loadImage(
  src: string,
): Promise<HTMLImageElement | null> {
  const proxied = corsImageUrl(src)
  if (proxied !== src) {
    const viaProxy = await loadImageOnce(proxied, true)
    if (viaProxy) return viaProxy
  }
  return loadImageOnce(src, true)
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

async function loadSkinTexture(url: string): Promise<THREE.Texture | null> {
  const proxied = corsImageUrl(url)
  const viaLoader = await loadTextureViaLoader(proxied)
  if (viaLoader) return viaLoader
  if (proxied !== url) {
    const direct = await loadTextureViaLoader(url)
    if (direct) return direct
  }
  // Canvas path as last resort (CORS-safe image → CanvasTexture)
  const img = await loadImage(url)
  if (!img) return null
  try {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    ctx.getImageData(0, 0, 1, 1)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    tex.needsUpdate = true
    return tex
  } catch {
    return null
  }
}

async function loadStickerTextures(
  stickers: AppliedSticker[],
): Promise<Map<number, THREE.Texture | null>> {
  const map = new Map<number, THREE.Texture | null>()
  await Promise.all(
    stickers.map(async (st) => {
      if (st.scraped) {
        map.set(st.slot, null)
        return
      }
      const tex = await loadSkinTexture(st.item.image)
      map.set(st.slot, tex)
    }),
  )
  return map
}

function parseRarityHex(color: string | undefined): number {
  if (!color) return 0x4b69ff
  const m = color.trim().match(/^#?([0-9a-f]{6})$/i)
  if (!m) return 0x4b69ff
  return parseInt(m[1], 16)
}

interface Props {
  skin: OpenedSkin
  className?: string
  onTainted?: (tainted: boolean) => void
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
  const family = parseWeaponFamily(skin.item.name)
  const useProcedural = isProceduralWeaponFamily(family) || family === 'gloves'

  useEffect(() => {
    setHtmlFallback(false)
    onHtmlFallback?.(false)
    onTainted?.(false)

    const mount = mountRef.current
    if (!mount) return

    // Non-weapon items → HTML card only
    if (!useProcedural) {
      setHtmlFallback(true)
      onHtmlFallback?.(true)
      onTainted?.(true)
      return
    }

    let disposed = false
    let raf = 0
    let idle = true
    let lastInteract = Date.now()
    let ownedTextures: THREE.Texture[] = []
    let weaponRoot: THREE.Group | null = null

    const w = mount.clientWidth || 640
    const h = mount.clientHeight || 420

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0d12)

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100)
    camera.position.set(1.4, 0.85, 3.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1.4
    controls.maxDistance = 7
    controls.target.set(0, 0, 0)
    controls.addEventListener('start', () => {
      idle = false
      lastInteract = Date.now()
    })
    controls.addEventListener('end', () => {
      lastInteract = Date.now()
      idle = true
    })

    // Studio lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xffffff, 1.15)
    key.position.set(3.2, 4.2, 2.8)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x88aaff, 0.4)
    fill.position.set(-3.5, 1.5, -1.5)
    scene.add(fill)

    const rarityHex = parseRarityHex(skin.item.rarity?.color)
    const rim = new THREE.DirectionalLight(rarityHex, 0.55)
    rim.position.set(-1.5, 0.8, -3.2)
    scene.add(rim)

    // Soft ground shadow plane
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 })
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), shadowMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.85
    ground.receiveShadow = true
    scene.add(ground)

    const meshGroup = new THREE.Group()
    scene.add(meshGroup)

    const activateHtmlFallback = () => {
      if (disposed) return
      meshGroup.visible = false
      setHtmlFallback(true)
      onHtmlFallback?.(true)
      onTainted?.(true)
      renderer.domElement.style.display = 'none'
    }

    const stickersList = getStickers(skin)

    ;(async () => {
      const skinTex = await loadSkinTexture(skin.item.image)
      if (disposed) {
        skinTex?.dispose()
        return
      }
      if (skinTex) ownedTextures.push(skinTex)

      const stickerTexMap = await loadStickerTextures(stickersList)
      if (disposed) {
        stickerTexMap.forEach((t) => t?.dispose())
        skinTex?.dispose()
        return
      }
      stickerTexMap.forEach((t) => {
        if (t) ownedTextures.push(t)
      })

      // Always show procedural gun even without texture (metal body)
      const weapon = buildWeaponMesh({
        family,
        skinMap: skinTex,
        rarityColor: skin.item.rarity?.color,
        stickers: stickersList,
        stickerTextures: stickerTexMap,
      })
      centerAndScale(weapon, family === 'pistol' || family === 'knife' ? 2.1 : 2.7)
      weaponRoot = weapon
      meshGroup.add(weapon)

      // Frame camera to model
      const box = new THREE.Box3().setFromObject(weapon)
      const size = new THREE.Vector3()
      box.getSize(size)
      ground.position.y = box.min.y - 0.02

      onTainted?.(false)
      onHtmlFallback?.(false)

      // If somehow mesh failed (shouldn't), fall back
      if (!weapon.children.length && !skinTex) {
        activateHtmlFallback()
      }
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
      if (idle && Date.now() - lastInteract > 1800 && meshGroup.visible) {
        meshGroup.rotation.y += 0.004
      }
      controls.update()
      if (meshGroup.visible) renderer.render(scene, camera)
    }
    tick()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      if (weaponRoot) {
        meshGroup.remove(weaponRoot)
        disposeObject3D(weaponRoot)
      }
      ground.geometry.dispose()
      shadowMat.dispose()
      for (const t of ownedTextures) t.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin.uid, skin.item.image, skin.item.name, stickersKey, useProcedural, family])

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
