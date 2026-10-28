export const SKY_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vDir;

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const SKY_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uNightMix;
  uniform vec3 uSunPos;
  uniform vec3 uMoonPos;
  uniform vec3 uDayZenith;
  uniform vec3 uDayHorizon;
  uniform vec3 uNightZenith;
  uniform vec3 uNightHorizon;

  varying vec3 vWorldPos;
  varying vec3 vDir;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec3 dir = normalize(vDir);
    float elevation = clamp(dir.y, 0.0, 1.0);

    // Smooth atmospheric zenith-to-horizon gradient
    vec3 daySky = mix(uDayHorizon, uDayZenith, pow(elevation, 0.55));
    vec3 nightSky = mix(uNightHorizon, uNightZenith, pow(elevation, 0.65));
    vec3 skyColor = mix(daySky, nightSky, uNightMix);

    // Subtle warm horizon belt
    float horizonGlow = pow(1.0 - abs(dir.y), 5.0);
    skyColor += mix(vec3(0.18, 0.20, 0.14), vec3(0.05, 0.09, 0.18), uNightMix) * horizonGlow;

    // Daytime Sun disc & soft atmospheric scatter
    vec3 sunDir = normalize(uSunPos);
    float sunCos = max(0.0, dot(dir, sunDir));
    float sunHalo = pow(sunCos, 12.0) * 0.35 + pow(sunCos, 80.0) * 0.45;
    float sunDisc = smoothstep(0.9982, 0.9994, sunCos);
    vec3 sunContribution = (vec3(1.0, 0.95, 0.82) * sunHalo + vec3(1.0, 0.99, 0.92) * sunDisc * 1.3) * (1.0 - uNightMix);
    skyColor += sunContribution;

    // Nighttime Moon disc & cool lunar corona
    vec3 moonDir = normalize(uMoonPos);
    float moonCos = max(0.0, dot(dir, moonDir));
    float moonHalo = pow(moonCos, 18.0) * 0.28 + pow(moonCos, 120.0) * 0.35;
    float moonDisc = smoothstep(0.9987, 0.99935, moonCos);
    vec3 moonContribution = (vec3(0.55, 0.72, 0.95) * moonHalo + vec3(0.92, 0.96, 1.0) * moonDisc * 1.15) * uNightMix;
    skyColor += moonContribution;

    // Subtle twinkling stars in the upper night sky
    if (uNightMix > 0.02 && dir.y > 0.06) {
      vec3 starGrid = floor(dir * 260.0);
      float starSeed = hash31(starGrid);
      if (starSeed > 0.9945) {
        vec3 starCenter = (starGrid + 0.5) / 260.0;
        float dStar = length(dir - normalize(starCenter));
        float starSpot = smoothstep(0.0028, 0.0004, dStar);
        float twinkle = 0.65 + 0.35 * sin(uTime * (2.2 + fract(starSeed * 91.7) * 3.5) + starSeed * 120.0);
        float heightFade = smoothstep(0.06, 0.28, dir.y);
        skyColor += vec3(0.85, 0.92, 1.0) * starSpot * twinkle * heightFade * uNightMix * 0.95;
      }
    }

    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

export const CLOUD_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const CLOUD_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uNightMix;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.03 + vec2(13.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 centered = vUv * 2.0 - 1.0;
    float radialMask = 1.0 - smoothstep(0.25, 0.96, length(centered));
    if (radialMask <= 0.001) discard;

    vec2 driftUv = centered * vec2(3.2, 2.2) + vec2(uTime * 0.022, uTime * 0.009);
    float n1 = fbm(driftUv);
    float n2 = fbm(driftUv * 1.8 - vec2(uTime * 0.014, -uTime * 0.01));
    float density = smoothstep(0.46, 0.78, n1 * 0.72 + n2 * 0.36) * radialMask;

    // Soft internal cloud shading (sunlit top vs soft blue-gray belly)
    float highlight = smoothstep(0.52, 0.82, n1);
    vec3 dayCloudLight = vec3(1.0, 0.99, 0.97);
    vec3 dayCloudShadow = vec3(0.79, 0.88, 0.96);
    vec3 dayCloud = mix(dayCloudShadow, dayCloudLight, highlight);

    vec3 nightCloudLight = vec3(0.24, 0.34, 0.52);
    vec3 nightCloudShadow = vec3(0.09, 0.14, 0.25);
    vec3 nightCloud = mix(nightCloudShadow, nightCloudLight, highlight);

    vec3 cloudColor = mix(dayCloud, nightCloud, uNightMix);
    float alpha = density * mix(0.68, 0.36, uNightMix);

    gl_FragColor = vec4(cloudColor, alpha);
  }
`;

export const FOLIAGE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uWindDir;
  uniform float uWindStrength;

  attribute vec3 aOffset;
  attribute float aScale;
  attribute float aPhase;

  varying vec3 vNormal;
  varying vec3 vLocalPos;
  varying float vPhase;
  varying vec3 vWorldPos;

  void main() {
    vPhase = aPhase;
    vLocalPos = position;

    // Canopy breeze sway synchronized with meadow wind
    float sway = sin(uTime * 1.75 + aPhase + aOffset.x * 0.4) * 0.24 * uWindStrength;
    float gust = cos(uTime * 1.15 + aOffset.y * 0.35 + aPhase) * 0.16 * uWindStrength;

    vec3 displaced = position * aScale;
    // Leaf flutter on outer vertices of each foliage cluster
    displaced.x += sin(uTime * 3.4 + position.y * 2.5 + aPhase) * 0.07 * aScale;
    displaced.z += cos(uTime * 2.9 + position.x * 2.5 + aPhase) * 0.07 * aScale;

    vec3 clusterCenter = aOffset + vec3(uWindDir.x * sway + gust, sway * 0.22, uWindDir.y * sway);
    vec4 wp = modelMatrix * vec4(clusterCenter + displaced, 1.0);
    vWorldPos = wp.xyz;
    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const FOLIAGE_FRAGMENT_SHADER = /* glsl */ `
  uniform float uNightMix;
  uniform vec3 uSunDir;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;

  varying vec3 vNormal;
  varying vec3 vLocalPos;
  varying float vPhase;
  varying vec3 vWorldPos;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uSunDir);
    float ndl = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);

    vec3 dayDeep = vec3(0.13, 0.32, 0.15);
    vec3 dayMid = vec3(0.24, 0.52, 0.22);
    vec3 daySun = vec3(0.56, 0.77, 0.32);

    vec3 dayColor = mix(dayDeep, dayMid, smoothstep(0.15, 0.65, ndl));
    dayColor = mix(dayColor, daySun, smoothstep(0.6, 0.98, ndl));
    dayColor *= (0.92 + 0.16 * fract(vPhase * 3.17));

    // Poetic moonlit silhouette with subtle cyan-silver upper rim in night mode
    vec3 nightSilhouette = vec3(0.03, 0.07, 0.12);
    vec3 nightRim = vec3(0.16, 0.30, 0.44);
    vec3 nightColor = mix(nightSilhouette, nightRim, pow(ndl, 2.2) * 0.75);

    vec3 col = mix(dayColor, nightColor, uNightMix);

    float dist = length(vWorldPos - cameraPosition);
    float fogFactor = smoothstep(uFogNear, uFogFar, dist) * 0.68;
    col = mix(col, uFogColor, fogFactor);

    gl_FragColor = vec4(col, 1.0);
  }
`;
