// WebGL2-рендер «платка»: фото — плотная сетка, вершины смещаются гладкими
// шумовыми полями + инерцией от скорости. Низкие частоты шума и вычисление
// нормалей по конечным разностям дают мягкие складки без заломов.

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const MESH_VS = /* glsl */ `#version 300 es
precision highp float;
in vec2 aUv;
uniform vec2 uRes, uCenter, uSize, uGrab, uVel;
uniform float uRot, uTime, uAmp, uRipT, uRipA, uPersp, uZAmp, uXYAmp;
out vec2 vUv;
out vec2 vLocal;
out vec3 vN;
out float vZ;
${NOISE}

vec3 disp(vec2 p){
  float diag = length(uSize * 0.5);
  vec2 dir = p - uGrab;
  // Точка хвата почти неподвижна, дальние края — самые «воздушные»
  float r = length(dir) / (diag * 1.55);
  float w = 0.22 + 0.78 * smoothstep(0.0, 1.0, r);
  vec2 q = p / diag;
  float t = uTime;

  float n1 = snoise(vec3(q * 0.85, t * 0.42));
  float n2 = snoise(vec3(q * 1.65 + 7.3, t * 0.71));
  float n3 = snoise(vec3(q * 0.70 + 3.1, t * 0.33 + 5.0));
  float n4 = snoise(vec3(q * 0.70 - 4.2, t * 0.33 + 9.0));

  float z = (n1 * 0.78 + n2 * 0.22) * diag * uZAmp;
  vec2 xy = vec2(n3, n4) * diag * uXYAmp;

  // Инерция: ткань отстаёт от пальца, наклоняется и надувается встречным «воздухом»
  float sp = length(uVel);
  vec2 vn = sp > 1.0 ? uVel / sp : vec2(0.0);
  float s = smoothstep(0.0, 1900.0, sp);
  float along = dot(dir / diag, vn);
  xy -= uVel * 0.0075 * w * w;
  z  -= along * s * diag * 0.20 * w;
  z  += s * diag * 0.12 * w * w * (0.6 + 0.4 * n3);

  vec3 d = vec3(xy, z) * uAmp * w;

  // Волна от точки касания в момент «подхвата»
  float rr = length(dir);
  float front = uRipT * 620.0;
  float rip = sin(rr * 0.05 - uRipT * 15.0) * exp(-uRipT * 3.0)
            * smoothstep(front, front - 70.0, rr) * smoothstep(0.0, 36.0, rr);
  d.z += rip * uRipA * diag * 0.055;
  return d;
}

void main(){
  vec2 p = (aUv - 0.5) * uSize;
  float e = 1.25;
  vec3 P0 = vec3(p, 0.0) + disp(p);
  vec3 Px = vec3(p + vec2(e, 0.0), 0.0) + disp(p + vec2(e, 0.0));
  vec3 Py = vec3(p + vec2(0.0, e), 0.0) + disp(p + vec2(0.0, e));
  vec3 n = normalize(cross(Px - P0, Py - P0));

  float c = cos(uRot), s = sin(uRot);
  mat2 R = mat2(c, s, -s, c);
  vec2 wp = R * P0.xy;
  n.xy = R * n.xy;

  float f = uPersp / (uPersp - P0.z);
  vec2 sp = uCenter + wp * f;
  gl_Position = vec4(sp.x / uRes.x * 2.0 - 1.0, 1.0 - sp.y / uRes.y * 2.0, 0.0, 1.0);
  vUv = aUv;
  vLocal = p;
  vN = n;
  vZ = P0.z;
}`;

const MESH_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vLocal;
in vec3 vN;
in float vZ;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uRadius, uAmp, uAlpha;
out vec4 o;

float sdRound(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main(){
  float sd = sdRound(vLocal, uSize * 0.5, uRadius);
  float aa = max(fwidth(sd), 1e-3);
  float a = 1.0 - smoothstep(-aa * 0.5, aa * 0.5, sd);
  if (a <= 0.0) discard;

  vec3 col = texture(uTex, vUv).rgb;
  vec3 n = normalize(vN);
  vec3 L = normalize(vec3(-0.35, -0.6, 0.72));
  float flat_ = L.z;
  float diff = dot(n, L);
  float k = clamp(uAmp, 0.0, 1.0);
  col *= 1.0 + (diff - flat_) * 1.55 * k;

  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = max(pow(max(dot(n, H), 0.0), 48.0) - pow(H.z, 48.0), 0.0);
  col += spec * 0.22 * k;
  col *= 1.0 - clamp(-vZ * 0.0045, 0.0, 0.14) * k;

  a *= uAlpha;
  o = vec4(col * a, a);
}`;

const SHADOW_VS = /* glsl */ `#version 300 es
precision highp float;
in vec2 aUv;
uniform vec2 uRes, uCenter, uSize, uOff;
uniform float uRot, uBlur;
out vec2 vL;
void main(){
  vec2 ext = uSize * 0.5 + uBlur * 2.0;
  vec2 p = (aUv * 2.0 - 1.0) * ext;
  vL = p;
  float c = cos(uRot), s = sin(uRot);
  vec2 sp = uCenter + uOff + mat2(c, s, -s, c) * p;
  gl_Position = vec4(sp.x / uRes.x * 2.0 - 1.0, 1.0 - sp.y / uRes.y * 2.0, 0.0, 1.0);
}`;

const SHADOW_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vL;
uniform vec2 uSize;
uniform float uRadius, uBlur, uOpacity;
out vec4 o;
float sdRound(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
void main(){
  float sd = sdRound(vL, uSize * 0.5 * vec2(0.94, 0.96), uRadius);
  float a = uOpacity * (1.0 - smoothstep(-uBlur, uBlur * 1.4, sd));
  o = vec4(vec3(0.02, 0.03, 0.05) * a, a);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const locs = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i).name;
    locs[name] = gl.getUniformLocation(p, name);
  }
  // Оптимизированные компилятором uniform'ы → null (no-op для gl.uniform*)
  const u = new Proxy(locs, { get: (o, k) => o[k] ?? null });
  return { p, u, aUv: gl.getAttribLocation(p, 'aUv') };
}

export class ClothRenderer {
  constructor(canvas, width, height, opts = {}) {
    this.canvas = canvas;
    this.W = width;
    this.H = height;
    this.opts = { persp: 280, zAmp: 0.38, xyAmp: 0.085, ...opts };
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: true, alpha: true });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.mesh = program(gl, MESH_VS, MESH_FS);
    this.shadow = program(gl, SHADOW_VS, SHADOW_FS);
    this.textures = new Map();

    // Сетка 36×52 — с запасом для плавных изгибов
    const COLS = 36, ROWS = 52;
    const uv = [];
    for (let y = 0; y <= ROWS; y++) for (let x = 0; x <= COLS; x++) uv.push(x / COLS, y / ROWS);
    const idx = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const i = y * (COLS + 1) + x;
      idx.push(i, i + 1, i + COLS + 1, i + 1, i + COLS + 2, i + COLS + 1);
    }
    this.count = idx.length;
    this.meshVao = gl.createVertexArray();
    gl.bindVertexArray(this.meshVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.mesh.aUv);
    gl.vertexAttribPointer(this.mesh.aUv, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

    this.quadVao = gl.createVertexArray();
    gl.bindVertexArray(this.quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.shadow.aUv);
    gl.vertexAttribPointer(this.shadow.aUv, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  resize(pxPerUnit) {
    const w = Math.round(this.W * pxPerUnit);
    const h = Math.round(this.H * pxPerUnit);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  texture(img) {
    let t = this.textures.get(img.src);
    if (t) return t;
    const gl = this.gl;
    t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.textures.set(img.src, t);
    return t;
  }

  // items: [{tex, cx, cy, w, h, rot, radius, grab:[x,y], vel:[x,y], time, amp, ripT, ripA, lift, alpha}]
  draw(items) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (const it of items) {
      // Тени: мягкая «парящая» + контактная
      if (it.lift > 0.002) {
        const s = this.shadow;
        gl.useProgram(s.p);
        gl.bindVertexArray(this.quadVao);
        gl.uniform2f(s.u.uRes, this.W, this.H);
        gl.uniform2f(s.u.uCenter, it.cx, it.cy);
        gl.uniform2f(s.u.uSize, it.w, it.h);
        gl.uniform1f(s.u.uRot, it.rot);
        gl.uniform1f(s.u.uRadius, it.radius);
        const L = it.lift;
        for (const [ox, oy, blur, op] of [
          [2 * L, 6 + 16 * L, 6 + 16 * L, 0.2 * L],
          [0, 2 + 2 * L, 3 + 2 * L, 0.07 * L],
        ]) {
          gl.uniform2f(s.u.uOff, ox, oy);
          gl.uniform1f(s.u.uBlur, blur);
          gl.uniform1f(s.u.uOpacity, op * it.alpha);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }

      const m = this.mesh;
      gl.useProgram(m.p);
      gl.bindVertexArray(this.meshVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, it.tex);
      gl.uniform1i(m.u.uTex, 0);
      gl.uniform2f(m.u.uRes, this.W, this.H);
      gl.uniform2f(m.u.uCenter, it.cx, it.cy);
      gl.uniform2f(m.u.uSize, it.w, it.h);
      gl.uniform2f(m.u.uGrab, it.grab[0], it.grab[1]);
      gl.uniform2f(m.u.uVel, it.vel[0], it.vel[1]);
      gl.uniform1f(m.u.uRot, it.rot);
      gl.uniform1f(m.u.uTime, it.time);
      gl.uniform1f(m.u.uAmp, it.amp);
      gl.uniform1f(m.u.uRipT, it.ripT);
      gl.uniform1f(m.u.uRipA, it.ripA);
      gl.uniform1f(m.u.uPersp, this.opts.persp);
      gl.uniform1f(m.u.uZAmp, this.opts.zAmp);
      gl.uniform1f(m.u.uXYAmp, this.opts.xyAmp);
      gl.uniform1f(m.u.uRadius, it.radius);
      gl.uniform1f(m.u.uAlpha, it.alpha);
      gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindVertexArray(null);
  }
}
