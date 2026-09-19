import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { AppliedSticker, OpenedSkin } from '../../types'
import { getStickers } from '../../lib/stickers'

const TEX_W = 1024
const TEX_H = 512

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function buildCompositeTexture(
  skin: OpenedSkin,
  stickers: AppliedSticker[],
): Promise<{ texture: THREE.CanvasTexture; tainted: boolean }> {
  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0a0d12'
  ctx.fillRect(0, 0, TEX_W, TEX_H)

  const weaponImg = await loadImage(skin.item.image)
  let tainted = false

  if (weaponImg) {
    const scale =
      Math.min(TEX_W / weaponImg.width, TEX_H / weaponImg.height) * 0.92
    const w = weaponImg.width * scale
    const h = weaponImg.height * scale
    const x = (TEX_W - w) / 2
    const y = (TEX_H - h) / 2
    try {
      ctx.drawImage(weaponImg, x, y, w, h)
    } catch {
      tainted = true
    }
  } else {
    ctx.fillStyle = '#1a2030'
    ctx.fillRect(40, 80, TEX_W - 80, TEX_H - 160)
    ctx.fillStyle = '#8b9bb4'
    ctx.font = '28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(skin.item.name, TEX_W / 2, TEX_H / 2)
  }

  const slotCount = 5
  const stickerSize = Math.min(TEX_H * 0.28, 140)
  const startX = TEX_W * 0.12
  const span = TEX_W * 0.76
  const baseY = TEX_H * 0.55

  for (const st of stickers) {
    if (st.scraped) continue
    const img = await loadImage(st.item.image)
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
        tainted = true
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

  try {
    ctx.getImageData(0, 0, 1, 1)
  } catch {
    tainted = true
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  return { texture, tainted }
}

interface Props {
  skin: OpenedSkin
  className?: string
  onTainted?: (tainted: boolean) => void
}

export function SkinMeshViewer({ skin, className, onTainted }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const stickersKey = JSON.stringify(
    getStickers(skin).map((s) => `${s.slot}:${s.uid}:${s.item.image}`),
  )

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let disposed = false
    let raf = 0
    let idle = true
    let lastInteract = Date.now()

    const w = mount.clientWidth || 640
    const h = mount.clientHeight || 420

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0d12)

    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100)
    camera.position.set(0, 0.35, 3.2)

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

    const geo = new THREE.BoxGeometry(2.6, 0.85, 0.18, 1, 1, 1)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.15,
    })
    const mesh = new THREE.Mesh(geo, mat)
    meshGroup.add(mesh)

    const edgeGeo = new THREE.BoxGeometry(2.68, 0.93, 0.12)
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x1a2333,
      roughness: 0.8,
      metalness: 0.05,
    })
    const edge = new THREE.Mesh(edgeGeo, edgeMat)
    edge.position.z = -0.02
    meshGroup.add(edge)

    const stickers = getStickers(skin)

    buildCompositeTexture(skin, stickers).then(({ texture, tainted }) => {
      if (disposed) {
        texture.dispose()
        return
      }
      onTainted?.(tainted)
      mat.map = texture
      mat.needsUpdate = true
    })

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
      if (idle && Date.now() - lastInteract > 1800) {
        meshGroup.rotation.y += 0.004
      }
      controls.update()
      renderer.render(scene, camera)
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
      if (mat.map) mat.map.dispose()
      mat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin.uid, skin.item.image, stickersKey])

  return (
    <div
      ref={mountRef}
      className={className ?? 'w-full h-full min-h-[280px]'}
      style={{ touchAction: 'none' }}
    />
  )
}
