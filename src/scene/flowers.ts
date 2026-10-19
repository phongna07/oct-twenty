import * as THREE from 'three'
import { FLOWERS } from '../config'
import { addBouquetInteriorMorph, petalGeometry } from './geometry'
import { petalMaterial, stemMaterial, leafMaterial, goldMaterial } from './materials'
import { createRose } from './rose'
import { createPeony } from './peony'
import { createTulip } from './tulip'
import { createLily } from './lily'

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
  const { material, uniforms } = petalMaterial(config.color, config.accent, kind === 'tulip' || kind === 'lily' ? kind : 'default')
  const rose = kind === 'rose' ? createRose(material) : null
  const peony = kind === 'peony' ? createPeony(material) : null
  const tulip = kind === 'tulip' ? createTulip(material) : null
  const lily = kind === 'lily' ? createLily(material) : null
  if (rose) {
    material.roughness = 0.72; material.metalness = 0; material.sheen = 0.5; material.clearcoat = 0.03
    head.add(rose.group)
  }
  if (peony) {
    head.rotation.x = 1.0
    material.roughness = 0.78; material.metalness = 0; material.sheen = 0.65; material.clearcoat = 0
    uniforms.tip.value.lerp(new THREE.Color(config.color), 0.25)
    head.add(peony.group)
  }
  if (tulip || lily) {
    head.rotation.x = tulip ? 0.18 : 0.95
    material.roughness = tulip ? 0.67 : 0.76
    material.metalness = 0; material.clearcoat = 0.02; material.sheen = 0.55
    head.add((tulip ?? lily)!.group)
  }
  const petals: { mesh: THREE.InstancedMesh; layerIndex: number; count: number; radius: number; open: number }[] = []
  const dummy = new THREE.Object3D()
  const daisyLayers = [{ count: 18, length: 0.78, width: 0.12, angle: 1.43, radius: 0.12, cup: 0.07, curl: 0.10 }, { count: 16, length: 0.68, width: 0.115, angle: 1.25, radius: 0.1, cup: 0.06, curl: 0.04 }]
  if (kind === 'daisy') daisyLayers.forEach((layer, layerIndex) => {
    const geometry = petalGeometry({ ...layer, pointed: 0.55 })
    const mesh = new THREE.InstancedMesh(geometry, material, layer.count)
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    head.add(mesh)
    petals.push({ mesh, layerIndex, count: layer.count, radius: layer.radius, open: layer.angle })
  })
  if (kind === 'daisy') {
    const count = 56
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996, r = Math.sqrt(i / count) * 0.19
      const y = 0.12 + Math.sqrt(1 - i / count) * 0.07
      const tip = new THREE.Mesh(sphere, goldMaterial)
      tip.position.set(Math.cos(a) * r, y, Math.sin(a) * r)
      tip.scale.setScalar(0.035)
      head.add(tip)
    }
  }
  const stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -2.35, 0), new THREE.Vector3(-0.08, -1.15, -0.05), new THREE.Vector3(0.03, 0.2, 0), new THREE.Vector3(0, 0.85, 0)])
  const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 25, 0.032, 7, false), stemMaterial)
  stem.castShadow = true; group.add(stem)
  stemAndLeaves.push(stem)
  const leafCount = tulip ? 2 : lily ? 6 : 3
  for (let i = 0; i < leafCount; i++) {
    const leaf = new THREE.Mesh(petalGeometry({ length: tulip ? 1.5 - i * 0.18 : lily ? 0.72 : 0.8, width: tulip ? 0.27 : lily ? 0.085 : 0.19, cup: tulip ? 0.18 : 0.13, curl: tulip ? 0.13 : 0.05, pointed: 1.1 }), leafMaterial)
    leaf.position.set(0, -1.25 + i * (tulip ? 0.58 : lily ? 0.3 : 0.65), 0)
    leaf.rotation.set(tulip ? 0.25 : 0.45, i * 2.9, (i % 2 ? -1 : 1) * (tulip ? 0.42 : 0.75))
    leaf.castShadow = true; group.add(leaf)
    stemAndLeaves.push(leaf)
  }
  stemAndLeaves.forEach(mesh => addBouquetInteriorMorph(mesh, flowerToBouquet))
  return {
    group, head, state,
    update(time) {
      // Shell flowers animate positions and normals together via morph targets.
      uniforms.bloom.value = rose || peony || tulip || lily ? 1 : state.bloom; uniforms.time.value = time
      rose?.update(state.bloom)
      peony?.update(state.bloom)
      tulip?.update(state.bloom)
      lily?.update(state.bloom)
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
