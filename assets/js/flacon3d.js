/* The ODYS flacon in three.js — one model shared by bottle3d.html (the interactive
   view) and studio/ (the product-photo robot), so both always draw the same bottle.

   Needs an importmap that resolves 'three' and 'three/addons/'. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/* Proportions read off the photograph, in units where the body is 1.0 wide:
   body 415×485 px, cap 190×220 px, so height = 1.17 and the cap is 0.53 tall. */
export const W = 1.0, H = 1.17, D = 0.46;
export const CAP_R = 0.229, CAP_H = 0.53;
export const WALL = 0.085;                 // glass thickness, ~35 px in the photo

/* Builds the scene around a renderer. Options:
     bg      backdrop colour (number)              default ivory 0xF3EBDD
     liquid  juice colour as a CSS string, or null for an empty flacon
     label   { num: '01', name: "L'ICÔNE", ink? } prints the label (white unless ink is given), or null
   Returns handles to everything a caller may want to move or recolour. */
export function buildFlacon(renderer, opts = {}) {
  const BG = opts.bg ?? 0xF3EBDD;

  /* Khronos PBR Neutral, not ACES: ACES is graded for film and pulls the cream
     background grey as it passes through the glass, so the flacon looks frosted.
     Neutral is the one meant for product shots — colours come out as authored. */
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);

  /* A real backdrop, not just scene.background: three.js renders the scene into a
     separate buffer for transmission, and the clear colour does not reach it — with
     only a background colour the inside of the bottle comes out grey.
     toneMapped:false, or the tone curve darkens the cream and the backdrop no longer
     matches the page behind the canvas. */
  const cyc = new THREE.MeshBasicMaterial({ color: BG, toneMapped: false });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), cyc);
  backdrop.position.set(0, 6, -8);
  scene.add(backdrop);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), cyc);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.004;        // clear of the base, which would z-fight at exactly 0
  scene.add(floor);

  /* a room gives the glass and the gold something to reflect —
     without an environment both read as flat grey plastic */
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  /* ── materials ─────────────────────────────────────────── */
  /* clear glass is mostly what is BEHIND it. A bright room plus clearcoat plus
     three strong lights turns a big flat face into a white mirror, so the
     reflections stay deliberately low and the background does the work. */
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.015,
    transmission: 1, thickness: 0.32, ior: 1.5,
    clearcoat: 0.18, clearcoatRoughness: 0.08,
    reflectivity: 0.5, envMapIntensity: 1.0, transparent: true,
    /* BackSide, not DoubleSide: both faces of a transmissive mesh land in one draw
       call with no sorting between them, and the two layers blend into a flat grey
       panel. Drawing only the far faces is what reads as clear glass. */
    side: THREE.BackSide
  });
  const gold = new THREE.MeshStandardMaterial({ color: 0xD9A441, metalness: 1, roughness: 0.16, envMapIntensity: 1.9 });
  const goldDark = new THREE.MeshStandardMaterial({ color: 0xA87C2A, metalness: 1, roughness: 0.3, envMapIntensity: 1.6 });
  const capBlack = new THREE.MeshPhysicalMaterial({
    color: 0x121212, metalness: 0, roughness: 0.55,
    clearcoat: 0.6, clearcoatRoughness: 0.35, envMapIntensity: 0.9
  });
  const tube = new THREE.MeshPhysicalMaterial({
    color: 0xEDEAE4, metalness: 0, roughness: 0.3,
    clearcoat: 0.5, clearcoatRoughness: 0.4, envMapIntensity: 0.8
  });

  /* ── the bottle ────────────────────────────────────────── */
  const bottle = new THREE.Group();
  scene.add(bottle);

  /* A hollow shell, not a solid block: the cavity is what makes it read as a bottle
     rather than a paperweight. It has to be ONE mesh — three.js keeps transmissive
     meshes out of each other's refraction pass, so a separate inner mesh would just
     paint a milky shell on top. Outer and inverted inner are merged instead. */
  const outer = new RoundedBoxGeometry(W, H, D, 6, 0.075);
  const inner = new RoundedBoxGeometry(W - WALL * 2, H - WALL * 2.4, D - WALL * 2, 5, 0.045);
  /* No mirroring: BackSide already flips normals in the shader, so an inner box
     with ordinary outward normals renders its far wall exactly like the outer one.
     Mirroring it first cancels that out and the near wall comes back as a grey slab. */
  inner.translate(0, WALL * 0.7, 0);     // thicker base than shoulders, like the real flacon
  const body = new THREE.Mesh(mergeGeometries([outer, inner]), glass);
  body.position.y = H / 2;
  bottle.add(body);

  /* neck: short glass collar the crimp sits on */
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.15, 0.09, 48), glass);
  neck.position.y = H + 0.035;
  bottle.add(neck);

  /* gold crimp ring under the cap */
  const crimp = new THREE.Mesh(new THREE.CylinderGeometry(CAP_R * 0.93, CAP_R * 0.93, 0.055, 64), gold);
  crimp.position.y = H + 0.085;
  bottle.add(crimp);
  const crimpLip = new THREE.Mesh(new THREE.TorusGeometry(CAP_R * 0.92, 0.012, 12, 64), goldDark);
  crimpLip.rotation.x = Math.PI / 2;
  crimpLip.position.y = H + 0.058;
  bottle.add(crimpLip);

  /* ── ribbed cap ────────────────────────────────────────── */
  /* fluting has to be in the silhouette, so it is geometry, not a normal map:
     push each ring of vertices in and out with a cosine of the angle */
  function fluted(r, h, ribs, depth, segs = 1) {
    const g = new THREE.CylinderGeometry(r, r, h, ribs * 6, segs, true);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), cur = Math.hypot(x, z);
      if (cur < 1e-6) continue;
      const a = Math.atan2(z, x);
      const k = (r - depth * (0.5 + 0.5 * Math.cos(a * ribs))) / cur;
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    g.computeVertexNormals();
    return g;
  }

  const cap = new THREE.Group();
  cap.position.y = H + 0.105;
  bottle.add(cap);
  const capSide = new THREE.Mesh(fluted(CAP_R, CAP_H, 40, 0.012), capBlack);
  capSide.position.y = CAP_H / 2;
  cap.add(capSide);
  /* gold band around the foot of the cap */
  const capFoot = new THREE.Mesh(new THREE.CylinderGeometry(CAP_R * 1.005, CAP_R * 1.005, 0.045, 64), gold);
  capFoot.position.y = 0.022;
  cap.add(capFoot);
  /* the top reads as a gold rim around a black disc */
  const capRim = new THREE.Mesh(new THREE.CylinderGeometry(CAP_R, CAP_R, 0.05, 64), gold);
  capRim.position.y = CAP_H - 0.02;
  cap.add(capRim);
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(CAP_R * 0.86, CAP_R * 0.86, 0.05, 64), capBlack);
  capTop.position.y = CAP_H - 0.028;
  cap.add(capTop);

  /* ── dip tube ──────────────────────────────────────────── */
  /* the cavity floor sits at WALL*2.4/2 above the base, so the tube has to stop
     there — any lower and its tip vanishes inside the thick glass bottom */
  const FLOOR = H / 2 - (H - WALL * 2.4) / 2 + WALL * 0.7 + 0.03;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, H - 0.09, 0),
    new THREE.Vector3(0, H * 0.70, 0),
    new THREE.Vector3(-0.04, H * 0.40, 0.02),
    new THREE.Vector3(-0.18, FLOOR + 0.12, 0.03),
    new THREE.Vector3(-0.30, FLOOR, 0.02)
  ]);
  const dip = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.011, 12, false), tube);
  bottle.add(dip);

  /* the stem the sprayer sits on, visible through the shoulder */
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.16, 24), tube);
  stem.position.y = H - 0.03;
  bottle.add(stem);

  /* ── the juice ─────────────────────────────────────────── */
  /* Opaque, not transmissive: the glass only refracts opaque meshes, so a
     transmissive liquid would vanish from inside it. A glossy tinted block seen
     through thick glass reads as juice at product-shot scale. */
  /* Shading is painted, not lit: in the photograph the juice is deepest in the
     middle and turns golden at the edges and the surface, where light comes through
     the walls. A flat colour reads as a painted block, whatever the lighting. */
  const juiceCanvas = document.createElement('canvas');
  juiceCanvas.width = 256; juiceCanvas.height = 256;
  const juiceTex = new THREE.CanvasTexture(juiceCanvas);
  juiceTex.colorSpace = THREE.SRGBColorSpace;
  const liquidMat = new THREE.MeshPhysicalMaterial({
    map: juiceTex, metalness: 0, roughness: 0.12,
    clearcoat: 0.5, clearcoatRoughness: 0.15, envMapIntensity: 0.35
  });
  function paintJuice(css) {
    const c = juiceCanvas.getContext('2d'), s = 256;
    const base = new THREE.Color(css);
    const hex = col => '#' + col.getHexString();
    const deep = hex(base.clone().multiplyScalar(0.62));
    const glow = hex(base.clone().lerp(new THREE.Color(0xFFF1D0), 0.38));
    let g = c.createRadialGradient(s / 2, s * 0.55, s * 0.08, s / 2, s * 0.55, s * 0.72);
    g.addColorStop(0, deep); g.addColorStop(0.55, hex(base)); g.addColorStop(1, glow);
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    g = c.createLinearGradient(0, 0, 0, s * 0.18);            // the lit surface line
    g.addColorStop(0, 'rgba(255,240,205,.55)'); g.addColorStop(1, 'rgba(255,240,205,0)');
    c.fillStyle = g; c.fillRect(0, 0, s, s * 0.18);
    juiceTex.needsUpdate = true;
  }
  const CAV_H = H - WALL * 2.4, CAV_BOTTOM = H / 2 + WALL * 0.7 - CAV_H / 2;
  const FILL = 0.9;                      // the photographed bottle is filled to the shoulder
  const liquid = new THREE.Mesh(
    new RoundedBoxGeometry(W - WALL * 2 - 0.012, CAV_H * FILL, D - WALL * 2 - 0.012, 5, 0.04),
    liquidMat
  );
  liquid.position.y = CAV_BOTTOM + CAV_H * FILL / 2 + 0.004;
  bottle.add(liquid);

  /* ── the printed label ─────────────────────────────────── */
  /* White type printed straight on the glass, as on the real bottle. A canvas
     texture on a plane just proud of the front face, drawn after the glass. */
  const LBL_W = W - WALL * 2, LBL_H = CAV_H;
  const lblCanvas = document.createElement('canvas');
  lblCanvas.width = 1024; lblCanvas.height = Math.round(1024 * LBL_H / LBL_W);
  const lblTex = new THREE.CanvasTexture(lblCanvas);
  lblTex.colorSpace = THREE.SRGBColorSpace;
  lblTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(LBL_W, LBL_H),
    new THREE.MeshBasicMaterial({ map: lblTex, transparent: true, depthWrite: false, toneMapped: false })
  );
  labelMesh.position.set(0, CAV_BOTTOM + CAV_H / 2, D / 2 + 0.002);
  bottle.add(labelMesh);

  function drawLabel(l) {
    const c = lblCanvas.getContext('2d'), w = lblCanvas.width, h = lblCanvas.height;
    c.clearRect(0, 0, w, h);
    if (!l) { lblTex.needsUpdate = true; return; }
    const serif = '"Cormorant Garamond", "Cormorant", Didot, Georgia, serif';
    const sans = 'Jost, "Helvetica Neue", Arial, sans-serif';
    c.fillStyle = l.ink || 'rgba(250,246,238,.96)';   // white on dark juice; a pale juice needs dark ink
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const line = (txt, font, y, track) => {
      c.font = font;
      c.letterSpacing = track + 'px';
      /* letterSpacing adds a gap after the last glyph too — shift by half to stay centred */
      c.fillText(txt, w / 2 + track / 2, y);
    };
    /* positions measured off the photograph, as fractions of the cavity height */
    line('ODYS', `500 ${w * 0.15}px ${serif}`, h * 0.29, w * 0.045);
    line('PARFUM', `400 ${w * 0.042}px ${sans}`, h * 0.37, w * 0.03);
    /* Cormorant has old-style figures only ('01' reads as 'OI'); the bottle has lining ones */
    line(l.num || '', `400 ${w * 0.064}px "Bodoni Moda", ${serif}`, h * 0.6, w * 0.006);
    line((l.name || '').toUpperCase(), `500 ${w * 0.058}px ${serif}`, h * 0.68, w * 0.016);
    line('EXTRAIT DE PARFUM', `400 ${w * 0.036}px ${sans}`, h * 0.9, w * 0.016);
    lblTex.needsUpdate = true;
  }

  function setLiquid(css) {
    liquid.visible = !!css;
    if (css) paintJuice(css);
  }
  function setLabel(l) { labelMesh.visible = !!l; drawLabel(l); }
  setLiquid(opts.liquid === undefined ? null : opts.liquid);
  setLabel(opts.label || null);

  /* ── ground shadow ─────────────────────────────────────── */
  /* a painted blob, not a shadow map: transmissive materials do not cast
     anything readable, and one texture is cheaper than a second render pass */
  function blobTexture() {
    const s = 256, cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    /* a wide flat core, then a long fade: a steep gradient right under the base
       gets refracted through the thick glass and reads as little tabs at the corners */
    g.addColorStop(0, 'rgba(26,15,16,.30)');
    g.addColorStop(0.34, 'rgba(26,15,16,.27)');
    g.addColorStop(0.62, 'rgba(26,15,16,.09)');
    g.addColorStop(1, 'rgba(26,15,16,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 1.7),
    new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.002;   // under the base, not through it: a plane crossing the
  shadow.renderOrder = -1;      // thick glass shows up as little tabs at the bottom corners
  scene.add(shadow);

  /* ── lights ────────────────────────────────────────────── */
  /* the environment does most of the work; these three carve the edges of the glass */
  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(2.5, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff0d8, 1.1); rim.position.set(-3, 2.2, -2.5); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-1.5, 1, 3); scene.add(fill);

  return { scene, bottle, glass, gold, capBlack, liquid, labelMesh, setLiquid, setLabel };
}
