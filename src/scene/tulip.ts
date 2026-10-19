import * as THREE from 'three'
import { stemMaterial } from './materials'

// Each tepal wraps around the flower axis. Two alternating whorls of three
// overlap into a rounded cup, rather than six flat blades meeting at a point.
function tulipTepal(inner: boolean, opening: number): THREE.BufferGeometry {
  const nx = 28, ny = 36, positions: number[] = [], uv: number[] = [], indices: number[] = []
  for (let j = 0; j <= ny; j++) {
    const v = j / ny
    for (let i = 0; i <= nx; i++) {
      const u = i / nx * 2 - 1
      const arc = u * 1.19 * Math.pow(Math.sin(v * Math.PI / 2), 0.45)
      const closedRadius = 0.025 + 0.275 * Math.pow(Math.sin(v * Math.PI), 0.72) + 0.018 * v
      const openRadius = 0.025 + 0.53 * Math.sqrt(1 - Math.pow(1 - v, 2))
        - 0.11 * THREE.MathUtils.smoothstep(v, 0.55, 1)
      // Give each shell its own convex face and turned-in sides. Concentric
      // surfaces otherwise share almost identical normals and read as one bulb.
      const shoulder = Math.pow(Math.abs(u), 3) * Math.sin(v * Math.PI / 2)
      const radius = THREE.MathUtils.lerp(closedRadius, openRadius, opening)
        * (inner ? 0.94 : 1) * (1 - shoulder * 0.11)
        + 0.014 * THREE.MathUtils.smoothstep(v, 0.85, 1) * (1 - u * u) * opening
      const height = inner ? 1.17 : 1.10
      const y = v * (height + (1 - opening) * 0.06) - 0.14 * u * u * Math.pow(v, 4)
        + 0.008 * Math.sin(u * 4 + v * 5) * v * v * opening
      positions.push(Math.sin(arc) * radius, y, Math.cos(arc) * radius)
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
  geometry.setIndex(indices); geometry.computeVertexNormals()
  return geometry
}

export function createTulip(material: THREE.Material) {
  const group = new THREE.Group(), petals: { mesh: THREE.Mesh; inner: boolean }[] = []
  group.name = 'tulip-cup'
  const base = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 10), stemMaterial)
  base.scale.y = 0.7; group.add(base)
  for (let whorl = 0; whorl < 2; whorl++) {
    const inner = whorl === 1
    const closed = tulipTepal(inner, 0), open = tulipTepal(inner, 1)
    closed.morphAttributes.position = [open.getAttribute('position').clone()]
    closed.morphAttributes.normal = [open.getAttribute('normal').clone()]
    open.dispose()
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(closed, material)
      mesh.name = `tulip-${inner ? 'inner' : 'outer'}-tepal-${i + 1}`
      mesh.rotation.y = i * Math.PI * 2 / 3 + whorl * Math.PI / 3 + 0.2
      mesh.castShadow = true; mesh.receiveShadow = true
      mesh.frustumCulled = false; group.add(mesh); petals.push({ mesh, inner })
    }
  }
  const update = (bloom: number) => {
    petals.forEach(({ mesh, inner }) => {
      mesh.morphTargetInfluences![0] = THREE.MathUtils.smoothstep(bloom, inner ? 0.12 : 0, 1)
    })
  }
  update(0)
  return { group, update }
}
