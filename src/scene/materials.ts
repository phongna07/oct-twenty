import * as THREE from 'three'

export function petalMaterial(color: string, accent: string) {
  const material = new THREE.MeshPhysicalMaterial({ color, roughness: 0.54, metalness: 0.02, side: THREE.DoubleSide, sheen: 1, sheenColor: new THREE.Color(accent), sheenRoughness: 0.65, clearcoat: 0.12 })
  const uniforms = { bloom: { value: 0 }, time: { value: 0 }, tip: { value: new THREE.Color(accent) } }
  material.onBeforeCompile = shader => {
    shader.uniforms.uBloom = uniforms.bloom
    shader.uniforms.uPetalTime = uniforms.time
    shader.uniforms.uTipColor = uniforms.tip
    shader.vertexShader = 'uniform float uBloom; uniform float uPetalTime; varying vec2 vPetalUv;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <morphtarget_vertex>', `
      #include <morphtarget_vertex>
      vPetalUv = uv;
      float fold = (1.0 - uBloom) * 1.15;
      float a = fold * uv.y;
      // Preserve the shell flowers' morph targets before applying the fold.
      vec3 petalPosition = transformed;
      transformed.y = petalPosition.y * cos(a) - petalPosition.z * sin(a);
      transformed.z = petalPosition.y * sin(a) + petalPosition.z * cos(a);
      transformed.z += sin(uPetalTime * 1.2 + uv.y * 4.0) * 0.012 * uv.y * uBloom;
    `)
    shader.fragmentShader = 'uniform vec3 uTipColor; varying vec2 vPetalUv;\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float vein = pow(abs(sin((vPetalUv.x - 0.5) * 51.0 + sin(vPetalUv.y * 7.0) * 1.4)), 18.0);
      float rim = smoothstep(0.55, 1.0, vPetalUv.y);
      diffuseColor.rgb = mix(diffuseColor.rgb * (0.78 + 0.22 * vPetalUv.y), uTipColor, rim * 0.72);
      diffuseColor.rgb *= 1.0 - vein * 0.035 * sin(vPetalUv.y * 3.14159);
    `)
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float backlight = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0);
      outgoingLight += diffuseColor.rgb * backlight * 0.13;
      #include <opaque_fragment>
    `)
  }
  material.customProgramCacheKey = () => 'pink-bloom-petal-v1'
  return { material, uniforms }
}

export const stemMaterial = new THREE.MeshStandardMaterial({ color: '#526d47', roughness: 0.75 })
export const leafMaterial = new THREE.MeshPhysicalMaterial({ color: '#66826a', roughness: 0.6, side: THREE.DoubleSide, sheen: 0.4 })
export const goldMaterial = new THREE.MeshStandardMaterial({ color: '#cda057', metalness: 0.65, roughness: 0.3 })
export const satinMaterial = new THREE.MeshPhysicalMaterial({ color: '#a72e53', metalness: 0.2, roughness: 0.3, sheen: 1, sheenColor: new THREE.Color('#ffbaca'), side: THREE.DoubleSide })
