import * as THREE from 'three'
import { addBouquetInteriorMorph, petalGeometry, ribbonGeometry } from './geometry'
import { leafMaterial, stemMaterial, satinMaterial, goldMaterial } from './materials'
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

export function createBouquet() {
  const group = new THREE.Group(), paper = new THREE.Group(), bow = new THREE.Group(), foliage = new THREE.Group(), gifts = new THREE.Group()
  group.add(paper, bow, foliage, gifts)
  const paperMaterial = new THREE.MeshPhysicalMaterial({ color: '#f0b9c8', roughness: 0.66, side: THREE.DoubleSide, sheen: 0.35, sheenColor: new THREE.Color('#ffe9e3') })
  const creamMaterial = new THREE.MeshPhysicalMaterial({ color: '#fff0dc', roughness: 0.75, side: THREE.DoubleSide, sheen: 0.25 })
  for (let sheet = 0; sheet < 3; sheet++) {
    const positions: number[] = [], indices: number[] = [], uv: number[] = []
    for (let j = 0; j <= 18; j++) for (let i = 0; i <= 44; i++) {
      const t = j / 18, u = i / 44, angle = (u * 1.25 + sheet * 0.66) * Math.PI
      const r = 0.14 + t * (1.28 + sheet * 0.045)
      const y = -2.8 + t * 2.6 + Math.sin(u * Math.PI) * 0.3 * t + Math.cos(angle + sheet) * 0.12 * t
      positions.push(Math.sin(angle) * r, y, Math.cos(angle) * r * 0.58 - 0.09)
      uv.push(u, t)
      if (j < 18 && i < 44) { const a = j * 45 + i; indices.push(a, a + 45, a + 1, a + 45, a + 46, a + 1) }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals()
    const mesh = new THREE.Mesh(geometry, sheet === 1 ? creamMaterial : paperMaterial)
    mesh.castShadow = true; mesh.receiveShadow = true; paper.add(mesh)
    const edge = []
    for (let i = 0; i <= 44; i++) { const offset = (18 * 45 + i) * 3; edge.push(v(positions[offset], positions[offset + 1], positions[offset + 2])) }
    paper.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge), 50, 0.008, 4, false), goldMaterial))
  }
  const bowPaths = [
    [v(0,-2.05,0.55),v(-0.52,-1.57,0.7),v(-0.87,-1.88,0.65),v(-0.42,-2.13,0.65),v(0,-2.05,0.58)],
    [v(0,-2.05,0.58),v(0.48,-1.62,0.7),v(0.85,-1.91,0.64),v(0.4,-2.16,0.62),v(0,-2.05,0.55)],
    [v(-0.06,-2.05,0.6),v(-0.21,-2.4,0.72),v(-0.56,-2.78,0.72),v(-0.37,-2.96,0.76)],
    [v(0.04,-2.05,0.61),v(0.19,-2.46,0.74),v(0.45,-2.7,0.75),v(0.38,-2.92,0.74)],
  ]
  bowPaths.forEach((path, i) => bow.add(new THREE.Mesh(ribbonGeometry(path, i < 2 ? 0.2 : 0.17, i < 2 ? 0.8 : 0.4), satinMaterial)))
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10), satinMaterial)
  knot.position.set(0,-2.05,0.64); knot.scale.set(1.2,0.75,0.6); bow.add(knot)
  const leafGeometry = petalGeometry({ length: 0.44, width: 0.16, cup: 0.03, curl: 0.02 })
  const white = new THREE.MeshStandardMaterial({ color: '#fffbec', roughness: 0.7 })
  const budGeometry = new THREE.SphereGeometry(0.035, 6, 5)
  for (let branch = 0; branch < 7; branch++) {
    const a = branch / 7 * Math.PI * 2
    const end = v(Math.cos(a) * 1.65, 0.75 + Math.sin(a) * 0.65, Math.sin(a) * 0.48 - 0.35)
    const curve = new THREE.QuadraticBezierCurve3(v(0,-2.4,0),v(end.x*0.8,-0.45,end.z),end)
    foliage.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.015, 5, false), stemMaterial))
    for (let k = 0; k < 7; k++) {
      const point = curve.getPoint(0.45+k*0.075)
      if (branch % 2 === 0) {
        const leaf = new THREE.Mesh(leafGeometry,leafMaterial)
        leaf.position.copy(point); leaf.rotation.set(0.55,a+k*2.7,k%2?0.85:-0.85); foliage.add(leaf)
      } else {
        for (let j=0;j<3;j++) { const bud = new THREE.Mesh(budGeometry,white); bud.position.copy(point).add(v(Math.sin(k*3+j)*0.12,Math.cos(j*2)*0.1,j*0.045)); foliage.add(bud) }
      }
    }
  }
  foliage.children.forEach(child => {
    if (child instanceof THREE.Mesh) {
      addBouquetInteriorMorph(child)
      child.morphTargetInfluences![0] = 1
    }
  })
  const giftColors = ['#edb1c3','#f9dfd7']
  for (let i = 0; i < 2; i++) {
    const gift = new THREE.Group(), size = i === 0 ? 0.73 : 0.53
    const mat = new THREE.MeshStandardMaterial({color:giftColors[i],roughness:0.65})
    const box = new THREE.Mesh(new THREE.BoxGeometry(size,size,size),mat)
    box.castShadow=true;box.receiveShadow=true;gift.add(box)
    const lid = new THREE.Mesh(new THREE.BoxGeometry(size+0.05,0.1,size+0.05),mat)
    lid.position.y=size/2;lid.castShadow=true;gift.add(lid)
    const band = new THREE.Mesh(new THREE.BoxGeometry(size*0.17,size+0.11,size+0.025),satinMaterial)
    band.position.y=0.025;gift.add(band)
    const band2 = new THREE.Mesh(new THREE.BoxGeometry(size+0.025,size+0.11,size*0.17),satinMaterial)
    band2.position.y=0.025;gift.add(band2)
    for (const side of [-1,1]) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(size*0.15,size*0.035,5,22),satinMaterial)
      loop.position.set(side*size*0.12,size/2+0.16,0);loop.rotation.set(0.45,side*0.4,side*0.5);gift.add(loop)
    }
    gift.position.set(i===0?1.8:-1.82,-3.27+size/2,i===0?0.15:-0.2)
    gift.rotation.y=i===0?-0.3:0.35;gifts.add(gift)
  }
  return {group,paper,bow,foliage,gifts}
}
