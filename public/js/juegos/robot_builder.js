/* ══════════════════════════════════════════════════════════════
   ROBOT LAB 3D — Construye un robot en 3D y hazlo cumplir misiones
   Usa Three.js (cargado desde CDN)
   ══════════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  /* ══════════════ CONFIGURACIÓN ══════════════ */
  const GRID_SIZE = 6;
  const CELL = 1;

  const PIEZAS_DEF = [
    { id:'piernas',     nombre:'PIERNAS',     nombreEn:'LEGS',       color:0xe879f9, slotY:0.00,  requiereCarga:false },
    { id:'cuerpo',      nombre:'CUERPO',      nombreEn:'BODY',       color:0xa3e635, slotY:0.55,  requiereCarga:false },
    { id:'motor',       nombre:'MOTOR',       nombreEn:'MOTOR',      color:0xfbbf24, slotY:0.88,  requiereCarga:false },
    { id:'bateria',     nombre:'BATERÍA',     nombreEn:'BATTERY',    color:0xf87171, slotY:0.78,  slotX:0.42, slotZ:0.15, requiereCarga:true },
    { id:'controlador', nombre:'CONTROLADOR', nombreEn:'CONTROLLER', color:0x22d3ee, slotY:1.18,  requiereCarga:false }
  ];

  const MISIONES = [
    { es:'Llega a la estrella', en:'Reach the star',
      inicio:{col:0,row:5}, meta:{col:4,row:5}, muros:[] },
    { es:'Esquiva el obstáculo', en:'Avoid the obstacle',
      inicio:{col:0,row:5}, meta:{col:5,row:2}, muros:[{col:2,row:4},{col:2,row:3},{col:2,row:2}] },
    { es:'Encuentra el camino largo', en:'Find the long path',
      inicio:{col:0,row:5}, meta:{col:5,row:0}, muros:[{col:1,row:3},{col:2,row:3},{col:3,row:3}] }
  ];

  /* ══════════════ ESTADO GLOBAL ══════════════ */
  let scene, camera, renderer, canvas, clock;
  let animId = null;
  let raycaster, ndc;
  let dragging = null;
  let dragPlane = null;
  let dragOffset = null;
  let piezas = [];
  let piezasColocadas = new Set();
  let robotAssembly = null;
  let chargerGroup = null;
  let chargerFill = null;
  let chargerLight = null;
  let bateriaCargada = false;
  let cargando = false;
  let api = null;
  let contenedor = null;
  let fase = 'armar';
  let misionState = null;
  let activo = true;
  let pointerBound = false;
  let slotVisuales = {};
  let esMovil = false;

  /* ══════════════ HELPERS ══════════════ */
  const $ = id => document.getElementById(id);
  const matMetal = (color, opts = {}) => new THREE.MeshStandardMaterial({
    color, metalness: 0.75, roughness: 0.25,
    emissive: color, emissiveIntensity: 0.15,
    ...opts
  });
  const matGlow = (color) => new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.9
  });

  /* ══════════════ CARGAR THREE.JS ══════════════ */
  function cargarThree(cb){
    if (window.THREE) return cb();
    const urls = [
      'https://cdn.jsdelivr.net/npm/three@0.140.0/build/three.min.js',
      'https://unpkg.com/three@0.140.0/build/three.min.js'
    ];
    let i = 0;
    function intentar(){
      if (i >= urls.length){
        console.error('Three.js no disponible');
        window.mostrarToast('⚠️ No hay internet para el juego 3D');
        return;
      }
      const s = document.createElement('script');
      s.src = urls[i++];
      s.onload = cb;
      s.onerror = intentar;
      document.head.appendChild(s);
    }
    intentar();
  }

  /* ══════════════ INYECTAR ESTILOS ══════════════ */
  function inyectarEstilos(){
    if (document.getElementById('estilo-rb3d')) return;
    const s = document.createElement('style');
    s.id = 'estilo-rb3d';
    s.textContent = `
      .rb3d-wrap{
        flex:1; min-height:0;
        display:flex; flex-direction:column; gap:6px;
        overflow:hidden;
      }
      .rb3d-header{
        background:rgba(30,41,59,.92);
        border:2px solid rgba(34,211,238,.4);
        border-radius:14px;
        padding:6px 10px;
        text-align:center;
        box-shadow:0 0 18px rgba(34,211,238,.2);
        flex-shrink:0;
      }
      .rb3d-header .es{
        font-family:'Orbitron',sans-serif;
        font-size:clamp(12px,3.4vw,16px);
        font-weight:900; color:#f1f5f9;
      }
      .rb3d-header .en{
        font-family:'Orbitron',sans-serif;
        font-size:clamp(10px,2.8vw,12px);
        font-weight:700; color:#e879f9;
        margin-top:1px;
      }
      .rb3d-header .paso{
        font-family:'Orbitron',sans-serif;
        font-size:clamp(10px,2.8vw,13px);
        font-weight:700; color:#22d3ee;
        margin-top:3px;
        text-shadow:0 0 8px rgba(34,211,238,.5);
      }
      .rb3d-canvas-wrap{
        flex:1; min-height:0;
        position:relative;
        border-radius:16px;
        overflow:hidden;
        border:2px solid rgba(34,211,238,.3);
        box-shadow:0 0 25px rgba(34,211,238,.25);
        background:#05080f;
      }
      .rb3d-canvas-wrap canvas{
        position:absolute;
        inset:0;
        width:100% !important;
        height:100% !important;
        display:block;
        touch-action:none;
      }
      .rb3d-loading{
        position:absolute; inset:0;
        display:flex; align-items:center; justify-content:center;
        color:#22d3ee;
        font-family:'Orbitron',sans-serif;
        font-size:14px; font-weight:700;
        background:linear-gradient(160deg,#0a1526,#0f172a);
        letter-spacing:1px;
        animation:parpadeoLoad 1.4s infinite;
      }
      @keyframes parpadeoLoad{
        0%,100%{opacity:.5}
        50%{opacity:1}
      }
      .rb3d-controls{
        flex-shrink:0;
        display:none;
        flex-direction:column;
        gap:5px;
      }
      .rb3d-controls.activo{ display:flex; }
      .rb3d-programa{
        display:flex; gap:4px;
        justify-content:center;
        align-items:center;
        min-height:34px;
        padding:4px 6px;
        background:rgba(15,23,42,.7);
        border:1px solid rgba(34,211,238,.2);
        border-radius:12px;
        overflow-x:auto;
        scrollbar-width:none;
      }
      .rb3d-programa::-webkit-scrollbar{ display:none; }
      .rb3d-slot{
        flex:0 0 auto;
        width:26px; height:26px;
        border-radius:7px;
        background:rgba(34,211,238,.05);
        border:2px dashed rgba(34,211,238,.3);
        display:flex; align-items:center; justify-content:center;
        font-size:14px;
        font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;
      }
      .rb3d-slot.lleno{
        background:rgba(30,41,59,.9);
        border:2px solid #22d3ee;
        box-shadow:0 0 8px rgba(34,211,238,.4);
      }
      .rb3d-dpad{
        display:grid;
        grid-template-areas:". u ." "l c r" ". d .";
        grid-template-columns:repeat(3,1fr);
        grid-template-rows:repeat(3,1fr);
        gap:5px;
        width:min(46vw,180px);
        margin:0 auto;
      }
      .rb3d-dir{
        aspect-ratio:1;
        border:2px solid rgba(34,211,238,.3);
        border-radius:12px;
        background:rgba(30,41,59,.85);
        color:#22d3ee;
        font-size:clamp(16px,5vw,22px);
        cursor:pointer;
        box-shadow:0 4px 0 rgba(0,0,0,.4);
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        gap:0; padding:1px;
        font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;
        line-height:1;
      }
      .rb3d-dir:active{ transform:translateY(3px); box-shadow:0 1px 0 rgba(0,0,0,.3); }
      .rb3d-dir:disabled{ opacity:.4; }
      .rb3d-dir .label{
        font-family:'Orbitron',sans-serif;
        font-size:clamp(6px,1.6vw,8px);
        font-weight:700;
        color:#22d3ee;
        letter-spacing:.5px;
      }
      .rb3d-go{
        grid-area:c;
        border:2px solid #a3e635;
        border-radius:50%;
        background:rgba(163,230,53,.15);
        color:#a3e635;
        font-size:clamp(18px,5.5vw,24px);
        cursor:pointer;
        box-shadow:0 4px 0 rgba(0,0,0,.4), 0 0 18px rgba(163,230,53,.3);
        animation:rbLatido 1.6s infinite;
      }
      @keyframes rbLatido{
        0%,100%{ transform:scale(1); }
        50%{ transform:scale(1.07); }
      }
      .rb3d-go:active{ transform:translateY(3px) scale(.95); }
      .rb3d-go:disabled{ animation:none; opacity:.4; }
      .rb3d-acciones{
        display:flex; gap:6px;
      }
      .rb3d-acciones button{
        flex:1;
        font-family:inherit;
        font-size:13px; font-weight:800;
        padding:8px;
        border-radius:12px;
        border:2px solid;
        background:rgba(30,41,59,.85);
        cursor:pointer;
      }
      .rb3d-acciones .quitar{ border-color:#fbbf24; color:#fbbf24; }
      .rb3d-acciones .borrar{ border-color:#f87171; color:#f87171; }
      .rb3d-overlay{
        position:absolute; inset:0;
        display:flex; flex-direction:column;
        align-items:center; justify-content:center;
        gap:8px;
        background:rgba(15,23,42,.85);
        animation:fadeIn .35s;
        z-index:50;
        padding:14px;
        text-align:center;
      }
      @keyframes fadeIn{ from{opacity:0} to{opacity:1} }
      .rb3d-overlay .big{
        font-size:clamp(38px,14vw,72px);
        animation:saltar .6s infinite alternate;
      }
      .rb3d-overlay .titulo{
        font-family:'Orbitron',sans-serif;
        font-size:clamp(20px,6.5vw,32px);
        font-weight:900;
        color:#a3e635;
        text-shadow:0 0 30px rgba(163,230,53,.6);
        letter-spacing:1px;
      }
      .rb3d-overlay .sub{
        font-size:clamp(13px,4vw,17px);
        font-weight:800;
        color:#94a3b8;
      }
    `;
    document.head.appendChild(s);
  }

  /* ══════════════ INICIALIZAR ESCENA ══════════════ */
  function iniciarEscena(){
    const wrap = $('rb3d-canvas-wrap');
    if (!wrap) return;
    const loading = $('rb3d-loading');
    if (loading) loading.remove();

    const W = wrap.clientWidth;
    const H = wrap.clientHeight;

    // Detectar si es móvil para adaptar la cámara
    esMovil = W < 600;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1526, 14, 28);

    // Cámara adaptada al tamaño de pantalla
    const FOV = esMovil ? 65 : 50;
    const CAM_Y = esMovil ? 5.5 : 3.5;
    const CAM_Z = esMovil ? 11  : 7.5;

    camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 100);
    camera.position.set(0, CAM_Y, CAM_Z);
    camera.lookAt(0, 0.8, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    // En móvil reducir pixel ratio para mejor rendimiento
    renderer.setPixelRatio(esMovil ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05080f, 1);
    wrap.appendChild(renderer.domElement);
    canvas = renderer.domElement;

    raycaster = new THREE.Raycaster();
    ndc = new THREE.Vector2();
    clock = new THREE.Clock();

    scene.add(new THREE.AmbientLight(0x99bbff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 6);
    scene.add(dir);
    const cyan = new THREE.PointLight(0x22d3ee, 1.2, 12);
    cyan.position.set(-3, 3, 2);
    scene.add(cyan);
    const pink = new THREE.PointLight(0xe879f9, 1.0, 12);
    pink.position.set(3, 3, -2);
    scene.add(pink);

    buildLab();
    buildSlots();
    buildCharger();
    buildPieces();
    buildRobotBase();

    if (!pointerBound){
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      window.addEventListener('resize', onResize);
      pointerBound = true;
    }

    actualizarHeaderArmar();
    window.decir('Arrastra las piezas para armar el robot');

    animar();
  }

  function onResize(){
    if (!renderer || !canvas || !canvas.parentElement) return;
    const wrap = canvas.parentElement;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    if (W === 0 || H === 0) return;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }

  /* ══════════════ ESCENARIO: LABORATORIO ══════════════ */
  function buildLab(){
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x111b2e, roughness: 0.85, metalness: 0.3 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const grid = new THREE.GridHelper(30, 30, 0x22d3ee, 0x1e3a5f);
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    grid.position.y = 0.001;
    scene.add(grid);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f1e34, roughness: 0.9, metalness: 0.2 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), wallMat);
    backWall.position.set(0, 4, -8);
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMat.clone());
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-10, 4, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMat.clone());
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(10, 4, 0);
    scene.add(rightWall);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshStandardMaterial({ color: 0x0a1526, roughness: 1 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 8;
    scene.add(ceiling);

    for (let i = 0; i < 3; i++){
      const x = -6 + i * 6;
      const shelf = new THREE.Group();
      const matS = matMetal(0x1e293b, { emissiveIntensity: 0.05, metalness: 0.5, roughness: 0.6 });
      for (let j = 0; j < 4; j++){
        const p = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.6), matS);
        p.position.set(0, 1.2 + j * 0.8, 0);
        shelf.add(p);
      }
      shelf.position.set(x, 0, -7.6);
      scene.add(shelf);

      for (let j = 0; j < 3; j++){
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.4, 0.4),
          matMetal([0x22d3ee, 0xe879f9, 0xa3e635][j], { emissiveIntensity: 0.4 })
        );
        box.position.set(x - 0.5 + j * 0.5, 1.4, -7.6);
        scene.add(box);
      }
    }

    const monitorBase = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.8, 0.1),
      matMetal(0x1e293b, { emissiveIntensity: 0.1 })
    );
    monitorBase.position.set(0, 4.5, -7.9);
    scene.add(monitorBase);

    const pantalla = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 1.5),
      matGlow(0x22d3ee)
    );
    pantalla.position.set(0, 4.5, -7.83);
    pantalla.material.opacity = 0.35;
    scene.add(pantalla);

    for (let i = 0; i < 5; i++){
      const linea = new THREE.Mesh(
        new THREE.BoxGeometry(0.4 + Math.random() * 0.3, 0.08, 0.01),
        matGlow(0xa3e635)
      );
      linea.position.set(-1 + i * 0.5, 4.5, -7.82);
      scene.add(linea);
    }

    const tuboMat = matMetal(0x334155, { metalness: 0.9, roughness: 0.15 });
    for (let i = 0; i < 4; i++){
      const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8), tuboMat);
      tubo.rotation.z = Math.PI / 2;
      tubo.position.set(-7 + i * 4.5, 6.2, -7.9);
      scene.add(tubo);
    }

    for (let i = 0; i < 4; i++){
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), matGlow(0x22d3ee));
      l.position.set(-6 + i * 4, 7.6, -2);
      scene.add(l);
      const point = new THREE.PointLight(0x22d3ee, 0.5, 8);
      point.position.copy(l.position);
      scene.add(point);
    }

    const mesa = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.4, 0.15, 32),
      matMetal(0x1e293b, { metalness: 0.6, roughness: 0.4 })
    );
    mesa.position.y = 0.075;
    scene.add(mesa);

    const ringMesa = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.04, 8, 48),
      matGlow(0x22d3ee)
    );
    ringMesa.rotation.x = -Math.PI / 2;
    ringMesa.position.y = 0.16;
    scene.add(ringMesa);

    const brazo = new THREE.Group();
    const baseBrazo = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.4, 12), matMetal(0x334155));
    baseBrazo.position.y = 0.2;
    brazo.add(baseBrazo);
    const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 8), matMetal(0xfbbf24));
    seg1.position.set(0, 1.15, 0);
    seg1.rotation.z = 0.35;
    brazo.add(seg1);
    const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), matMetal(0xfbbf24));
    seg2.position.set(0.55, 2.05, 0);
    seg2.rotation.z = -0.5;
    brazo.add(seg2);
    brazo.position.set(-7, 0, -4);
    scene.add(brazo);

    for (let i = 0; i < 3; i++){
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 2, 1.2),
        matMetal(0x1a2740, { emissiveIntensity: 0.15, metalness: 0.5, roughness: 0.5 })
      );
      m.position.set(6 + i * 1.5, 1, -5 - i * 0.5);
      scene.add(m);
      const detalle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.02), matGlow(0xa3e635));
      detalle.position.set(6 + i * 1.5, 1.5, -5 - i * 0.5 + 0.61);
      scene.add(detalle);
    }
  }

  /* ══════════════ SLOTS DE ARMADO (fantasmas) ══════════════ */
  function buildSlots(){
    const slotMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24, transparent: true, opacity: 0.22, side: THREE.DoubleSide
    });

    PIEZAS_DEF.forEach(p => {
      const geo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
      const ghost = new THREE.Mesh(geo, slotMat.clone());
      ghost.position.set(p.slotX || 0, p.slotY + 0.28, p.slotZ || 0);
      scene.add(ghost);
      slotVisuales[p.id] = ghost;
    });
  }

  /* ══════════════ MÓDULO DE CARGA ══════════════ */
  function buildCharger(){
    const charger = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, 0.2, 16),
      matMetal(0x1e293b, { metalness: 0.7, roughness: 0.3 })
    );
    base.position.y = 0.1;
    charger.add(base);

    const columna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 0.5, 12),
      matMetal(0x334155, { metalness: 0.8, roughness: 0.2 })
    );
    columna.position.y = 0.45;
    charger.add(columna);

    const cabeza = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.5),
      matMetal(0x1e293b, { metalness: 0.6, roughness: 0.4 })
    );
    cabeza.position.y = 0.9;
    charger.add(cabeza);

    const anillo = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.035, 8, 24),
      matGlow(0xfbbf24)
    );
    anillo.rotation.x = -Math.PI / 2;
    anillo.position.y = 0.95;
    charger.add(anillo);

    const bg = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.08, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    bg.position.set(0, 1.25, 0);
    charger.add(bg);

    const fill = new THREE.Mesh(
      new THREE.BoxGeometry(0.0, 0.06, 0.06),
      matGlow(0xa3e635)
    );
    fill.position.set(-0.3, 1.25, 0);
    charger.add(fill);
    chargerFill = fill;

    const l = new THREE.PointLight(0xfbbf24, 0, 4);
    l.position.set(0, 1.2, 0);
    charger.add(l);
    chargerLight = l;

    const label = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.15, 0.02),
      matGlow(0xfbbf24)
    );
    label.position.set(0, 1.55, 0);
    charger.add(label);

    charger.position.set(-5.5, 0, 2);
    scene.add(charger);
    chargerGroup = charger;
  }

  /* ══════════════ PIEZAS 3D DEL ROBOT ══════════════ */
  function buildRobotBase(){
    robotAssembly = new THREE.Group();
    robotAssembly.position.set(0, 0, 0);
    scene.add(robotAssembly);
  }

  function makePiernas(){
    const g = new THREE.Group();
    const m = matMetal(0xe879f9);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.32), m);
    base.position.y = 0.5;
    g.add(base);
    [-0.15, 0.15].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 8), m);
      leg.position.set(x, 0.23, 0);
      g.add(leg);
      const pie = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.06, 0.24), m);
      pie.position.set(x, 0.03, 0.04);
      g.add(pie);
    });
    return g;
  }

  function makeCuerpo(){
    const g = new THREE.Group();
    const m = matMetal(0xa3e635);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.36), m);
    torso.position.y = 0.28;
    g.add(torso);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.02), matGlow(0x22d3ee));
    panel.position.set(0, 0.32, 0.19);
    g.add(panel);
    [-0.32, 0.32].forEach(x => {
      const hom = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), m);
      hom.position.set(x, 0.5, 0);
      g.add(hom);
    });
    return g;
  }

  function makeMotor(){
    const g = new THREE.Group();
    const m = matMetal(0xfbbf24);
    const centro = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.24), m);
    centro.position.y = 0;
    g.add(centro);
    [-1, 1].forEach(sx => {
      const brazo = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 8), m);
      brazo.position.set(sx * 0.35, 0, 0);
      brazo.rotation.z = sx * 1.15;
      g.add(brazo);
      const mano = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), m);
      mano.position.set(sx * 0.52, -0.16, 0);
      g.add(mano);
    });
    return g;
  }

  function makeBateria(){
    const g = new THREE.Group();
    const m = matMetal(0xf87171, { emissiveIntensity: 0.35 });
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 12), m);
    cuerpo.position.y = 0;
    g.add(cuerpo);
    const pos = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 8), matMetal(0x94a3b8));
    pos.position.y = 0.18;
    g.add(pos);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 6, 20), matGlow(0xfbbf24));
    aro.rotation.x = Math.PI / 2;
    aro.position.y = 0;
    g.add(aro);
    return g;
  }

  function makeControlador(){
    const g = new THREE.Group();
    const m = matMetal(0x22d3ee);
    const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.36, 0.36), m);
    cabeza.position.y = 0.18;
    g.add(cabeza);
    [-0.1, 0.1].forEach(x => {
      const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), matGlow(0xfbbf24));
      ojo.position.set(x, 0.22, 0.19);
      g.add(ojo);
    });
    const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), m);
    antena.position.set(0, 0.47, 0);
    g.add(antena);
    const punta = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), matGlow(0xe879f9));
    punta.position.set(0, 0.6, 0);
    g.add(punta);
    return g;
  }

  function buildPieces(){
    const makers = {
      piernas: makePiernas,
      cuerpo: makeCuerpo,
      motor: makeMotor,
      bateria: makeBateria,
      controlador: makeControlador
    };

    // Posiciones adaptadas: en móvil las piezas están más separadas pero dentro de la vista
    const posiciones = esMovil ? {
      piernas:     new THREE.Vector3(2.2, 0.55, 2.2),
      cuerpo:      new THREE.Vector3(-2.2, 0.55, 2.2),
      motor:       new THREE.Vector3(2.2, 0.55, -2.2),
      bateria:     new THREE.Vector3(-2.5, 0.55, -2.2),
      controlador: new THREE.Vector3(0, 0.85, 3.0)
    } : {
      piernas:     new THREE.Vector3(2.5, 0.55, 2.5),
      cuerpo:      new THREE.Vector3(-2.5, 0.55, 2.5),
      motor:       new THREE.Vector3(2.5, 0.55, -2.5),
      bateria:     new THREE.Vector3(-2.8, 0.55, -2.5),
      controlador: new THREE.Vector3(0, 0.85, 3.5)
    };

    PIEZAS_DEF.forEach(def => {
      const group = makers[def.id]();
      group.position.copy(posiciones[def.id]);
      group.userData = { pieceId: def.id };

      // En móvil, agrandar las piezas para que se puedan agarrar mejor
      if (esMovil){
        group.scale.setScalar(1.3);
      }

      group.traverse(o => {
        if (o.isMesh){ o.userData.parentPiece = def.id; }
      });

      scene.add(group);
      piezas.push({ def, group, originalPos: posiciones[def.id].clone(), placed: false });
    });
  }

  /* ══════════════ POINTER EVENTS (DRAG & DROP) ══════════════ */
  function setNDC(e){
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onPointerDown(e){
    if (fase !== 'armar' || dragging || cargando) return;
    setNDC(e);
    raycaster.setFromCamera(ndc, camera);

    const activos = piezas.filter(p => !p.placed).map(p => p.group);
    const hits = raycaster.intersectObjects(activos, true);
    if (!hits.length) return;

    let obj = hits[0].object;
    while (obj.parent && !obj.userData.pieceId) obj = obj.parent;
    const pieceId = obj.userData.pieceId;
    const pieza = piezas.find(p => p.def.id === pieceId);
    if (!pieza) return;

    dragging = pieza;
    canvas.setPointerCapture(e.pointerId);

    dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -pieza.group.position.y);

    const punto = new THREE.Vector3();
    raycaster.ray.intersectPlane(dragPlane, punto);
    dragOffset = pieza.group.position.clone().sub(punto);

    pieza.group.position.y += 0.15;
    pieza.group.scale.setScalar(esMovil ? 1.5 : 1.15);
  }

  function onPointerMove(e){
    if (!dragging || !dragOffset) return;
    setNDC(e);
    raycaster.setFromCamera(ndc, camera);
    const punto = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(dragPlane, punto)) return;

    dragging.group.position.x = punto.x + dragOffset.x;
    dragging.group.position.z = punto.z + dragOffset.z;
  }

  function onPointerUp(e){
    if (!dragging) return;
    const pieza = dragging;
    dragging = null;

    pieza.group.scale.setScalar(esMovil ? 1.3 : 1);

    const def = pieza.def;
    const slotPos = new THREE.Vector3(def.slotX || 0, def.slotY, def.slotZ || 0);

    // En móvil el umbral es más generoso para facilitar el drop
    const umbral = esMovil ? 1.4 : 1.0;
    const dist = Math.hypot(
      pieza.group.position.x - slotPos.x,
      pieza.group.position.z - slotPos.z
    );

    if (dist < umbral){
      if (def.requiereCarga && !bateriaCargada){
        window.tono(180, 0.3, 'sawtooth');
        window.decir('Primero carga la batería en el cargador');
        window.mostrarToast('🔋 ¡Carga la batería primero!');
        returnAPosicion(pieza);
        return;
      }
      colocarPieza(pieza);
      return;
    }

    if (def.requiereCarga && !bateriaCargada && chargerGroup){
      const cp = chargerGroup.position;
      const dc = Math.hypot(pieza.group.position.x - cp.x, pieza.group.position.z - cp.z);
      if (dc < umbral + 0.2){
        iniciarCarga(pieza);
        return;
      }
    }

    returnAPosicion(pieza);
  }

  function returnAPosicion(pieza){
    const p = pieza.originalPos;
    animarPosicion(pieza.group, p, 400);
  }

  function animarPosicion(obj, destino, ms){
    const inicio = obj.position.clone();
    const t0 = performance.now();
    function step(){
      const t = Math.min(1, (performance.now() - t0) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      obj.position.lerpVectors(inicio, destino, e);
      if (t < 1) requestAnimationFrame(step);
    }
    step();
  }

  /* ══════════════ COLOCAR PIEZA EN SLOT ══════════════ */
  function colocarPieza(pieza){
    const def = pieza.def;
    const destino = new THREE.Vector3(def.slotX || 0, def.slotY, def.slotZ || 0);

    window.tono(700, 0.12, 'triangle', 0.2);
    window.decir(def.nombre + '. ' + def.nombreEn);

    animarPosicion(pieza.group, destino, 350);

    pieza.placed = true;
    piezasColocadas.add(def.id);

    const ghost = slotVisuales[def.id];
    if (ghost){
      ghost.material.opacity = 0.05;
    }

    setTimeout(() => {
      pieza.group.scale.setScalar(esMovil ? 1.5 : 1.25);
      setTimeout(() => pieza.group.scale.setScalar(esMovil ? 1.3 : 1), 180);
    }, 350);

    setTimeout(() => {
      if (piezasColocadas.size === PIEZAS_DEF.length){
        robotArmado();
      }
    }, 500);
  }

  /* ══════════════ CARGA DE BATERÍA ══════════════ */
  function iniciarCarga(pieza){
    cargando = true;
    bateriaCargada = false;

    const cp = chargerGroup.position.clone();
    cp.y = 0.9;
    cp.x += 0.15;
    animarPosicion(pieza.group, cp, 400);

    let pct = 0;
    const intervalo = setInterval(() => {
      pct += 3;
      if (pct > 100) pct = 100;

      if (chargerFill){
        chargerFill.scale.x = pct / 100;
        chargerFill.position.x = -0.3 + (pct / 100) * 0.3;
      }
      if (chargerLight){
        chargerLight.intensity = (pct / 100) * 1.5 + Math.sin(Date.now() / 100) * 0.2;
      }
      if (pct % 15 === 0 && pct < 100){
        window.tono(400 + pct * 5, 0.06, 'square', 0.06);
      }

      if (pct >= 100){
        clearInterval(intervalo);
        cargando = false;
        bateriaCargada = true;

        window.melodia([880, 1100, 1320]);
        window.decir('Batería cargada');
        window.mostrarToast('🔋 ¡Batería cargada!');

        pieza.group.traverse(o => {
          if (o.isMesh && o.material && o.material.emissive){
            o.material.emissive.setHex(0xa3e635);
          }
        });

        setTimeout(() => {
          const nuevaPos = new THREE.Vector3(-4, 0.55, 0.5);
          pieza.originalPos.copy(nuevaPos);
          animarPosicion(pieza.group, nuevaPos, 500);
          if (chargerLight) chargerLight.intensity = 0;
          if (chargerFill){
            chargerFill.scale.x = 1;
            chargerFill.position.x = 0;
          }
        }, 400);
      }
    }, 100);
  }

  /* ══════════════ HEADER ══════════════ */
  function actualizarHeaderArmar(){
    const h = $('rb3d-header');
    if (!h) return;
    const faltan = PIEZAS_DEF.length - piezasColocadas.size;
    h.innerHTML = `
      <div class="es">🔧 Arma el robot: coloca ${faltan} pieza${faltan !== 1 ? 's' : ''}</div>
      <div class="en">Build the robot: place ${faltan} part${faltan !== 1 ? 's' : ''}</div>
      <div class="paso">${bateriaCargada ? '⚡ Batería cargada ✓' : '🔋 Arrastra la BATERÍA al CARGADOR (aro amarillo)'}</div>
    `;
  }

  /* ══════════════ ROBOT ARMADO → MISIÓN ══════════════ */
  function robotArmado(){
    const h = $('rb3d-header');
    if (h){
      h.innerHTML = `
        <div class="es">🎉 ¡ROBOT ARMADO!</div>
        <div class="en">🎉 ROBOT ASSEMBLED!</div>
        <div class="paso">Preparando misión…</div>
      `;
    }
    window.melodia([523,659,784,1047,1319]);
    window.decir('¡Robot armado! Ahora cumplamos una misión.');

    let t = 0;
    const giroAnim = setInterval(() => {
      t += 0.06;
      if (robotAssembly) robotAssembly.rotation.y = Math.sin(t) * 0.4;
      if (t > 3) clearInterval(giroAnim);
    }, 40);

    setTimeout(() => {
      // Vista de misión adaptada a móvil o escritorio
      const camY = esMovil ? 12 : 8.5;
      const camZ = esMovil ? 9  : 6;
      animarCamara(new THREE.Vector3(0, camY, camZ), new THREE.Vector3(0, 0.3, 0), 900);
      setTimeout(() => iniciarMision(0), 1000);
    }, 1800);
  }

  function animarCamara(destPos, destLook, ms){
    const initPos = camera.position.clone();
    const initLook = new THREE.Vector3(0, 1, 0);
    const t0 = performance.now();
    function step(){
      const t = Math.min(1, (performance.now() - t0) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(initPos, destPos, e);
      const look = initLook.clone().lerp(destLook, e);
      camera.lookAt(look);
      if (t < 1) requestAnimationFrame(step);
    }
    step();
  }

  /* ══════════════ MODO MISIÓN ══════════════ */
  function iniciarMision(idx){
    if (idx >= MISIONES.length){
      window.melodia([523,659,784,1047,1319]);
      api.sumarPuntos(30);
      api.fin(api.puntosActuales());
      return;
    }
    fase = 'mision';

    const m = MISIONES[idx];
    misionState = {
      idx, mision: m,
      programa: [],
      ejecutando: false,
      robotCol: m.inicio.col,
      robotRow: m.inicio.row,
      exito: false
    };

    buildGridVisual();

    const startWorld = celdaAWorld(m.inicio.col, m.inicio.row);
    robotAssembly.position.set(startWorld.x, 0, startWorld.z);
    robotAssembly.rotation.y = Math.PI;

    buildMeta(m.meta);

    m.muros.forEach(mu => buildMuro(mu));

    const h = $('rb3d-header');
    h.innerHTML = `
      <div class="es">🎯 Misión ${idx+1}: ${m.es}</div>
      <div class="en">🎯 Mission ${idx+1}: ${m.en}</div>
      <div class="paso">Programa los pasos y presiona ▶ GO</div>
    `;
    window.decirBilingue(
      'Misión ' + (idx+1) + '. ' + m.es,
      'Mission ' + (idx+1) + '. ' + m.en
    );

    buildControlesMision();
  }

  function buildGridVisual(){
    const prev = scene.getObjectByName('grid-mision');
    if (prev) scene.remove(prev);

    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x22d3ee, 0x22d3ee);
    grid.name = 'grid-mision';
    grid.material.opacity = 0.55;
    grid.material.transparent = true;
    grid.position.y = 0.02;
    scene.add(grid);

    const piso = new THREE.Mesh(
      new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE),
      new THREE.MeshBasicMaterial({
        color: 0x0a1a2f, transparent: true, opacity: 0.55
      })
    );
    piso.rotation.x = -Math.PI / 2;
    piso.position.y = 0.015;
    piso.name = 'grid-mision-piso';
    scene.add(piso);

    ['meta-mision', 'muro-mision'].forEach(n => {
      const objs = scene.children.filter(o => o.name === n);
      objs.forEach(o => scene.remove(o));
    });
  }

  function celdaAWorld(col, row){
    const offset = (GRID_SIZE - 1) / 2;
    return { x: (col - offset) * CELL, z: (row - offset) * CELL };
  }

  function buildMeta(meta){
    const w = celdaAWorld(meta.col, meta.row);
    const group = new THREE.Group();
    group.name = 'meta-mision';

    const anillo = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.05, 8, 24),
      matGlow(0xfbbf24)
    );
    anillo.rotation.x = -Math.PI / 2;
    anillo.position.y = 0.05;
    group.add(anillo);

    const estrella = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.25, 0),
      matGlow(0xfbbf24)
    );
    estrella.position.y = 0.7;
    estrella.name = 'meta-star';
    group.add(estrella);

    group.position.set(w.x, 0, w.z);
    scene.add(group);
  }

  function buildMuro(muro){
    const w = celdaAWorld(muro.col, muro.row);
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.8, 0.75),
      matMetal(0xef4444, { emissiveIntensity: 0.2 })
    );
    m.position.set(w.x, 0.4, w.z);
    m.name = 'muro-mision';
    scene.add(m);
  }

  /* ══════════════ CONTROLES HTML DE MISIÓN ══════════════ */
  function buildControlesMision(){
    const cont = $('rb3d-controls');
    cont.classList.add('activo');
    cont.innerHTML = `
      <div class="rb3d-programa" id="rb3d-programa"></div>
      <div class="rb3d-dpad">
        <button class="rb3d-dir" data-dir="up"    style="grid-area:u">
          <span>⬆</span><span class="label">UP</span>
        </button>
        <button class="rb3d-dir" data-dir="left"  style="grid-area:l">
          <span>⬅</span><span class="label">LEFT</span>
        </button>
        <button id="rb3d-go" class="rb3d-go" style="grid-area:c">▶</button>
        <button class="rb3d-dir" data-dir="right" style="grid-area:r">
          <span>➡</span><span class="label">RIGHT</span>
        </button>
        <button class="rb3d-dir" data-dir="down"  style="grid-area:d">
          <span>⬇</span><span class="label">DOWN</span>
        </button>
      </div>
      <div class="rb3d-acciones">
        <button class="quitar" id="rb3d-quitar">↩️ Quitar</button>
        <button class="borrar" id="rb3d-borrar">🗑️ Borrar</button>
      </div>
    `;

    cont.querySelectorAll('.rb3d-dir').forEach(b => {
      b.addEventListener('click', () => agregarPaso(b.dataset.dir));
    });
    $('rb3d-go').addEventListener('click', ejecutarPrograma);
    $('rb3d-quitar').addEventListener('click', () => {
      if (misionState && !misionState.ejecutando){
        misionState.programa.pop();
        window.tono(320, 0.09, 'square', 0.1);
        pintarPrograma();
      }
    });
    $('rb3d-borrar').addEventListener('click', () => {
      if (misionState && !misionState.ejecutando){
        misionState.programa = [];
        window.tono(220, 0.14, 'square', 0.12);
        pintarPrograma();
      }
    });

    pintarPrograma();
  }

  const FLECHAS = { up:'⬆️', down:'⬇️', left:'⬅️', right:'➡️' };

  function pintarPrograma(activoIdx = -1){
    const c = $('rb3d-programa');
    if (!c || !misionState) return;
    c.innerHTML = '';
    const total = Math.max(6, misionState.programa.length + 1);
    for (let i = 0; i < total; i++){
      const s = document.createElement('div');
      s.className = 'rb3d-slot';
      if (misionState.programa[i]){
        s.classList.add('lleno');
        s.textContent = FLECHAS[misionState.programa[i]];
      }
      if (i === activoIdx) s.style.outline = '2px solid #fbbf24';
      c.appendChild(s);
    }
    c.scrollLeft = c.scrollWidth;
  }

  function agregarPaso(dir){
    if (!misionState || misionState.ejecutando) return;
    if (misionState.programa.length >= 12){
      window.mostrarToast('¡Muchos pasos!');
      return;
    }
    misionState.programa.push(dir);
    window.tono(700, 0.07, 'square', 0.12);
    pintarPrograma();
  }

  /* ══════════════ EJECUTAR PROGRAMA ══════════════ */
  async function ejecutarPrograma(){
    if (!misionState || misionState.ejecutando) return;
    if (misionState.programa.length === 0) return;

    misionState.ejecutando = true;
    bloquearControles(true);

    const m = misionState.mision;
    let col = m.inicio.col;
    let row = m.inicio.row;

    const startW = celdaAWorld(col, row);
    robotAssembly.position.set(startW.x, 0, startW.z);
    await dormir(300);

    let ok = true;

    for (let i = 0; i < misionState.programa.length; i++){
      pintarPrograma(i);
      const dir = misionState.programa[i];
      const next = { col, row };
      if (dir === 'up')    next.row--;
      if (dir === 'down')  next.row++;
      if (dir === 'left')  next.col--;
      if (dir === 'right') next.col++;

      if (next.col < 0 || next.col >= GRID_SIZE || next.row < 0 || next.row >= GRID_SIZE){
        ok = false;
        window.tono(150, 0.4, 'sawtooth', 0.22);
        window.mostrarToast('¡Se salió del área!');
        break;
      }
      if (m.muros.some(mu => mu.col === next.col && mu.row === next.row)){
        ok = false;
        window.tono(150, 0.4, 'sawtooth', 0.22);
        window.mostrarToast('¡Chocó con un obstáculo!');
        break;
      }

      col = next.col;
      row = next.row;
      const w = celdaAWorld(col, row);

      let yaw = 0;
      if (dir === 'up')    yaw = Math.PI;
      if (dir === 'down')  yaw = 0;
      if (dir === 'left')  yaw = Math.PI / 2;
      if (dir === 'right') yaw = -Math.PI / 2;

      await animarGiro(yaw, 250);
      await animarPaso(new THREE.Vector3(w.x, 0, w.z), 380);

      window.tono(520 + i * 30, 0.08, 'sine', 0.12);
    }

    pintarPrograma(-1);

    if (ok && col === m.meta.col && row === m.meta.row){
      exitoMision();
    } else if (ok){
      window.tono(220, 0.3, 'sawtooth');
      window.mostrarToast('No llegó a la estrella 🎯');
      window.decir('Inténtalo otra vez');
      misionState.programa = [];
      pintarPrograma();
    } else {
      misionState.programa = [];
      pintarPrograma();
    }

    misionState.ejecutando = false;
    bloquearControles(false);
  }

  function bloquearControles(v){
    const cont = $('rb3d-controls');
    if (!cont) return;
    cont.querySelectorAll('button').forEach(b => b.disabled = v);
  }

  function dormir(ms){ return new Promise(r => setTimeout(r, ms)); }

  function animarGiro(yaw, ms){
    return new Promise(resolve => {
      const init = robotAssembly.rotation.y;
      let diff = yaw - init;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const t0 = performance.now();
      function step(){
        const t = Math.min(1, (performance.now() - t0) / ms);
        const e = 1 - Math.pow(1 - t, 3);
        robotAssembly.rotation.y = init + diff * e;
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      }
      step();
    });
  }

  function animarPaso(destino, ms){
    return new Promise(resolve => {
      const inicio = robotAssembly.position.clone();
      const t0 = performance.now();
      function step(){
        const t = Math.min(1, (performance.now() - t0) / ms);
        const e = 1 - Math.pow(1 - t, 3);
        robotAssembly.position.x = inicio.x + (destino.x - inicio.x) * e;
        robotAssembly.position.z = inicio.z + (destino.z - inicio.z) * e;
        robotAssembly.position.y = Math.sin(t * Math.PI) * 0.12;
        if (t < 1) requestAnimationFrame(step);
        else {
          robotAssembly.position.y = 0;
          resolve();
        }
      }
      step();
    });
  }

  function exitoMision(){
    const puntos = 10 + misionState.idx * 5;
    api.sumarPuntos(puntos);

    window.melodia([880, 1100, 1320, 1580]);
    window.decirBilingue('¡Excelente! ¡Misión cumplida!', 'Well done! Mission accomplished!');

    const wrap = $('rb3d-canvas-wrap');
    const ov = document.createElement('div');
    ov.className = 'rb3d-overlay';
    ov.innerHTML = `
      <div class="big">🎉🤖⭐</div>
      <div class="titulo">¡MISIÓN CUMPLIDA!</div>
      <div class="sub">Mission accomplished!</div>
      <div class="sub">+${puntos} ⭐</div>
    `;
    wrap.appendChild(ov);

    setTimeout(() => {
      ov.remove();
      iniciarMision(misionState.idx + 1);
    }, 2200);
  }

  /* ══════════════ LOOP DE ANIMACIÓN ══════════════ */
  function animar(){
    if (!canvas || !document.body.contains(canvas)){
      if (pointerBound){
        if (canvas) {
          canvas.removeEventListener('pointerdown', onPointerDown);
          canvas.removeEventListener('pointermove', onPointerMove);
          canvas.removeEventListener('pointerup', onPointerUp);
          canvas.removeEventListener('pointercancel', onPointerUp);
        }
        window.removeEventListener('resize', onResize);
        pointerBound = false;
      }
      animId = null;
      return;
    }
    animId = requestAnimationFrame(animar);

    const star = scene.getObjectByName('meta-star');
    if (star){
      star.rotation.y += 0.02;
      star.position.y = 0.7 + Math.sin(Date.now() / 400) * 0.08;
    }

    renderer.render(scene, camera);
  }

  /* ══════════════ JUEGO EXPORTADO ══════════════ */
  const juego = {
    id:'robot_builder', emoji:'🔧', nombre:'ROBOT LAB 3D',
    descripcion:'Arma un robot en 3D y hazlo cumplir misiones',
    edad:'4-5 años',
    iniciar(cont, apiIn){
      contenedor = cont;
      api = apiIn;
      activo = true;
      piezas = [];
      piezasColocadas = new Set();
      bateriaCargada = false;
      cargando = false;
      dragging = null;
      dragOffset = null;
      fase = 'armar';
      misionState = null;
      slotVisuales = {};

      cont.innerHTML = `
        <div class="rb3d-wrap">
          <div class="rb3d-header" id="rb3d-header"></div>
          <div class="rb3d-canvas-wrap" id="rb3d-canvas-wrap">
            <div class="rb3d-loading" id="rb3d-loading">Cargando laboratorio 3D…</div>
          </div>
          <div class="rb3d-controls" id="rb3d-controls"></div>
        </div>
      `;

      inyectarEstilos();

      cargarThree(() => {
        setTimeout(() => {
          try {
            iniciarEscena();
          } catch(err){
            console.error('Error al iniciar escena 3D:', err);
            window.mostrarToast('Error al iniciar el laboratorio 3D');
          }
        }, 120);
      });
    }
  };

  window.JUEGOS = window.JUEGOS || {};
  window.JUEGOS.robot_builder = juego;

})();