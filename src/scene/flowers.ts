import * as THREE from 'three'
import { FLOWERS, type FlowerKind } from '../config'
import { addBouquetInteriorMorph, petalGeometry } from './geometry'
import { petalMaterial, stemMaterial, leafMaterial, goldMaterial } from './materials'
import { createRose } from './rose'

export interface Flower { group: THREE.Group; head: THREE.Group; state: { scale: number; bloom: number; travel: number; turn: number }; update: (time: number) => void }
const sphere = new THREE.SphereGeometry(1, 10, 8)

export function createFlower(index: number): Flower {
  const config = FLOWERS[index], kind = config.kind
  const group = new THREE.Group(), head = new THREE.Group()
  head.position.y = 0.85
  // Heads lean toward the camera, making the layered petal surfaces visible.
  head.rotation.x = 0.65
  group.add(head)
  const state = { scale: 0, bloom: 0, travel: 0, turn: 0 }
  const stemAndLeaves: THREE.Mesh[] = []
  const flowerToBouquet = new THREE.Matrix4().makeRotationZ(config.tilt)
  flowerToBouquet.setPosition(...config.position)
  const { material, uniforms } = petalMaterial(config.color, config.accent)
  const rose = kind === 'rose' ? createRose(material) : null
  if (rose) {
    material.roughness = 0.72; material.metalness = 0; material.sheen = 0.5; material.clearcoat = 0.03
    head.add(rose.group)
  }
  const petals: { mesh: THREE.InstancedMesh; layerIndex: number; count: number; radius: number; open: number }[] = []
  const dummy = new THREE.Object3D()
  const layers: Record<Exclude<FlowerKind, 'rose'>, { count: number; length: number; width: number; angle: number; radius: number; cup: number; curl: number }[]> = {
    peony: Array.from({ length: 5 }, (_, i) => ({ count: 9 + i * 3, length: 0.43 + i * 0.13, width: 0.21 + i * 0.04, angle: 0.35 + i * 0.24, radius: 0.035 + i * 0.035, cup: 0.18, curl: -0.12 })),
    tulip: [{ count: 3, length: 1.1, width: 0.4, angle: 0.28, radius: 0.10, cup: 0.3, curl: -0.04 }, { count: 3, length: 1.04, width: 0.43, angle: 0.51, radius: 0.12, cup: 0.25, curl: -0.08 }],
    daisy: [{ count: 18, length: 0.78, width: 0.12, angle: 1.43, radius: 0.12, cup: 0.07, curl: 0.10 }, { count: 16, length: 0.68, width: 0.115, angle: 1.25, radius: 0.1, cup: 0.06, curl: 0.04 }],
    lily: [{ count: 3, length: 1.12, width: 0.29, angle: 1.14, radius: 0.03, cup: 0.25, curl: -0.55 }, { count: 3, length: 1.02, width: 0.30, angle: 0.93, radius: 0.04, cup: 0.22, curl: -0.45 }],
  }
  if (kind !== 'rose') layers[kind].forEach((layer, layerIndex) => {
    const geometry = petalGeometry({ ...layer, pointed: kind === 'lily' ? 1.2 : kind === 'daisy' ? 0.55 : 0.58, ruffle: kind === 'peony' ? 0.055 : 0 })
    const mesh = new THREE.InstancedMesh(geometry, material, layer.count)
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    head.add(mesh)
    petals.push({ mesh, layerIndex, count: layer.count, radius: layer.radius, open: layer.angle })
  })
  if (kind === 'daisy' || kind === 'lily') {
    const count = kind === 'daisy' ? 56 : 6
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996, r = kind === 'daisy' ? Math.sqrt(i / count) * 0.19 : 0.12
      const y = kind === 'daisy' ? 0.12 + Math.sqrt(1 - i / count) * 0.07 : 0.47 + Math.sin(i) * 0.08
      const tip = new THREE.Mesh(sphere, goldMaterial)
      tip.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
      tip.scale.setScalar(kind === 'daisy' ? 0.035 : 0.045)
      if (kind === 'lily') {
        tip.scale.y *= 2.1
        const curve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), tip.position)
        head.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 3, 0.009, 5, false), stemMaterial))
      }
      head.add(tip)
    }
  }
  const stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -2.35, 0), new THREE.Vector3(-0.08, -1.15, -0.05), new THREE.Vector3(0.03, 0.2, 0), new THREE.Vector3(0, 0.85, 0)])
  const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 25, 0.032, 7, false), stemMaterial)
  stem.castShadow = true; group.add(stem)
  stemAndLeaves.push(stem)
  for (let i = 0; i < 3; i++) {
    const leaf = new THREE.Mesh(petalGeometry({ length: kind === 'tulip' ? 1.3 : 0.8, width: 0.19, cup: 0.13, curl: 0.05, pointed: 1.1 }), leafMaterial)
    leaf.position.set(0, -1.25 + i * 0.65, 0)
    leaf.rotation.set(0.45, i * 2.9, i % 2 ? -0.8 : 0.75)
    leaf.castShadow = true; group.add(leaf)
    stemAndLeaves.push(leaf)
  }
  stemAndLeaves.forEach(mesh => addBouquetInteriorMorph(mesh, flowerToBouquet))
  return {
    group, head, state,
    update(time) {
      // The rose uses shell morphs, including matching normals, for its bloom.
      uniforms.bloom.value = rose ? 1 : state.bloom; uniforms.time.value = time
      rose?.update(state.bloom)
      stemAndLeaves.forEach(mesh => { mesh.morphTargetInfluences![0] = state.travel })
      petals.forEach(({ mesh, layerIndex, count, radius, open }) => {
        for (let j = 0; j < count; j++) {
          const spin = j / count * Math.PI * 2 + layerIndex * 0.57
          const angle = THREE.MathUtils.lerp(0.08 + layerIndex * 0.025, open + Math.sin(j * 12.3) * 0.04, state.bloom)
          dummy.position.set(Math.sin(spin) * radius, layerIndex * -0.035, Math.cos(spin) * radius)
          dummy.rotation.set(angle, spin, 0, 'YXZ')
          dummy.updateMatrix(); mesh.setMatrixAt(j, dummy.matrix)
        }
        mesh.instanceMatrix.needsUpdate = true
      })
      group.visible = state.scale > 0.001
    },
  }
}
