export const FIREFLY_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute vec3 aBasePos;
  attribute vec4 aOrbit; // x: speed, y: radiusXZ, z: ampY, w: phase
  attribute float aSize;

  varying float vBlink;
  varying float vPhase;
  varying float vDepthFade;

  void main() {
    float speed = aOrbit.x;
    float radius = aOrbit.y;
    float ampY = aOrbit.z;
    float phase = aOrbit.w;
    vPhase = phase;

    float t = uTime * speed + phase;

    // Organic non-repeating 3D wandering flight path
    vec3 wander = vec3(
      sin(t * 1.1) * radius + cos(t * 0.47 + phase) * (radius * 0.55),
      sin(t * 1.45 + 1.2) * ampY + cos(t * 0.65) * (ampY * 0.4),
      cos(t * 0.93) * radius + sin(t * 0.53 - phase) * (radius * 0.55)
    );

    vec3 worldPos = aBasePos + wander;

    // Asynchronous organic firefly bioluminescent pulse
    float pulseWave = sin(uTime * (1.8 + fract(phase) * 2.2) + phase * 4.3);
    float secondaryPulse = sin(uTime * 0.75 - phase * 2.1);
    vBlink = smoothstep(-0.2, 0.85, pulseWave * 0.7 + secondaryPulse * 0.3);

    vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
    float dist = -mvPosition.z;
    vDepthFade = smoothstep(62.0, 6.0, dist);

    gl_PointSize = aSize * uPixelRatio * (185.0 / max(2.5, dist)) * (0.65 + 0.55 * vBlink);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const FIREFLY_FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;

  varying float vBlink;
  varying float vPhase;
  varying float vDepthFade;

  void main() {
    if (uOpacity <= 0.005) discard;

    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;

    // Bright bioluminescent core + soft warm yellow-green halo
    float core = exp(-d * d * 14.0);
    float halo = pow(max(0.0, 1.0 - d), 2.4) * 0.75;

    vec3 outerColor = mix(vec3(0.62, 0.98, 0.18), vec3(0.88, 1.0, 0.32), fract(vPhase * 2.7));
    vec3 coreColor = vec3(0.98, 1.0, 0.82);
    vec3 color = mix(outerColor, coreColor, core);

    float alpha = (core + halo) * vBlink * vDepthFade * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;
