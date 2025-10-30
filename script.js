// === Scene Setup ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 120, 250);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("universe") });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// === Controls ===
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// === Lighting ===
const sunlight = new THREE.PointLight(0xffffff, 2, 1000);
scene.add(sunlight);

// === Texture Loader ===
const loader = new THREE.TextureLoader();

// === Sun ===
const sunGeo = new THREE.SphereGeometry(16, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({ map: loader.load("assets/sun.jpg") });
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// === Create Planet Helper ===
function createPlanet(texture, size, distance, orbitSpeed, rotateSpeed, name, info) {
  const orbit = new THREE.Object3D();
  scene.add(orbit);

  const geo = new THREE.SphereGeometry(size, 64, 64);
  const mat = new THREE.MeshStandardMaterial({ map: loader.load(texture) });
  const planet = new THREE.Mesh(geo, mat);
  planet.position.x = distance;
  orbit.add(planet);

  // Orbit line
  const orbitGeo = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 128);
  const orbitMat = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide });
  const orbitLine = new THREE.Mesh(orbitGeo, orbitMat);
  orbitLine.rotation.x = Math.PI / 2;
  scene.add(orbitLine);

  return { orbit, planet, orbitSpeed, rotateSpeed, name, info, distance, orbitLine };
}

// === Planets ===
const planets = [
  createPlanet("assets/mercury.jpg", 2, 28, 0.04, 0.004, "Mercury", "Smallest planet closest to the Sun."),
  createPlanet("assets/venus.jpg", 3, 38, 0.015, 0.002, "Venus", "Hottest planet with thick atmosphere."),
  createPlanet("assets/earth.jpg", 3.5, 50, 0.01, 0.02, "Earth", "Our home planet with life."),
  createPlanet("assets/mars.jpg", 2.8, 62, 0.008, 0.018, "Mars", "Red planet, possible future home."),
  createPlanet("assets/jupiter.jpg", 7, 80, 0.006, 0.03, "Jupiter", "Largest planet, gas giant."),
  createPlanet("assets/saturn.jpg", 6, 100, 0.005, 0.03, "Saturn", "Famous for its rings."),
  createPlanet("assets/uranus.jpg", 5, 120, 0.003, 0.03, "Uranus", "Icy tilted planet."),
  createPlanet("assets/neptune.jpg", 4.5, 140, 0.002, 0.03, "Neptune", "Coldest and windiest planet."),
];

// === Saturn Ring ===
const ringGeo = new THREE.RingGeometry(7, 10, 64);
const ringMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
planets[5].planet.add(ring);

// === Asteroid Belt ===
const asteroidGroup = new THREE.Group();
scene.add(asteroidGroup);

const asteroidGeo = new THREE.SphereGeometry(0.3, 6, 6);
const asteroidMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
for (let i = 0; i < 400; i++) {
  const asteroid = new THREE.Mesh(asteroidGeo, asteroidMat);
  const angle = Math.random() * Math.PI * 2;
  const radius = 70 + Math.random() * 10; // between Mars & Jupiter
  asteroid.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 5, Math.sin(angle) * radius);
  asteroidGroup.add(asteroid);
}

// === Stars Background ===
const stars = new THREE.Mesh(
  new THREE.SphereGeometry(900, 64, 64),
  new THREE.MeshBasicMaterial({ map: loader.load("assets/stars.jpg"), side: THREE.BackSide })
);
scene.add(stars);

// === Labels ===
const labelContainer = document.createElement("div");
document.body.appendChild(labelContainer);
planets.forEach((p) => {
  const label = document.createElement("div");
  label.className = "label";
  label.textContent = p.name;
  labelContainer.appendChild(label);
  p.label = label;
});

// === GUI Controls ===
const gui = new lil.GUI();
const settings = {
  showOrbits: true,
  showLabels: true,
  cinematic: false,
  music: true,
};
gui.add(settings, "showOrbits").name("Show Orbits");
gui.add(settings, "showLabels").name("Show Labels");
gui.add(settings, "cinematic").name("Cinematic Camera");
gui.add(settings, "music").name("Play Music");

// === Audio ===
// === BACKGROUND MUSIC FIX ===
const bgMusic = document.getElementById("bg-music");
let musicStarted = false;

function startMusic() {
  if (!musicStarted) {
    bgMusic.volume = 0.5;
    bgMusic.play()
      .then(() => console.log("Music playing 🎵"))
      .catch(err => console.log("Audio blocked until user interaction:", err));
    musicStarted = true;
  }
}

// Any click, key press, or touch will start the music
document.addEventListener("click", startMusic);
document.addEventListener("keydown", startMusic);
document.addEventListener("touchstart", startMusic);


// === Animate ===
function animate() {
  requestAnimationFrame(animate);

  sun.rotation.y += 0.002;
  stars.rotation.y += 0.0002;
  asteroidGroup.rotation.y += 0.0005;

  planets.forEach((p) => {
    p.orbit.rotation.y += p.orbitSpeed;
    p.planet.rotation.y += p.rotateSpeed;
    p.orbitLine.visible = settings.showOrbits;

    const vector = p.planet.position.clone();
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    p.label.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
    p.label.style.display = settings.showLabels ? "block" : "none";
  });

  if (settings.cinematic) {
    const time = Date.now() * 0.00005;
    camera.position.x = Math.cos(time) * 250;
    camera.position.z = Math.sin(time) * 250;
    camera.lookAt(0, 0, 0);
  }

  bgMusic.muted = !settings.music;
  controls.update();
  renderer.render(scene, camera);
}
animate();

// === Resize ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
