import * as THREE from 'three'
import { stemMaterial } from './materials'

// A rising throat flows into a broad, pointed blade and a recurved tip.
// The outer three tepals are narrower than the alternating inner three.
function lilyTepal(inner: boolean, opening: number): THREE.BufferGeometry {
  const nx = 24, ny = 44, positions: number[] = [], uv: number[] = [], indices: number[] = []
  for (let j = 0; j <= ny; j++) {
    const v = j / ny, outline = Math.pow(Math.sin(Math.PI * v), 0.8)
    for (let i = 0; i <= nx; i++) {
      const u = i / nx * 2 - 1
      const width = (inner ? 0.34 : 0.265) * outline * (0.7 + 0.3 * v)
      const x = u * THREE.MathUtils.lerp(0.14 * outline, width, opening)
      const openY = 0.86 * Math.sin(v * Math.PI * 0.87) - 0.06 * v
        + u * u * 0.13 * outline + 0.012 * Math.sin(v * 18 + u * 5) * u * u * outline
      const y = THREE.MathUtils.lerp(v * 1.23, openY, opening)
      const closedRadius = 0.025 + 0.21 * Math.sin(v * Math.PI)
      const openRadius = 0.025 + (inner ? 1.12 : 1.18) * Math.pow(v, 1.25) - u * u * 0.08 * outline
      positions.push(x, y, THREE.MathUtils.lerp(closedRadius, openRadius, opening))
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

export function createLily(material: THREE.Material) {
  const group = new THREE.Group(), petals: { mesh: THREE.Mesh; inner: boolean }[] = []
  group.name = 'lily-trumpet'
  for (let whorl = 0; whorl < 2; whorl++) {
    const inner = whorl === 1
    const closed = lilyTepal(inner, 0), open = lilyTepal(inner, 1)
    closed.morphAttributes.position = [open.getAttribute('position').clone()]
    closed.morphAttributes.normal = [open.getAttribute('normal').clone()]
    open.dispose()
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(closed, material)
      mesh.name = `lily-${inner ? 'inner' : 'outer'}-tepal-${i + 1}`
      mesh.rotation.y = i * Math.PI * 2 / 3 + whorl * Math.PI / 3 + Math.PI / 6
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false
      group.add(mesh); petals.push({ mesh, inner })
    }
  }
  const organs = new THREE.Group(); group.add(organs)
  const filamentMaterial = new THREE.MeshStandardMaterial({ color: '#f0e5b4', roughness: 0.75 })
  const pollenMaterial = new THREE.MeshStandardMaterial({ color: '#a45420', roughness: 0.9 })
  const stigmaMaterial = new THREE.MeshStandardMaterial({ color: '#9fac62', roughness: 0.75 })
  const antherGeometry = new THREE.SphereGeometry(1, 16, 10)
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3 + 0.25, radius = 0.27 + 0.025 * (i % 2)
    const tip = new THREE.Vector3(Math.sin(angle) * radius, 0.91 + 0.065 * Math.sin(i * 2.1), Math.cos(angle) * radius)
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(Math.sin(angle) * 0.045, 0.12, Math.cos(angle) * 0.045),
      new THREE.Vector3(tip.x * 0.35, 0.66, tip.z * 0.35), tip,
    )
    const filament = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.012, 6, false), filamentMaterial)
    const anther = new THREE.Mesh(antherGeometry, pollenMaterial)
    anther.name = `lily-anther-${i + 1}`
    anther.position.copy(tip); anther.rotation.set(0.2, angle, 0.18 * Math.sin(i))
    anther.scale.set(0.115, 0.034, 0.045)
    filament.castShadow = true; anther.castShadow = true; organs.add(filament, anther)
  }
  const pistilCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(-0.015, 0.7, 0), new THREE.Vector3(-0.035, 1.07, 0.035),
  )
  organs.add(new THREE.Mesh(new THREE.TubeGeometry(pistilCurve, 18, 0.017, 7, false), stigmaMaterial))
  for (let i = 0; i < 3; i++) {
    const stigma = new THREE.Mesh(antherGeometry, stigmaMaterial), a = i * Math.PI * 2 / 3
    stigma.position.set(-0.035 + Math.sin(a) * 0.022, 1.07, 0.035 + Math.cos(a) * 0.022)
    stigma.scale.set(0.035, 0.025, 0.035); organs.add(stigma)
  }
  const base = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10), stemMaterial)
  base.scale.y = 1.2; group.add(base)
  const update = (bloom: number) => {
    petals.forEach(({ mesh, inner }) => {
      mesh.morphTargetInfluences![0] = THREE.MathUtils.smoothstep(bloom, inner ? 0.1 : 0, 0.95)
    })
    organs.scale.setScalar(THREE.MathUtils.lerp(0.3, 1, THREE.MathUtils.smoothstep(bloom, 0.15, 0.85)))
  }
  update(0)
  return { group, update }
}
