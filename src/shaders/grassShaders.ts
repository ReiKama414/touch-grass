export const GRASS_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uWindDir;
  uniform float uWindStrength;
  uniform vec4 uTrail[16];
  uniform vec2 uTrailVel[16];
  uniform vec3 uSunDir;

  attribute vec3 aOffset;
  attribute vec4 aScale; // x: height, y: width, z: restingBend, w: yawAngle
  attribute vec2 aPhase; // x: windPhase, y: colorTint

  varying float vHeightPct;
  varying float vColorTint;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vWindWave;
  varying float vInteractAmount;

  // Hash & 2D simplex-style value noise for wind gusts
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    float t = clamp(position.y, 0.0, 1.0);
    vHeightPct = t;
    vColorTint = aPhase.y;

    float bladeHeight = aScale.x;
    float bladeWidth = aScale.y;
    float restingBend = aScale.z;
    float yaw = aScale.w;
    float phase = aPhase.x;

    // Distance-based LOD tapering to avoid aliasing far on the horizon
    float distToCam = length(aOffset.xz - cameraPosition.xz);
    float lodScale = smoothstep(82.0, 48.0, distToCam);
    bladeHeight *= max(0.001, lodScale);

    // Taper width smoothly from root to tip (organic blade silhouette, never rectangular)
    float widthProfile = (1.0 - pow(t, 1.75)) * (0.85 + 0.25 * sin(t * 3.14159));
    vec3 localPos = vec3(position.x * bladeWidth * widthProfile, t * bladeHeight, 0.0);

    // Slight V-fold along the blade spine for realistic 3D volume and light catch
    localPos.z += abs(position.x) * bladeWidth * 0.22 * (1.0 - t * 0.5);

    // Natural resting forward arc from root to tip
    float curve = t * t * restingBend * bladeHeight;
    localPos.z += curve;
    localPos.y *= (1.0 - 0.14 * t * t * restingBend);

    // Rotate blade around Y by its random yaw
    float s = sin(yaw);
    float c = cos(yaw);
    vec3 rotatedPos = vec3(
      localPos.x * c + localPos.z * s,
      localPos.y,
      -localPos.x * s + localPos.z * c
    );

    // Continuous rolling wind waves across the meadow
    vec2 worldXZ = aOffset.xz;
    float windCoord = dot(worldXZ, uWindDir) * 0.13 - uTime * 2.15;
    float gustNoise = noise2D(worldXZ * 0.075 - uWindDir * uTime * 0.65);
    float secondaryWave = sin(worldXZ.x * 0.21 - worldXZ.y * 0.17 + uTime * 1.6 + phase);
    float microFlutter = sin(uTime * 5.2 + phase * 3.7 + worldXZ.x * 0.8) * 0.08;

    float wave = (sin(windCoord + gustNoise * 2.6) * 0.6 + 0.4) * uWindStrength;
    wave += secondaryWave * 0.22 * uWindStrength + microFlutter;
    vWindWave = clamp(wave, -0.4, 1.4);

    float bendWeight = pow(t, 1.55);
    vec2 windPush = uWindDir * wave * bendWeight * bladeHeight * 0.58;
    // Orthogonal gentle sway so blades never rock monolithically in 1D
    vec2 orthoDir = vec2(-uWindDir.y, uWindDir.x);
    windPush += orthoDir * sin(uTime * 1.85 + phase) * 0.14 * bendWeight * bladeHeight;

    // Interactive mouse & touch displacement field (16-point trail with velocity & radial push)
    vec2 interactPush = vec2(0.0);
    float totalInteract = 0.0;
    for (int i = 0; i < 16; i++) {
      vec4 node = uTrail[i]; // xy = world XZ, z = radius, w = strength (0..1)
      if (node.w > 0.001) {
        vec2 diff = worldXZ - node.xy;
        float d = length(diff);
        float r = max(0.5, node.z);
        if (d < r) {
          float falloff = pow(1.0 - d / r, 2.0) * node.w;
          vec2 radialDir = d > 0.001 ? normalize(diff) : vec2(1.0, 0.0);
          vec2 velDir = uTrailVel[i];
          // Spring recovery oscillation as trail ages
          float spring = cos((1.0 - node.w) * 9.5) * exp(-(1.0 - node.w) * 2.2);
          vec2 pushDir = normalize(radialDir * 0.72 + velDir * 0.55 + vec2(0.0001));
          interactPush += pushDir * falloff * spring * 1.35;
          totalInteract += falloff;
        }
      }
    }

    float clampedInteract = clamp(totalInteract, 0.0, 1.25);
    vInteractAmount = clampedInteract;

    vec2 totalHorizontalDisp = windPush + interactPush * bendWeight * bladeHeight * 0.85;
    rotatedPos.x += totalHorizontalDisp.x;
    rotatedPos.z += totalHorizontalDisp.y;

    // Preserve blade length when bent horizontally (arc-length conservation)
    float dispLen = length(totalHorizontalDisp);
    rotatedPos.y -= min(bladeHeight * 0.48, (dispLen * dispLen) / max(0.35, 2.1 * bladeHeight));

    // Approximate deformed blade normal for soft shading
    vec3 localNormal = normalize(vec3(position.x * 0.45, 0.35 + 0.45 * t, 1.0));
    vec3 worldNormal = normalize(vec3(
      localNormal.x * c + localNormal.z * s - totalHorizontalDisp.x * 0.45,
      localNormal.y,
      -localNormal.x * s + localNormal.z * c - totalHorizontalDisp.y * 0.45
    ));
    vNormal = worldNormal;

    vec3 finalWorldPos = aOffset + rotatedPos;
    vWorldPos = finalWorldPos;

    gl_Position = projectionMatrix * viewMatrix * vec4(finalWorldPos, 1.0);
  }
`;

export const GRASS_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uNightMix;
  uniform vec3 uSunDir;
  uniform vec3 uDayBaseColor;
  uniform vec3 uDayMidColor;
  uniform vec3 uDayTipColor;
  uniform vec3 uNightBaseColor;
  uniform vec3 uNightMidColor;
  uniform vec3 uNightTipColor;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;

  varying float vHeightPct;
  varying float vColorTint;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vWindWave;
  varying float vInteractAmount;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i + vec2(0.0, 0.0)), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    // Rich three-stop vertical gradient along each grass blade
    vec3 dayCol = mix(
      uDayBaseColor,
      uDayMidColor,
      smoothstep(0.0, 0.55, vHeightPct)
    );
    dayCol = mix(dayCol, uDayTipColor, smoothstep(0.45, 1.0, vHeightPct));

    vec3 nightCol = mix(
      uNightBaseColor,
      uNightMidColor,
      smoothstep(0.0, 0.55, vHeightPct)
    );
    nightCol = mix(nightCol, uNightTipColor, smoothstep(0.45, 1.0, vHeightPct));

    // Per-blade & macro meadow hue modulation
    float patchNoise = noise2D(vWorldPos.xz * 0.045);
    vec3 warmShift = mix(vec3(0.93, 0.98, 0.88), vec3(1.08, 1.03, 0.90), vColorTint * 0.65 + patchNoise * 0.35);
    dayCol *= warmShift;
    nightCol *= mix(vec3(0.92, 0.96, 1.04), vec3(1.04, 1.08, 1.15), vColorTint);

    vec3 baseColor = mix(dayCol, nightCol, uNightMix);

    // Moving soft cloud shadows across the hills
    float cloudShadow = noise2D(vWorldPos.xz * 0.028 + vec2(uTime * 0.18, uTime * 0.09));
    float shadowFactor = mix(0.80, 1.12, smoothstep(0.28, 0.72, cloudShadow));

    // Directional lighting + ambient occlusion near roots
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uSunDir);
    vec3 V = normalize(cameraPosition - vWorldPos);

    float ndl = max(0.0, dot(N, L) * 0.5 + 0.5);
    float rootAO = mix(0.42, 1.0, smoothstep(0.0, 0.65, vHeightPct));

    // Subsurface scattering (translucent glow when backlit by sun or moon)
    float backLight = pow( clamp(dot(V, -L) + 0.35, 0.0, 1.0), 2.4 ) * pow(vHeightPct, 1.3);
    vec3 sssDay = vec3(0.86, 0.96, 0.42) * 0.42;
    vec3 sssNight = vec3(0.28, 0.52, 0.78) * 0.32;
    vec3 sss = mix(sssDay, sssNight, uNightMix) * backLight;

    // Wind wave sheen & tactile touch highlight
    vec3 windSheen = mix(vec3(0.16, 0.22, 0.08), vec3(0.08, 0.15, 0.24), uNightMix)
      * clamp(vWindWave * 0.45, 0.0, 0.35) * pow(vHeightPct, 1.6);
    vec3 touchHighlight = mix(vec3(0.22, 0.32, 0.14), vec3(0.14, 0.32, 0.38), uNightMix)
      * clamp(vInteractAmount * 0.55, 0.0, 0.4) * vHeightPct;

    vec3 litColor = baseColor * (0.62 + 0.48 * ndl) * shadowFactor * rootAO + sss + windSheen + touchHighlight;

    // Atmospheric distance fog
    float dist = length(vWorldPos - cameraPosition);
    float fogFactor = smoothstep(uFogNear, uFogFar, dist);
    vec3 finalColor = mix(litColor, uFogColor, fogFactor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
