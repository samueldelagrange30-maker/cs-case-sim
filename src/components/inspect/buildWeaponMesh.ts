import * as THREE from 'three'
import type { AppliedSticker } from '../../types'
import type { WeaponFamily } from '../../lib/weaponFamily'

export interface WeaponMeshOptions {
  family: WeaponFamily
  /** Skin color map for receiver/body (optional). */
  skinMap?: THREE.Texture | null
  /** Rarity hex for subtle accent (unused on mesh itself; rim is in viewer). */
  rarityColor?: string
  stickers?: AppliedSticker[]
  stickerTextures?: Map<number, THREE.Texture | null>
}

function metalMat(
  color: number,
  opts?: { roughness?: number; metalness?: number },
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts?.roughness ?? 0.42,
    metalness: opts?.metalness ?? 0.72,
  })
}

function bodyMat(skinMap?: THREE.Texture | null): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: skinMap ?? null,
    roughness: 0.55,
    metalness: 0.22,
  })
}

function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  mesh.position.set(x, y, z)
  mesh.rotation.set(rx, ry, rz)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function addCyl(
  parent: THREE.Object3D,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  rx = 0,
  ry = 0,
  rz = Math.PI / 2,
  radial = 10,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial),
    mat,
  )
  mesh.position.set(x, y, z)
  mesh.rotation.set(rx, ry, rz)
  mesh.castShadow = true
  parent.add(mesh)
  return mesh
}

/** Place sticker decals along the body length (local X). */
function attachStickerDecals(
  body: THREE.Object3D,
  stickers: AppliedSticker[] | undefined,
  textures: Map<number, THREE.Texture | null> | undefined,
  /** Local X range for slots along the receiver */
  xMin: number,
  xMax: number,
  y: number,
  z: number,
  size = 0.18,
) {
  if (!stickers?.length) return
  const active = stickers.filter((s) => !s.scraped)
  if (!active.length) return
  const span = xMax - xMin
  for (const st of active) {
    const t = st.slot / 4
    const x = xMin + span * t
    const tex = textures?.get(st.slot) ?? null
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      color: tex ? 0xffffff : new THREE.Color(st.item.rarity.color || '#4b69ff'),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      roughness: 0.6,
      metalness: 0.05,
      side: THREE.DoubleSide,
    })
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat)
    plane.position.set(x, y, z)
    plane.rotation.z = (st.slot - 2) * 0.08
    body.add(plane)
  }
}

function buildRifleAr(group: THREE.Group, skin: THREE.MeshStandardMaterial) {
  const dark = metalMat(0x2a2e36)
  const mid = metalMat(0x3a404c, { metalness: 0.55, roughness: 0.5 })
  const stock = metalMat(0x1c1f26, { metalness: 0.35, roughness: 0.65 })

  // Receiver / body (skinned)
  addBox(group, 1.35, 0.28, 0.22, 0.05, 0.05, 0, skin)
  // Handguard
  addBox(group, 0.85, 0.22, 0.2, 0.95, 0.04, 0, mid)
  // Barrel
  addCyl(group, 0.045, 0.05, 1.15, 1.85, 0.06, 0, dark)
  // Muzzle
  addCyl(group, 0.07, 0.055, 0.14, 2.45, 0.06, 0, dark)
  // Mag
  addBox(group, 0.22, 0.42, 0.14, 0.15, -0.28, 0, dark, 0, 0, 0.12)
  // Stock
  addBox(group, 0.7, 0.22, 0.18, -0.95, 0.02, 0, stock)
  addBox(group, 0.18, 0.32, 0.16, -1.28, -0.05, 0, stock)
  // Pistol grip
  addBox(group, 0.16, 0.38, 0.14, -0.35, -0.28, 0, stock, 0, 0, 0.35)
  // Carry handle / optic rail
  addBox(group, 0.55, 0.08, 0.12, 0.1, 0.24, 0, mid)
  addBox(group, 0.12, 0.16, 0.1, -0.15, 0.3, 0, mid)

  return { stickerXMin: -0.25, stickerXMax: 0.95, stickerY: 0.2, stickerZ: 0.115 }
}

function buildRifleAk(group: THREE.Group, skin: THREE.MeshStandardMaterial) {
  const dark = metalMat(0x2c3038)
  const wood = metalMat(0x3d2a1a, { metalness: 0.15, roughness: 0.75 })
  const mid = metalMat(0x454b56)

  addBox(group, 1.2, 0.3, 0.24, 0.1, 0.04, 0, skin)
  // Gas tube / handguard wood
  addBox(group, 0.75, 0.2, 0.2, 0.95, 0.08, 0, wood)
  addCyl(group, 0.04, 0.048, 1.05, 1.8, 0.1, 0, dark)
  // Slant muzzle
  addBox(group, 0.18, 0.1, 0.1, 2.35, 0.12, 0, dark, 0, 0, -0.4)
  // Curve mag
  addBox(group, 0.2, 0.5, 0.14, 0.2, -0.32, 0, dark, 0, 0, 0.35)
  // Stock
  addBox(group, 0.65, 0.18, 0.16, -0.85, 0.0, 0, wood)
  addBox(group, 0.2, 0.28, 0.14, -1.15, -0.08, 0, wood)
  // Grip
  addBox(group, 0.15, 0.36, 0.13, -0.25, -0.28, 0, wood, 0, 0, 0.4)
  // Rear sight
  addBox(group, 0.1, 0.14, 0.12, -0.2, 0.24, 0, mid)

  return { stickerXMin: -0.2, stickerXMax: 0.85, stickerY: 0.2, stickerZ: 0.125 }
}

function buildSniper(group: THREE.Group, skin: THREE.MeshStandardMaterial) {
  const dark = metalMat(0x22262e)
  const mid = metalMat(0x3a414d)
  const stock = metalMat(0x1a1d24, { metalness: 0.3, roughness: 0.7 })

  // Long receiver
  addBox(group, 1.5, 0.26, 0.2, 0.0, 0.02, 0, skin)
  // Long barrel
  addCyl(group, 0.038, 0.042, 1.6, 1.55, 0.05, 0, dark)
  addCyl(group, 0.09, 0.07, 0.35, 2.4, 0.05, 0, dark) // suppressor-ish
  // Mag
  addBox(group, 0.28, 0.28, 0.16, 0.05, -0.22, 0, dark)
  // Stock + cheek rest
  addBox(group, 0.95, 0.22, 0.18, -1.15, -0.02, 0, stock)
  addBox(group, 0.35, 0.14, 0.16, -1.35, 0.14, 0, stock)
  addBox(group, 0.16, 0.34, 0.14, -0.55, -0.26, 0, stock, 0, 0, 0.3)
  // Scope
  addCyl(group, 0.09, 0.09, 0.7, 0.15, 0.28, 0, mid)
  addCyl(group, 0.11, 0.1, 0.12, -0.22, 0.28, 0, mid)
  addCyl(group, 0.11, 0.1, 0.12, 0.5, 0.28, 0, mid)

  return { stickerXMin: -0.4, stickerXMax: 0.7, stickerY: 0.16, stickerZ: 0.105 }
}

function buildSmg(group: THREE.Group, skin: THREE.MeshStandardMaterial) {
  const dark = metalMat(0x2a2e36)
  const mid = metalMat(0x3c4450)
  const stock = metalMat(0x1c2028, { metalness: 0.35, roughness: 0.65 })

  addBox(group, 0.95, 0.26, 0.2, 0.1, 0.04, 0, skin)
  addBox(group, 0.45, 0.2, 0.18, 0.7, 0.02, 0, mid)
  addCyl(group, 0.04, 0.045, 0.55, 1.15, 0.05, 0, dark)
  addBox(group, 0.18, 0.45, 0.14, 0.15, -0.28, 0, dark)
  addBox(group, 0.14, 0.32, 0.12, -0.25, -0.22, 0, stock, 0, 0, 0.35)
  // Folding stock stub
  addBox(group, 0.4, 0.1, 0.1, -0.55, 0.05, 0, stock)
  addBox(group, 0.25, 0.08, 0.14, 0.2, 0.2, 0, mid)

  return { stickerXMin: -0.15, stickerXMax: 0.65, stickerY: 0.18, stickerZ: 0.105 }
}

function buildShotgun(group: THREE.Group, skin: THREE.MeshStandardMaterial) {
  const dark = metalMat(0x262a32)
  const wood = metalMat(0x3a2818, { metalness: 0.12, roughness: 0.78 })

  addBox(group, 1.1, 0.24, 0.2, 0.0, 0.02, 0, skin)
  // Dual barrels look
  addCyl(group, 0.05, 0.05, 1.2, 1.15, 0.08, 0.04, dark)
  addCyl(group, 0.05, 0.05, 1.2, 1.15, 0.08, -0.04, dark)
  addBox(group, 0.5, 0.16, 0.16, 0.55, -0.08, 0, wood)
  addBox(group, 0.7, 0.2, 0.16, -0.85, -0.02, 0, wood)
  addBox(group, 0.15, 0.3, 0.12, -0.35, -0.22, 0, wood, 0, 0, 0.35)
  addBox(group, 0.18, 0.22, 0.14, -0.05, -0.18, 0, dark)

  return { stickerXMin: -0.3, stickerXMax: 0.55, stickerY: 0.15, stickerZ: 0.105 }
}

function buildPistol(group: THREE.Group, skin: THREE.MeshStandardMaterial) {
  const dark = metalMat(0x2a2e36)
  const grip = metalMat(0x1a1d24, { metalness: 0.25, roughness: 0.7 })

  addBox(group, 0.7, 0.28, 0.16, 0.1, 0.08, 0, skin)
  addCyl(group, 0.045, 0.05, 0.45, 0.6, 0.1, 0, dark)
  addBox(group, 0.18, 0.42, 0.14, -0.05, -0.2, 0, grip, 0, 0, 0.25)
  addBox(group, 0.22, 0.12, 0.14, 0.15, -0.08, 0, dark)
  // Slide serrations hint
  addBox(group, 0.15, 0.06, 0.17, -0.15, 0.18, 0, dark)

  return { stickerXMin: -0.1, stickerXMax: 0.4, stickerY: 0.22, stickerZ: 0.085, stickerSize: 0.12 }
}

function buildHeavy(group: THREE.Group, skin: THREE.MeshStandardMaterial) {
  const dark = metalMat(0x2a2e36)
  const mid = metalMat(0x3a414c)
  const stock = metalMat(0x1c2028, { metalness: 0.3, roughness: 0.7 })

  addBox(group, 1.4, 0.32, 0.26, 0.1, 0.05, 0, skin)
  addBox(group, 0.7, 0.28, 0.24, 0.95, 0.02, 0, mid)
  addCyl(group, 0.055, 0.06, 0.9, 1.7, 0.08, 0, dark)
  // Box mag
  addBox(group, 0.35, 0.55, 0.2, 0.2, -0.35, 0, dark)
  addBox(group, 0.55, 0.2, 0.18, -0.85, 0.0, 0, stock)
  addBox(group, 0.16, 0.36, 0.14, -0.4, -0.28, 0, stock, 0, 0, 0.3)
  // Bipod stubs
  addBox(group, 0.06, 0.28, 0.06, 1.0, -0.2, 0.1, dark, 0.3, 0, 0)
  addBox(group, 0.06, 0.28, 0.06, 1.0, -0.2, -0.1, dark, -0.3, 0, 0)

  return { stickerXMin: -0.2, stickerXMax: 0.9, stickerY: 0.22, stickerZ: 0.135 }
}

function buildKnife(group: THREE.Group, skin: THREE.MeshStandardMaterial) {
  const dark = metalMat(0x1e222a, { metalness: 0.4, roughness: 0.55 })
  const blade = metalMat(0xc0c6d0, { metalness: 0.85, roughness: 0.28 })

  // Handle
  addBox(group, 0.55, 0.14, 0.12, -0.35, 0, 0, skin)
  // Ring (karambit-ish)
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.035, 8, 16),
    dark,
  )
  ring.position.set(-0.7, 0, 0)
  ring.rotation.y = Math.PI / 2
  group.add(ring)
  // Curved blade approximation
  addBox(group, 0.7, 0.08, 0.04, 0.35, 0.02, 0, blade, 0, 0, -0.35)
  addBox(group, 0.35, 0.06, 0.035, 0.65, 0.12, 0, blade, 0, 0, -0.7)
  addBox(group, 0.12, 0.16, 0.1, -0.05, 0, 0, dark)

  return { stickerXMin: -0.4, stickerXMax: 0.05, stickerY: 0.1, stickerZ: 0.065, stickerSize: 0.1 }
}

function buildGlovesCard(group: THREE.Group, skin: THREE.MeshStandardMaterial) {
  // Soft “hand” slab — still 3D but not a gun
  addBox(group, 1.2, 0.7, 0.18, 0, 0, 0, skin)
  const dark = metalMat(0x1a1d24, { metalness: 0.2, roughness: 0.8 })
  addBox(group, 0.28, 0.45, 0.12, -0.55, -0.05, 0.02, dark)
  addBox(group, 0.22, 0.4, 0.1, -0.25, 0.05, 0.05, dark)
  addBox(group, 0.22, 0.42, 0.1, 0.0, 0.08, 0.05, dark)
  addBox(group, 0.2, 0.38, 0.1, 0.25, 0.05, 0.05, dark)
  addBox(group, 0.18, 0.32, 0.1, 0.48, -0.02, 0.05, dark)
  return null
}

type StickerLayout = {
  stickerXMin: number
  stickerXMax: number
  stickerY: number
  stickerZ: number
  stickerSize?: number
}

/**
 * Build a procedural low-poly weapon group.
 * Honest: primitives only — not Valve CS:GO/CS2 models.
 */
export function buildWeaponMesh(opts: WeaponMeshOptions): THREE.Group {
  const group = new THREE.Group()
  group.name = `weapon_${opts.family}`

  const skin = bodyMat(opts.skinMap)
  // Keep a reference for disposal helpers
  group.userData.skinMaterial = skin
  group.userData.disposables = [] as THREE.Object3D[]

  let layout: StickerLayout | null = null

  switch (opts.family) {
    case 'rifle_ak':
      layout = buildRifleAk(group, skin)
      break
    case 'sniper':
      layout = buildSniper(group, skin)
      break
    case 'smg':
      layout = buildSmg(group, skin)
      break
    case 'shotgun':
      layout = buildShotgun(group, skin)
      break
    case 'pistol':
      layout = buildPistol(group, skin)
      break
    case 'heavy':
      layout = buildHeavy(group, skin)
      break
    case 'knife':
      layout = buildKnife(group, skin)
      break
    case 'gloves':
      buildGlovesCard(group, skin)
      break
    case 'rifle_ar':
    default:
      layout = buildRifleAr(group, skin)
      break
  }

  if (layout && opts.stickers?.length) {
    attachStickerDecals(
      group,
      opts.stickers,
      opts.stickerTextures,
      layout.stickerXMin,
      layout.stickerXMax,
      layout.stickerY,
      layout.stickerZ,
      layout.stickerSize ?? 0.16,
    )
  }

  // Orient: barrel along +X, sit flat for orbit
  group.rotation.y = 0

  return group
}

/** Fit group into view: center at origin and uniform-scale to target size. */
export function centerAndScale(
  group: THREE.Object3D,
  targetSize = 2.6,
): THREE.Box3 {
  const box = new THREE.Box3().setFromObject(group)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  group.position.sub(center)
  const maxDim = Math.max(size.x, size.y, size.z, 0.001)
  const s = targetSize / maxDim
  group.scale.setScalar(s)
  // Recompute after scale for framing
  return new THREE.Box3().setFromObject(group)
}

export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.geometry?.dispose()
    const mat = mesh.material
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
    else mat?.dispose()
  })
}
