// ===== THREE.JS IMMERSIVE HERO SCENE =====
// 3D water droplets / soap bubbles with mouse interaction

(function () {
    if (window.innerWidth < 768 || !window.THREE) return;

    const canvas = document.getElementById('three-bg');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // ===== PARTICLE SYSTEM — WATER DROPLETS =====
    const PARTICLE_COUNT = 250;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = [];
    const sizes = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const opacities = new Float32Array(PARTICLE_COUNT);

    // Brand colors in RGB (0-1)
    const brandColors = [
        { r: 0.20, g: 0.75, b: 0.79 },  // cyan #32bfc9
        { r: 0.36, g: 0.83, b: 0.87 },  // light cyan #5dd4dc
        { r: 1.00, g: 0.74, b: 0.35 },  // amber #febc59
        { r: 1.00, g: 0.79, b: 0.43 },  // light amber #ffc96e
        { r: 0.90, g: 0.95, b: 1.00 },  // soft white-blue
        { r: 0.80, g: 0.92, b: 0.96 },  // pale cyan
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        // Spread particles in a wide field
        positions[i3] = (Math.random() - 0.5) * 60;
        positions[i3 + 1] = (Math.random() - 0.5) * 40;
        positions[i3 + 2] = (Math.random() - 0.5) * 30 - 5;

        velocities.push({
            x: (Math.random() - 0.5) * 0.015,
            y: Math.random() * 0.02 + 0.005,
            z: (Math.random() - 0.5) * 0.01,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            phase: Math.random() * Math.PI * 2,
        });

        sizes[i] = Math.random() * 2.5 + 0.5;

        const c = brandColors[Math.floor(Math.random() * brandColors.length)];
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;

        opacities[i] = Math.random() * 0.5 + 0.2;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    particleGeo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

    // Custom shader for glowing soft particles
    const particleMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uPixelRatio: { value: renderer.getPixelRatio() },
        },
        vertexShader: `
      attribute float aSize;
      attribute vec3 aColor;
      attribute float aOpacity;
      varying vec3 vColor;
      varying float vOpacity;
      uniform float uTime;
      uniform float uPixelRatio;

      void main() {
        vColor = aColor;
        vOpacity = aOpacity;
        vec3 pos = position;
        // Gentle sine wave wobble
        pos.x += sin(uTime * 0.5 + position.y * 0.3) * 0.5;
        pos.y += cos(uTime * 0.3 + position.x * 0.2) * 0.4;
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = aSize * uPixelRatio * (180.0 / -mvPos.z);
        gl_PointSize = max(gl_PointSize, 1.0);
      }
    `,
        fragmentShader: `
      varying vec3 vColor;
      varying float vOpacity;

      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        // Soft glow falloff
        float glow = 1.0 - smoothstep(0.0, 0.5, d);
        glow = pow(glow, 1.8);
        // Brighter center
        float core = 1.0 - smoothstep(0.0, 0.15, d);
        vec3 col = vColor + core * 0.4;
        gl_FragColor = vec4(col, glow * vOpacity);
      }
    `
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ===== FLOATING 3D GEOMETRY (subtle background shapes) =====
    const geoGroup = new THREE.Group();
    scene.add(geoGroup);

    const shapeColors = [0x32bfc9, 0x5dd4dc, 0xfebc59, 0xffc96e];
    const shapes = [];

    // Torus rings
    for (let i = 0; i < 5; i++) {
        const geo = new THREE.TorusGeometry(1 + Math.random() * 1.5, 0.08 + Math.random() * 0.06, 16, 48);
        const mat = new THREE.MeshBasicMaterial({
            color: shapeColors[Math.floor(Math.random() * shapeColors.length)],
            transparent: true,
            opacity: 0.12 + Math.random() * 0.08,
            wireframe: true,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 30,
            -10 - Math.random() * 15
        );
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = {
            rotX: (Math.random() - 0.5) * 0.005,
            rotY: (Math.random() - 0.5) * 0.008,
            floatSpeed: 0.0003 + Math.random() * 0.0005,
            floatPhase: Math.random() * Math.PI * 2,
        };
        shapes.push(mesh);
        geoGroup.add(mesh);
    }

    // Icosahedron / dodecahedron accents
    for (let i = 0; i < 4; i++) {
        const geo = i % 2 === 0
            ? new THREE.IcosahedronGeometry(0.8 + Math.random(), 0)
            : new THREE.DodecahedronGeometry(0.6 + Math.random() * 0.8, 0);
        const mat = new THREE.MeshBasicMaterial({
            color: shapeColors[Math.floor(Math.random() * shapeColors.length)],
            transparent: true,
            opacity: 0.08 + Math.random() * 0.06,
            wireframe: true,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 55,
            (Math.random() - 0.5) * 35,
            -8 - Math.random() * 18
        );
        mesh.userData = {
            rotX: (Math.random() - 0.5) * 0.006,
            rotY: (Math.random() - 0.5) * 0.009,
            floatSpeed: 0.0004 + Math.random() * 0.0004,
            floatPhase: Math.random() * Math.PI * 2,
        };
        shapes.push(mesh);
        geoGroup.add(mesh);
    }

    // ===== MOUSE TRACKING =====
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    window.addEventListener('mousemove', (e) => {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    // ===== SCROLL TRACKING =====
    let scrollProgress = 0;
    window.addEventListener('scroll', () => {
        const heroH = document.querySelector('.hero')?.offsetHeight || 800;
        scrollProgress = Math.min(window.scrollY / heroH, 1);
    }, { passive: true });

    // ===== ANIMATION LOOP =====
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();
        const dt = clock.getDelta();

        // Smooth mouse
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;

        // Update uniforms
        particleMat.uniforms.uTime.value = elapsed;
        particleMat.uniforms.uMouse.value.set(mouse.x, mouse.y);

        // Animate particles
        const posArr = particleGeo.attributes.position.array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            const v = velocities[i];

            // Float upward
            posArr[i3 + 1] += v.y;
            posArr[i3] += v.x + Math.sin(elapsed * 0.5 + v.phase) * 0.01;
            posArr[i3 + 2] += v.z;

            // Mouse attraction (gentle)
            const dx = mouse.x * 20 - posArr[i3];
            const dy = mouse.y * 15 - posArr[i3 + 1];
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 12) {
                const force = (1 - dist / 12) * 0.008;
                posArr[i3] += dx * force;
                posArr[i3 + 1] += dy * force;
            }

            // Wrap around
            if (posArr[i3 + 1] > 25) {
                posArr[i3 + 1] = -25;
                posArr[i3] = (Math.random() - 0.5) * 60;
            }
            if (posArr[i3] > 35) posArr[i3] = -35;
            if (posArr[i3] < -35) posArr[i3] = 35;
        }
        particleGeo.attributes.position.needsUpdate = true;

        // Animate shapes
        shapes.forEach(mesh => {
            const d = mesh.userData;
            mesh.rotation.x += d.rotX;
            mesh.rotation.y += d.rotY;
            mesh.position.y += Math.sin(elapsed * d.floatSpeed * 100 + d.floatPhase) * 0.008;
        });

        // Camera subtle movement following mouse
        camera.position.x += (mouse.x * 3 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 2 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        // Fade scene based on scroll
        const opacity = 1 - scrollProgress * 0.9;
        canvas.style.opacity = opacity;

        if (scrollProgress < 0.95) {
            renderer.render(scene, camera);
        }
    }

    animate();

    // ===== RESIZE HANDLER =====
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

})();
