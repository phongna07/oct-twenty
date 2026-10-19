import * as THREE from 'three'

export interface PetalShape { length: number; width: number; cup: number; curl: number; pointed?: number; ruffle?: number }
const petalCache = new Map<string, THREE.BufferGeometry>()

// Parametric surfaces, rather than flat flower textures. UV.y runs root to tip.
export function petalGeometry(shape: PetalShape): THREE.BufferGeometry {
  const key = JSON.stringify(shape)
  const cached = petalCache.get(key)
  if (cached) return cached
  const { length, width, cup, curl, pointed = 0.7, ruffle = 0 } = shape
  const nx = 14, ny = 22, vertices: number[] = [], uvs: number[] = [], indices: number[] = []
  for (let j = 0; j <= ny; j++) {
    const v = j / ny
    for (let i = 0; i <= nx; i++) {
      const u = i / nx * 2 - 1
      const outline = Math.pow(Math.sin(Math.PI * v), pointed) * (0.78 + 0.22 * v)
      const x = u * width * outline
      const y = v * length - Math.pow(v, 4) * curl * 0.25
      const z = cup * v * v + curl * Math.pow(v, 5) + u * u * width * 0.34 * Math.sin(Math.PI * v)
        + Math.cos(u * 11 + v * 13) * ruffle * Math.pow(v, 3)
      vertices.push(x, y, z)
      uvs.push(i / nx, v)
    }
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + nx + 1
    indices.push(a, b, a + 1, b, b + 1, a + 1)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  petalCache.set(key, geometry)
  return geometry
}

export function ribbonGeometry(points: THREE.Vector3[], width: number, twist = 0): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points), positions: number[] = [], uv: number[] = [], indices: number[] = []
  for (let i = 0; i <= 72; i++) {
    const t = i / 72, p = curve.getPoint(t), tangent = curve.getTangent(t)
    let side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 0, 1)).normalize()
    side.applyAxisAngle(tangent, twist * Math.sin(t * Math.PI))
    for (const sign of [-1, 1]) { const q = p.clone().addScaledVector(side, sign * width / 2); positions.push(q.x, q.y, q.z); uv.push((sign + 1) / 2, t) }
    if (i < 72) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(indices); g.computeVertexNormals()
  return g
}

// Build an alternate shape inside the paper's tapered, elliptical sleeve.
// Work in bouquet coordinates so differently tilted flowers share the same opening
// and gathered base. The inset leaves room for their gentle idle movement.
export function addBouquetInteriorMorph(mesh: THREE.Mesh, flowerToBouquet = new THREE.Matrix4()): void {
  mesh.updateMatrix()
  const toBouquet = flowerToBouquet.clone().multiply(mesh.matrix)
  const fromBouquet = toBouquet.clone().invert()
  const target = mesh.geometry.clone().applyMatrix4(toBouquet)
  const positions = target.getAttribute('position')
  const point = new THREE.Vector3(), tucked = new THREE.Vector3()
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i)
    const amount = 1 - THREE.MathUtils.smoothstep(point.y, -0.05, 0.2)
    if (amount === 0) continue
    tucked.copy(point)
    tucked.y = Math.max(-2.62, tucked.y)
    // The paper rises unevenly at its rim; use its tallest possible profile
    // to obtain a conservative interior radius at every height.
    const radius = 0.09 + THREE.MathUtils.clamp((tucked.y + 2.8) / 3.05, 0, 1) * 1.17
    const radial = Math.hypot(tucked.x, (tucked.z + 0.09) / 0.58)
    if (radial > radius) {
      tucked.x *= radius / radial
      tucked.z = -0.09 + (tucked.z + 0.09) * radius / radial
    }
    point.lerp(tucked, amount)
    positions.setXYZ(i, point.x, point.y, point.z)
  }
  target.computeVertexNormals()
  target.applyMatrix4(fromBouquet)
  // Petal/leaf primitives are cached: never attach a per-flower morph to them.
  mesh.geometry = mesh.geometry.clone()
  mesh.geometry.morphAttributes.position = [target.getAttribute('position').clone()]
  mesh.geometry.morphAttributes.normal = [target.getAttribute('normal').clone()]
  mesh.updateMorphTargets()
  target.dispose()
}
