import * as THREE from 'three'
import { petalGeometry } from './geometry'
import { leafMaterial, stemMaterial } from './materials'

interface RoseWhorl {
  count: number
  radius: number
  arc: number
  roll: number
  spiral: number
}

// Roses have overlapping, rounded shells around a furled center rather than
// the numerous narrow radial petals used for the peony.
const whorls: RoseWhorl[] = [
  { count: 2, radius: 0.12, arc: 4.6, roll: 0.01, spiral: 0.42 },
  { count: 3, radius: 0.25, arc: 2.9, roll: 0.025, spiral: 0.16 },
  { count: 5, radius: 0.43, arc: 2.15, roll: 0.065, spiral: 0.08 },
  { count: 7, radius: 0.62, arc: 1.65, roll: 0.085, spiral: 0.05 },
  { count: 8, radius: 0.76, arc: 1.4, roll: 0.12, spiral: 0.03 },
]

function rosePetal(whorl: RoseWhorl, opening: number): THREE.BufferGeometry {
  const nx = 32, ny = 40, positions: number[] = [], uv: number[] = [], indices: number[] = []
  for (let j = 0; j <= ny; j++) {
    // Extra samples near the base keep the rounded underside smooth.
    const v = Math.pow(j / ny, 2)
    const spread = Math.pow(Math.sin(v * Math.PI / 2), 0.28)
    const lip = THREE.MathUtils.smoothstep(v, 0.72, 1)
    for (let i = 0; i <= nx; i++) {
      const u = i / nx * 2 - 1
      const angle = u * whorl.arc / 2 * spread
      const petalV = v * (0.84 + 0.16 * Math.sqrt(Math.max(0, 1 - u * u)))
      const topRadius = THREE.MathUtils.lerp(0.11 + whorl.radius * 0.13, whorl.radius, opening)
      // A lower ellipsoid profile forms a curved cup instead of a pointed cone.
      // Widening the petal arcs near the base also keeps their undersides overlapped.
      const cup = Math.sqrt(Math.max(0, 1 - Math.pow(1 - petalV, 2)))
      const radius = (0.025 + (topRadius - 0.025) * cup) * (1 + u * whorl.spiral)
        + whorl.roll * lip * opening * (1 - u * u * 0.5)
      const crown = (1 - u * u) * 0.105 * Math.pow(v, 3)
      // All layers reach the same crown. Compensate for rolled tips so the
      // outer petals do not finish lower than the tightly curled center.
      const y = petalV * (0.6 + (1 - opening) * 0.16 + whorl.roll * 0.65 * opening) + crown
        - whorl.roll * 0.65 * lip * opening
        + Math.sin(u * 4.5 + v * 2) * 0.009 * Math.pow(v, 4)
      positions.push(Math.sin(angle) * radius, y, Math.cos(angle) * radius)
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

export function createRose(material: THREE.Material) {
  const group = new THREE.Group()
  // A taller, narrower bloom; keep these proportions throughout its opening.
  group.scale.set(0.75, 1.6, 0.75)
  const calyx = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), stemMaterial)
  calyx.position.y = -0.065; calyx.scale.y = 0.65; group.add(calyx)
  const sepalGeometry = petalGeometry({ length: 0.36, width: 0.065, cup: 0.04, curl: -0.06, pointed: 1.4 })
  for (let i = 0; i < 5; i++) {
    const sepal = new THREE.Mesh(sepalGeometry, leafMaterial)
    sepal.position.y = -0.07
    sepal.rotation.set(1.75, i / 5 * Math.PI * 2, 0, 'YXZ')
    group.add(sepal)
  }
  const dummy = new THREE.Object3D()
  const layers = whorls.map((whorl, layerIndex) => {
    const closed = rosePetal(whorl, 0), open = rosePetal(whorl, 1)
    closed.morphAttributes.position = [open.getAttribute('position').clone()]
    closed.morphAttributes.normal = [open.getAttribute('normal').clone()]
    open.dispose()
    const mesh = new THREE.InstancedMesh(closed, material, whorl.count)
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false
    for (let i = 0; i < whorl.count; i++) {
      const spin = i / whorl.count * Math.PI * 2 + layerIndex * 2.39996
      dummy.position.set(0, 0, 0)
      dummy.rotation.set(0, spin + Math.sin(i * 7.1) * 0.065, Math.sin(i * 4.3) * 0.035)
      dummy.scale.set(1 + Math.sin(i * 9.7) * 0.035, 1 + Math.cos(i * 5.3) * 0.035, 1)
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix)
    }
    group.add(mesh)
    return { mesh, layerIndex, count: whorl.count }
  })
  const morph = new THREE.Mesh()
  morph.morphTargetInfluences = [0]
  const update = (bloom: number) => {
    layers.forEach(({ mesh, layerIndex, count }) => {
      // The outer petals unfurl first, while the center remains tightly rolled.
      const delay = (whorls.length - 1 - layerIndex) * 0.055
      morph.morphTargetInfluences![0] = THREE.MathUtils.smoothstep(bloom, delay, 0.9 + delay * 0.4)
      for (let i = 0; i < count; i++) mesh.setMorphAt(i, morph)
      mesh.morphTexture!.needsUpdate = true
    })
  }
  update(0)
  return { group, update }
}
