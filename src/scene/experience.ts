import * as THREE from 'three'
import { gsap } from 'gsap'
import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { FLOWERS, TIMING } from '../config'
import { createFlower } from './flowers'
import { createBouquet } from './bouquet'
import { createParticles } from './particles'

export interface ExperienceUI { progress: HTMLElement; caption: HTMLElement; meaning: HTMLElement; count: HTMLElement; finalCaption?: string; onReady: () => void; onError: (error: unknown) => void }
export async function createExperience(container: HTMLElement, ui: ExperienceUI) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const compact = () => window.innerWidth < 640
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000,0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact() ? 1.5 : 1.75))
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.04
  container.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(37,1,0.1,70)
  const ambient = new THREE.HemisphereLight('#fff1e7','#946975',1.7); scene.add(ambient)
  const key = new THREE.DirectionalLight('#fff0dc',2.8);key.position.set(-3,8,4);key.castShadow=true
  key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-6;key.shadow.camera.right=6;key.shadow.camera.top=6;key.shadow.camera.bottom=-5;key.shadow.normalBias=0.035;scene.add(key)
  const rim = new THREE.DirectionalLight('#ffd1e1',1.8);rim.position.set(4,3,-3);scene.add(rim)
  const fill = new THREE.DirectionalLight('#fff7f0',1.1);fill.position.set(2,1,6);scene.add(fill)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({color:'#97556b',opacity:0.085}))
  floor.rotation.x=-Math.PI/2;floor.position.y=-2.85;floor.receiveShadow=true;scene.add(floor)
  const world = new THREE.Group();scene.add(world)
  const flowers = FLOWERS.map((_,i)=>createFlower(i));flowers.forEach(f=>world.add(f.group))
  const bouquet = createBouquet();world.add(bouquet.group)
  const particles = createParticles();scene.add(particles.dust,particles.floating)
  const font = await new FontLoader().loadAsync(`${import.meta.env.BASE_URL}fonts/cormorant-greeting.json`)
  const textMaterial = new THREE.MeshStandardMaterial({color:'#733447',roughness:0.48,metalness:0.08})
  const makeText = (text: string,size:number, material: THREE.Material = textMaterial) => {
    const mesh=new THREE.Mesh(textGeometry(text,size,font),material)
    mesh.geometry.computeBoundingBox();const box=mesh.geometry.boundingBox!
    mesh.geometry.translate(-(box.max.x+box.min.x)/2,0,0)
    mesh.castShadow=true;return mesh
  }
  const countdownCenter = new THREE.Vector3(0, 0.27, -0.4)
  const numbers = [3,2,1].map(n=>{
    const mat = new THREE.MeshStandardMaterial({color:'#a54566',metalness:0.25,roughness:0.34,transparent:true})
    mat.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 vDissolve;\n' + shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vDissolve=position;')
      shader.fragmentShader = 'varying vec3 vDissolve;\n' + shader.fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_fragment>', `
        #include <alphatest_fragment>
        float grain = fract(sin(dot(floor(vDissolve * 65.0), vec3(12.9898,78.233,43.12))) * 43758.5453);
        if(grain < 1.0-opacity) discard;
      `)
    }
    const mesh=makeText(String(n),2.5,mat)
    // Center each glyph's actual bounds so scaling/rotation stay centered too.
    mesh.geometry.center()
    mesh.position.copy(countdownCenter)
    world.add(mesh);return mesh
  })
  const haloMaterial = new THREE.MeshStandardMaterial({color:'#d7ac77',metalness:0.6,roughness:0.4,transparent:true,opacity:0.65})
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.52,0.007,6,120),haloMaterial)
  halo.position.copy(countdownCenter);world.add(halo)
  const greeting=new THREE.Group();world.add(greeting)
  const textLines=[makeText('Chúc mừng',0.59),makeText('ngày phụ nữ Việt Nam',0.44),makeText('20/10',0.48)]
  const lineY=[3.05,2.43,1.86]
  textLines.forEach((line,i)=>{line.position.set(0,lineY[i],0.1);greeting.add(line)})
  const ornament = new THREE.Mesh(new THREE.TorusGeometry(0.055,0.008,5,20),haloMaterial)
  ornament.position.set(0,1.65,0);greeting.add(ornament)

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene,camera))
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),0.13,0.45,1.15);composer.addPass(bloom);composer.addPass(new OutputPass())
  const stage = {finish:0,paper:0,bow:0,foliage:0,gifts:0,greeting:0,camera:0}
  const digits = numbers.map(()=>({scale:0,opacity:0,rotation:0}))
  const timeline=gsap.timeline({paused:true,defaults:{ease:'power2.inOut'}})
  for(let i=0;i<3;i++) {
    timeline.to(digits[i],{scale:1,opacity:1,rotation:0,duration:0.35,ease:'back.out(1.5)'},i)
    timeline.to(digits[i],{scale:1.14,opacity:0,rotation:-0.35,duration:0.3},i+0.7)
    timeline.fromTo(particles.uniforms.uBurst,{value:0},{value:1,duration:0.28,yoyo:true,repeat:1},i+0.7)
  }
  flowers.forEach((flower,i)=>{
    const start=TIMING.countdown+i*TIMING.flower
    timeline.to(flower.state,{scale:1,duration:0.75,ease:'back.out(1.15)'},start)
    timeline.to(flower.state,{bloom:1,duration:1.65,ease:'power2.out'},start+0.2)
    timeline.to(flower.state,{turn:Math.PI*2,duration:2.6,ease:'sine.inOut'},start+0.2)
    timeline.to(flower.state,{travel:1,duration:1.4,ease:'power3.inOut'},start+2.85)
  })
  timeline.to(stage,{finish:1,camera:1,duration:2.5},TIMING.wrap)
  timeline.to(stage,{foliage:1,duration:1.2},TIMING.wrap-0.6)
  timeline.to(stage,{paper:1,duration:1.65,ease:'power3.out'},TIMING.wrap+0.2)
  timeline.to(stage,{bow:1,duration:1.15,ease:'back.out(1.4)'},TIMING.wrap+1.3)
  timeline.to(stage,{gifts:1,duration:1.2,ease:'bounce.out'},TIMING.wrap+1.6)
  timeline.to(stage,{greeting:1,duration:2,ease:'power2.out'},TIMING.greeting)
  timeline.to(particles.uniforms.uBurst,{value:2,duration:0.7,yoyo:true,repeat:1},TIMING.greeting+0.4)
  let currentLabel = ''
  function updateUI() {
    const t = timeline.time(), index=Math.min(4,Math.max(0,Math.floor((t-TIMING.countdown)/TIMING.flower)))
    const label=t<TIMING.countdown?'countdown':t<TIMING.wrap?FLOWERS[index].kind:t<TIMING.greeting?'wrapping':'final'
    if(label!==currentLabel) {
      currentLabel=label
      ui.caption.textContent=t<TIMING.countdown?'Một món quà đang hé nở':t<TIMING.wrap?FLOWERS[index].name:t<TIMING.greeting?'Gói ghém những yêu thương':ui.finalCaption ?? 'Dành tặng một nửa xinh đẹp của thế giới'
      ui.meaning.textContent=t<TIMING.countdown?'ĐỢI MỘT CHÚT NHÉ':t<TIMING.wrap?FLOWERS[index].meaning:t<TIMING.greeting?'TỪNG CÁNH HOA, MỘT LỜI CHÚC':'HÔM NAY VÀ MỌI NGÀY'
      ui.count.textContent=t<TIMING.countdown?'MỘT BẤT NGỜ NHO NHỎ':t<TIMING.wrap?`${String(index+1).padStart(2,'0')} / 05`:'BẰNG TẤT CẢ YÊU THƯƠNG'
      document.body.dataset.phase=label
    }
    ui.progress.style.transform=`scaleX(${t/TIMING.end})`
  }
  timeline.eventCallback('onUpdate',updateUI)
  let time=0,last=performance.now(),frame=0,disposed=false,pausedByVisibility=false
  const pointer=new THREE.Vector2(),parallax=new THREE.Vector2()
  const cameraTarget=new THREE.Vector3(),active=new THREE.Vector3(),end=new THREE.Vector3()
  let width=1,height=1,qualitySamples=0,qualityTotal=0,lowQuality=false,renderCount=0
  const resize=()=>{
    width=container.clientWidth;height=container.clientHeight
    renderer.setPixelRatio(lowQuality?1:Math.min(window.devicePixelRatio,compact()?1.5:1.75))
    composer.setPixelRatio(renderer.getPixelRatio())
    renderer.setSize(width,height);composer.setSize(width,height);camera.aspect=width/height
    camera.updateProjectionMatrix();particles.uniforms.uPixelRatio.value=renderer.getPixelRatio()
    bloom.enabled=!compact()&&!lowQuality
  }
  window.addEventListener('resize',resize);resize()
  const onPointer=(event:PointerEvent)=>{pointer.set(event.clientX/window.innerWidth*2-1,event.clientY/window.innerHeight*2-1)}
  window.addEventListener('pointermove',onPointer,{passive:true})
  function render(now:number) {
    if(disposed)return
    const dt=Math.min((now-last)/1000,0.05);last=now
    if(!reduced)time+=dt
    const final=stage.finish,collectionScale=THREE.MathUtils.lerp(compact()?0.44:0.53,0.82,final)
    const offsetX=THREE.MathUtils.lerp(compact()?-1.2:-2.15,0,final),offsetY=THREE.MathUtils.lerp(-0.8,-0.05,final)
    bouquet.group.position.set(offsetX,offsetY,0);bouquet.group.scale.setScalar(collectionScale)
    flowers.forEach((flower,i)=>{
      const s=flower.state,p=s.travel,c=FLOWERS[i]
      active.set(compact()?0.3:0.55,0.15,1.2)
      end.set(c.position[0]*collectionScale+offsetX,c.position[1]*collectionScale+offsetY,c.position[2]*collectionScale)
      flower.group.position.lerpVectors(active,end,p)
      flower.group.position.y+=Math.sin(p*Math.PI)*0.85
      const scale=THREE.MathUtils.lerp(1.25,collectionScale,p)*s.scale
      flower.group.scale.setScalar(scale)
      flower.group.rotation.set(Math.sin(time*.7+i)*0.015*s.bloom,s.turn*(1-p),c.tilt*p+Math.sin(time*.85+i)*0.018)
      flower.update(time)
    })
    bouquet.paper.scale.set(1,Math.max(0.001,stage.paper),1)
    bouquet.paper.rotation.y=(1-stage.paper)*1.6;bouquet.paper.visible=stage.paper>0.001
    bouquet.bow.scale.setScalar(Math.max(0.001,stage.bow));bouquet.bow.visible=stage.bow>0.001
    bouquet.foliage.scale.setScalar(Math.max(0.001,stage.foliage));bouquet.foliage.visible=stage.foliage>0.001
    bouquet.gifts.scale.setScalar(Math.max(0.001,stage.gifts));bouquet.gifts.visible=stage.gifts>0.001
    numbers.forEach((mesh,i)=>{mesh.scale.setScalar(Math.max(0.001,digits[i].scale));mesh.rotation.y=digits[i].rotation;(mesh.material as THREE.MeshStandardMaterial).opacity=digits[i].opacity;mesh.visible=digits[i].opacity>0.001})
    halo.visible=timeline.time()<TIMING.countdown;halo.scale.setScalar(1+Math.sin(time*1.5)*0.025)
    greeting.visible=stage.greeting>0.001
    textLines.forEach((line,i)=>{const p=THREE.MathUtils.clamp(stage.greeting*1.5-i*0.18,0,1);line.scale.setScalar(Math.max(0.001,p));line.position.y=lineY[i]-(1-p)*0.22;line.rotation.x=(1-p)*0.25})
    parallax.lerp(reduced?new THREE.Vector2():pointer,0.04)
    world.rotation.y=parallax.x*0.045
    world.rotation.x=parallax.y*0.018
    const aspect=width/height
    // Maintain enough horizontal room in portrait, and vertical room on short screens.
    const distance=Math.max(compact()?18:height<550?16.5:14,5.6/(2*Math.tan(THREE.MathUtils.degToRad(37)/2)*aspect))
    const revealTime=timeline.time()-TIMING.countdown
    const dolly=revealTime>0&&revealTime<TIMING.wrap-TIMING.countdown?Math.sin((revealTime%TIMING.flower)/TIMING.flower*Math.PI)*0.55:0
    camera.position.set(Math.sin(time*.18)*0.11*(1-final)+parallax.x*.13,0.4+stage.camera*.05,distance+(1-stage.camera)*0.35-dolly)
    cameraTarget.set(0,compact()?-0.35:-0.05,0);camera.lookAt(cameraTarget)
    particles.update(time,reduced)
    if(lowQuality)renderer.shadowMap.needsUpdate=renderCount++%3===0
    if(bloom.enabled)composer.render();else renderer.render(scene,camera)
    // One-way quality reduction after warm-up; never rebuild geometry during playback.
    if(time>3&&qualitySamples<90){qualityTotal+=dt;qualitySamples++;if(qualitySamples===90&&qualityTotal/90>0.032){lowQuality=true;renderer.shadowMap.autoUpdate=false;resize()}}
    frame=requestAnimationFrame(render)
  }
  const visibility=()=>{
    if(document.hidden){pausedByVisibility=!timeline.paused();timeline.pause();cancelAnimationFrame(frame)}
    else{last=performance.now();if(pausedByVisibility)timeline.resume();frame=requestAnimationFrame(render)}
  }
  document.addEventListener('visibilitychange',visibility)
  const contextLost=(event:Event)=>{event.preventDefault();ui.onError(new Error('WebGL context lost'))}
  renderer.domElement.addEventListener('webglcontextlost',contextLost)
  if(renderer.extensions.has('KHR_parallel_shader_compile')) await renderer.compileAsync(scene,camera)
  else renderer.compile(scene,camera)
  ui.onReady()
  if(reduced){timeline.seek(TIMING.end).pause();gsap.fromTo(container,{opacity:0},{opacity:1,duration:0.8})}else timeline.play()
  updateUI();frame=requestAnimationFrame(render)

  const dispose=()=>{
    disposed=true;cancelAnimationFrame(frame);timeline.kill();gsap.killTweensOf(container)
    renderer.domElement.removeEventListener('webglcontextlost',contextLost)
    window.removeEventListener('resize',resize);window.removeEventListener('pointermove',onPointer);document.removeEventListener('visibilitychange',visibility)
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>()
    scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Points){geometries.add(object.geometry);if(object instanceof THREE.InstancedMesh)object.dispose();const m=object.material;(Array.isArray(m)?m:[m]).forEach(item=>materials.add(item))}})
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());composer.dispose();renderer.dispose();renderer.domElement.remove()
  }
  if(import.meta.env.DEV) {
    Object.assign(window,{__pinkBloom:{seek:(seconds:number)=>{timeline.seek(seconds).pause();updateUI()},play:()=>timeline.play(),time:()=>timeline.time(),reduced,renderer,scene,flowers,stage,dispose}})
  }
  return dispose
}
function textGeometry(text:string,size:number,font:Font) { return new TextGeometry(text,{font,size,depth:0.022,curveSegments:8,bevelEnabled:true,bevelThickness:0.006,bevelSize:0.004,bevelSegments:2}) }
