import * as THREE from 'three'
import { petalGeometry } from './geometry'
import { leafMaterial, stemMaterial } from './materials'

interface PeonyLayer {
  count: number
  radius: number
  height: number
  arc: number
  ruffle: number
  curl: number
}

// Double peony: broad guard petals cradle a domed mass of smaller petaloids.
// The narrowing crown is deliberately different from a rose's rolled spiral.
const layers: PeonyLayer[] = [
  { count: 9, radius: 0.79, height: 0.42, arc: 1.10, ruffle: 0.012, curl: 0.035 },
  { count: 11, radius: 0.77, height: 0.51, arc: 1.02, ruffle: 0.018, curl: 0.04 },
  { count: 13, radius: 0.68, height: 0.62, arc: 0.98, ruffle: 0.026, curl: 0.065 },
  { count: 15, radius: 0.57, height: 0.71, arc: 0.94, ruffle: 0.032, curl: 0.065 },
  { count: 17, radius: 0.46, height: 0.77, arc: 0.91, ruffle: 0.035, curl: 0.06 },
  { count: 17, radius: 0.34, height: 0.82, arc: 0.98, ruffle: 0.031, curl: 0.05 },
  { count: 13, radius: 0.22, height: 0.84, arc: 1.16, ruffle: 0.025, curl: 0.03 },
  { count: 9, radius: 0.12, height: 0.85, arc: 1.48, ruffle: 0.018, curl: 0.01 },
  { count: 5, radius: 0.04, height: 0.84, arc: 1.95, ruffle: 0.004, curl: -0.035 },
]

function peonyPetal(layer: PeonyLayer, opening: number, variant: number): THREE.BufferGeometry {
  const nx = 40, ny = 32, positions: number[] = [], uv: number[] = [], indices: number[] = []
  const phase = variant * 2.39996
  const curl = layer.curl * (0.75 + variant * 0.25)
  for (let j = 0; j <= ny; j++) {
    const v = j / ny
    const spread = Math.pow(Math.sin(v * Math.PI / 2), 0.38)
    const lip = THREE.MathUtils.smoothstep(v, 0.60, 1)
    for (let i = 0; i <= nx; i++) {
      const u = i / nx * 2 - 1
      // A wide, softly lobed rim, never a single pointed tip. The shoulder
      // lowers the sides while retaining the fan-shaped end of a peony petal.
      const shoulder = 0.84 + 0.16 * Math.cos(u * Math.PI / 2)
      const petalV = v * shoulder
      const angle = u * layer.arc * spread / 2
      const topRadius = THREE.MathUtils.lerp(0.085 + layer.radius * 0.24, layer.radius, opening)
      const belly = (1 - opening) * layer.radius * 0.13 * Math.sin(petalV * Math.PI)
      const cup = Math.sqrt(Math.max(0, 1 - (1 - petalV) ** 2))
      const pleat = Math.sin(u * 6.5 + phase + v * 2.5)
      const finePleat = Math.sin(u * 16 + phase * 1.7 - v * 3)
      const ruffle = layer.ruffle * (pleat + finePleat * 0.28) * lip * (0.35 + opening * 0.65)
      const roll = Math.pow(v, 4) * opening
      const radius = (topRadius * cup + belly)
        * (1 + u * (0.025 + Math.sin(phase + 0.8) * 0.01))
        + curl * roll + ruffle
      const bottom = THREE.MathUtils.lerp(-0.12 * layer.radius, 0.28 - layer.radius * 0.4, opening)
      const height = THREE.MathUtils.lerp(0.66 + layer.height * 0.13, layer.height, opening)
      const y = bottom + (height - bottom) * petalV
        + ruffle * 0.8 + Math.sin(u * 5 + phase) * 0.012 * v * v * opening
        - curl * 0.65 * roll
      // The tangential cup and lapped edges separate adjacent surfaces;
      // perfectly concentric shells intersect and look like rigid scales.
      const edgeCup = u * u * layer.radius * 0.02 * v * v
      positions.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius + edgeCup)
      uv.push(i / nx, v)
      if (j < ny && i < nx) {
        const a = j * (nx + 1) + i, b = a + nx + 1
        indices.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

// Stable variation keeps replay, screenshots and the bouquet reproducible.
const variation = (seed: number) => THREE.MathUtils.seededRandom(seed)

export function createPeony(material: THREE.Material) {
  const group = new THREE.Group()
  group.name = 'double-peony'
  const calyx = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10), stemMaterial)
  calyx.position.y = -0.09; calyx.scale.y = 0.65; group.add(calyx)
  const sepalGeometry = petalGeometry({ length: 0.30, width: 0.09, cup: 0.055, curl: -0.045, pointed: 1.1 })
  for (let i = 0; i < 5; i++) {
    const sepal = new THREE.Mesh(sepalGeometry, leafMaterial)
    sepal.position.y = -0.09
    sepal.rotation.set(1.85, i / 5 * Math.PI * 2, 0, 'YXZ')
    group.add(sepal)
  }
  const dummy = new THREE.Object3D()
  const petals = layers.flatMap((layer, layerIndex) => {
    // Three surface variants per layer avoid stamping the same ruffle around
    // the flower, while retaining instancing and a fixed geometry budget.
    return Array.from({ length: 3 }, (_, variant) => {
      const closed = peonyPetal(layer, 0, variant), open = peonyPetal(layer, 1, variant)
      closed.morphAttributes.position = [open.getAttribute('position').clone()]
      closed.morphAttributes.normal = [open.getAttribute('normal').clone()]
      open.dispose()
      const count = Math.ceil((layer.count - variant) / 3)
      const mesh = new THREE.InstancedMesh(closed, material, count)
      mesh.name = `peony-petals-${layerIndex}-${variant}`
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false
      for (let i = 0; i < count; i++) {
        const petal = i * 3 + variant, seed = 1000 + layerIndex * 131 + petal * 17
        const spin = petal / layer.count * Math.PI * 2 + layerIndex * 2.39996
        const irregularity = layerIndex < 2 ? 0.4 : layerIndex > 6 ? 0.2 : 1
        dummy.position.set((variation(seed + 9) - 0.5) * 0.02 * irregularity,
          (variation(seed) - 0.5) * 0.045 * irregularity, (variation(seed + 10) - 0.5) * 0.02 * irregularity)
        dummy.rotation.set((variation(seed + 1) - 0.5) * 0.06 * irregularity,
          spin + (variation(seed + 2) - 0.5) * 0.16, (variation(seed + 3) - 0.5) * 0.09 * irregularity, 'YXZ')
        dummy.scale.set(0.96 + variation(seed + 4) * 0.08, 0.90 + variation(seed + 5) * 0.20, 0.97 + variation(seed + 6) * 0.06)
        dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix)
        // Subtle pink variation adds depth between overlapping thin petals.
        const blush = layerIndex / (layers.length - 1)
        mesh.setColorAt(i, new THREE.Color().setRGB(1, 0.95 - blush * 0.13 + variation(seed + 7) * 0.05, 0.97 - blush * 0.07 + variation(seed + 8) * 0.03))
      }
      group.add(mesh)
      return { mesh, layerIndex, count }
    })
  })
  const morph = new THREE.Mesh()
  morph.morphTargetInfluences = [0]
  let previousBloom = -1
  const update = (bloom: number) => {
    const progress = THREE.MathUtils.clamp(bloom, 0, 1)
    if (progress === previousBloom) return
    previousBloom = progress
    petals.forEach(({ mesh, layerIndex, count }) => {
      // Guard petals open first; the small crown unfolds last.
      const delay = layerIndex * 0.035
      morph.morphTargetInfluences![0] = THREE.MathUtils.smoothstep(progress, delay, 0.72 + delay)
      for (let i = 0; i < count; i++) mesh.setMorphAt(i, morph)
      mesh.morphTexture!.needsUpdate = true
    })
  }
  update(0)
  return { group, update }
}
