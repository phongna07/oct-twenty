import * as THREE from 'three'

export function petalMaterial(color: string, accent: string, profile: 'default' | 'tulip' | 'lily' = 'default') {
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
      float rim = smoothstep(${profile === 'tulip' ? '0.72' : '0.55'}, 1.0, vPetalUv.y);
      diffuseColor.rgb = mix(diffuseColor.rgb * (0.78 + 0.22 * vPetalUv.y), uTipColor, rim * ${profile === 'tulip' ? '0.5' : '0.72'});
      diffuseColor.rgb *= 1.0 - vein * 0.035 * sin(vPetalUv.y * 3.14159);
      ${profile === 'lily' ? `
      float stripe = exp(-pow((vPetalUv.x - 0.5) * 9.0, 2.0));
      float throat = 1.0 - smoothstep(0.05, 0.4, vPetalUv.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.65, 0.72, 0.29), throat * 0.4);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.23, 0.38), stripe * smoothstep(0.08, 0.3, vPetalUv.y) * (1.0 - smoothstep(0.65, 0.95, vPetalUv.y)) * 0.28);
      vec2 cell = floor(vPetalUv * vec2(25.0, 34.0));
      float seed = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
      vec2 spotUv = fract(vPetalUv * vec2(25.0, 34.0)) - 0.5;
      float spot = (1.0 - smoothstep(0.09, 0.19, length(spotUv * vec2(1.0, 0.7)))) * step(0.68, seed);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.48, 0.15, 0.23), spot * smoothstep(0.16, 0.3, vPetalUv.y) * (1.0 - smoothstep(0.55, 0.72, vPetalUv.y)) * 0.55);
      ` : ''}
      ${profile === 'tulip' ? `
      float stripe = exp(-pow((vPetalUv.x - 0.5) * 5.0, 2.0));
      diffuseColor.rgb *= 1.0 - stripe * 0.075 * sin(vPetalUv.y * 3.14159);
      ` : ''}
    `)
    if (profile === 'tulip') {
      // Local occlusion keeps overlapping sides readable even in the generous
      // ambient fill. It follows the petal UVs through both opening and rotation.
      shader.fragmentShader = shader.fragmentShader.replace('#include <aomap_fragment>', `
        #include <aomap_fragment>
        float sideOcclusion = smoothstep(0.52, 1.0, abs(vPetalUv.x * 2.0 - 1.0))
          * smoothstep(0.03, 0.3, vPetalUv.y) * (1.0 - smoothstep(0.88, 1.0, vPetalUv.y));
        float rootOcclusion = 1.0 - smoothstep(0.0, 0.24, vPetalUv.y);
        reflectedLight.indirectDiffuse *= 1.0 - sideOcclusion * 0.52 - rootOcclusion * 0.18;
        reflectedLight.directDiffuse *= 1.0 - sideOcclusion * 0.16;
        reflectedLight.indirectSpecular *= 1.0 - sideOcclusion * 0.4;
      `)
    }
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
      float backlight = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0);
      outgoingLight += diffuseColor.rgb * backlight * ${profile === 'tulip' ? '0.04' : '0.13'};
      #include <opaque_fragment>
    `)
  }
  material.customProgramCacheKey = () => `pink-bloom-petal-v3-${profile}`
  return { material, uniforms }
}

export const stemMaterial = new THREE.MeshStandardMaterial({ color: '#526d47', roughness: 0.75 })
export const leafMaterial = new THREE.MeshPhysicalMaterial({ color: '#66826a', roughness: 0.6, side: THREE.DoubleSide, sheen: 0.4 })
export const goldMaterial = new THREE.MeshStandardMaterial({ color: '#cda057', metalness: 0.65, roughness: 0.3 })
export const satinMaterial = new THREE.MeshPhysicalMaterial({ color: '#a72e53', metalness: 0.2, roughness: 0.3, sheen: 1, sheenColor: new THREE.Color('#ffbaca'), side: THREE.DoubleSide })
