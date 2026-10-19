import * as THREE from 'three'
import { petalGeometry } from './geometry'
export function createParticles() {
  const positions: number[] = [], seeds: number[] = []
  let seed = 2010
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  for (let i=0;i<150;i++) { positions.push((random()-0.5)*15,(random()-0.5)*12,(random()-0.5)*7); seeds.push(random()) }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3))
  geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1))
  const uniforms = { uTime:{value:0},uBurst:{value:0},uPixelRatio:{value:1} }
  const material = new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`attribute float aSeed; uniform float uTime; uniform float uBurst; uniform float uPixelRatio; varying float vAlpha;
    void main(){ vec3 p=position; p.x+=sin(uTime*.19+aSeed*20.)*.3; p.y=mod(p.y+uTime*(.06+aSeed*.09)+6.,12.)-6.; p+=normalize(position)*uBurst*.55; vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=(2.+aSeed*7.)*uPixelRatio*(10./-mv.z); vAlpha=(.3+.5*sin(uTime+aSeed*30.))*(.3+aSeed*.6); }`,
    fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float alpha=pow(max(0.,1.-d*2.),2.)*vAlpha;gl_FragColor=vec4(1.,.66,.39,alpha);}`,
  })
  const dust = new THREE.Points(geometry,material)
  const petalMat = new THREE.MeshStandardMaterial({color:'#edb0bd',roughness:0.6,side:THREE.DoubleSide})
  const floating = new THREE.InstancedMesh(petalGeometry({length:0.2,width:0.08,cup:0.05,curl:-0.03}),petalMat,28)
  floating.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  const dummy=new THREE.Object3D()
  const petalSeeds=Array.from({length:28},()=>({x:(random()-.5)*13,y:random()*12-6,z:(random()-.5)*5,r:random()*6,s:0.4+random()*0.8}))
  floating.frustumCulled=false
  return {dust,floating,uniforms,update(time:number,reduced:boolean){
    uniforms.uTime.value=time
    petalSeeds.forEach((p,i)=>{
      dummy.position.set(p.x+Math.sin(time*.13+p.r)*.35,reduced?p.y:((p.y-time*(.08+p.s*.08)+60)%12)-6,p.z)
      dummy.rotation.set(p.r+time*.14,p.r+time*.11,p.r+Math.sin(time*.3)*.3)
      dummy.scale.setScalar(p.s);dummy.updateMatrix();floating.setMatrixAt(i,dummy.matrix)
    });floating.instanceMatrix.needsUpdate=true
  }}
}
