import React, { useRef, useState, useEffect} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Billboard, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import './App.css';
import { plane } from 'three/examples/jsm/Addons.js';


// Helper function to generate points for a circular orbit line in the XZ plane
function createOrbitPoints(radius, pointsCount = 128) {
  const points = [];
  for (let i = 0; i <= pointsCount; i++) {
    const theta = (i / pointsCount) * Math.PI * 2;
    points.push([Math.cos(theta) * radius, 0, Math.sin(theta) * radius]);
  }
  return points;
}

/// A single shooting comet component that streaks across the screen with text
function ShootingComet({ id, name, onComplete }) {
  const cometRef = useRef();
  const tailRef = useRef();
  
  const [data] = useState(() => {
    const startX = (Math.random() - 0.5) * 30;
    const startY = Math.random() * 10 + 10;
    const startZ = (Math.random() - 0.5) * 30;

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 15,
      -Math.random() * 15 - 10,
      (Math.random() - 0.5) * 15
    ).normalize();

    const speed = Math.random() * 6 + 3;
    return { startX, startY, startZ, velocity, speed };
  });

  useFrame((_, delta) => {
    if (cometRef.current) {
      cometRef.current.position.addScaledVector(data.velocity, data.speed * delta);

      if (tailRef.current) {
        const tailDir = data.velocity.clone().negate();
        tailRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tailDir);
      }

      if (cometRef.current.position.y < -10) {
        onComplete(id);
      }
    }
  });

  return (
    <group ref={cometRef} position={[data.startX, data.startY, data.startZ]}>
      {/* Comet Head */}
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#00ffff" 
          emissiveIntensity={4} 
          toneMapped={false} 
        />
      </mesh>

      {/* Trailing Tail */}
      <group ref={tailRef}>
        <mesh position={[0, 1.2, 0]}>
          <coneGeometry args={[0.08, 2.5, 8]} />
          <meshBasicMaterial 
            color="#00ffff" 
            transparent={true} 
            opacity={0.5} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      </group>

      {/* Comet Text Label */}
        {name && (
          <Billboard position={[0, 0.5, 0]}>
            <Text
              fontSize={0.25}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              material-toneMapped={false}
            >
              {name}
            </Text>
          </Billboard>
        )}
    </group>
  );
}

// Manager component that periodically spawns shooting comets
function CometShower() {
  const [comets, setComets] = useState([]);

  // Array of text labels you want your comets to display
  const cometMessages = ['Video Games', 'Anime and Manga', 'Corny TV Shows', 'To the stars!', "Keyboard Building"];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomMsg = cometMessages[Math.floor(Math.random() * cometMessages.length)];
      setComets((prev) => [...prev, { id: Date.now(), name: randomMsg }]);
    }, Math.random() * 3000 + 3000);

    return () => clearInterval(interval);
  }, []);

  const handleComplete = (id) => {
    setComets((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <>
      {comets.map((comet) => (
        <ShootingComet key={comet.id} id={comet.id} name={comet.name} onComplete={handleComplete} />
      ))}
    </>
  );
}

// A single orbiting asteroid component
function OrbitingAsteroid({ radius, speed, size, name, url, setSelectedPlanet, onHover }) {
  const asteroidRef = useRef();
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const accumulatedTime = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }, delta) => {
    if (!isHovered) {
      accumulatedTime.current += delta * speed;
    }
    const t = accumulatedTime.current;
    
    if (asteroidRef.current) {
      asteroidRef.current.position.x = Math.cos(t) * radius;
      asteroidRef.current.position.z = Math.sin(t) * radius;
    }
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });


  const asteroid_atomsphere = new THREE.Color("#555555");
  asteroid_atomsphere.lerp(new THREE.Color("00FFFF"), 0.1);


  return (
    <group ref={asteroidRef}>
      <mesh 
        ref={meshRef}
      >
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial 
          color="#555555" 
          roughness={0.9} 
          metalness={0.4} 
          emissive="#333333"
          emissiveIntensity={isHovered ? 0.8 : 0.05}
          flatShading={true}
          toneMapped={false}
        />
          <octahedronGeometry args={[size, 0]} />
          <meshBasicMaterial 
              color={asteroid_atomsphere}
              transparent={true} 
              opacity={isHovered ? 0.4 : 0.15} 
              side={THREE.BackSide}
            />
        
      </mesh>
      
      {name && (
        <Billboard position={[0, size + 0.3, 0]}>
          <Text
            fontSize={0.2}
            color="#aaaaaa"
            anchorX="center"
            anchorY="middle"
          >
            {name}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

// A single orbiting moon component that revolves around a parent planet
function OrbitingMoon({ moonRadius, speed, color, size, name, url, setSelectedPlanet, onHover }) {
  const moonRef = useRef();
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const accumulatedTime = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }, delta) => {
    if (!isHovered) {
      accumulatedTime.current += delta * speed;
    }
    const t = accumulatedTime.current;
    
    if (moonRef.current) {
      moonRef.current.position.x = Math.cos(t) * moonRadius;
      moonRef.current.position.z = Math.sin(t) * moonRadius;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const moon_color = new THREE.Color(color);

  return (
    <group ref={moonRef}>
      <mesh 
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          onHover(true); // Tell the planet we are hovered
          setSelectedPlanet(`Click to visit: ${name}`);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setIsHovered(false);
          onHover(false); // Tell the planet we are no longer hovered
          setSelectedPlanet('Click a Planet to inspect');
          document.body.style.cursor = 'default';
        }}
        onClick={(e) => {
            e.stopPropagation();
            if (url) {
              const isPdf = url.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf?');
              
              if (isPdf) {
                // Opens the native browser PDF reader/viewer in a new tab
                window.open(url, '_blank', 'noopener,noreferrer');
              } else {
                window.open(url, '_blank', 'noopener,noreferrer');
              }
            }
          }}
      >
        <icosahedronGeometry args={[size, 0]} />
        <meshStandardMaterial 
          color={moon_color} 
          roughness={0.8} 
          metalness={0.2} 
          emissive={moon_color}
          emissiveIntensity={isHovered ? 0.8 : 0.05}
          toneMapped={false}
        />
      </mesh>
      
      
      <Billboard position={[0, size + 0.3, 0]}>
        <Text
          fontSize={0.2}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      </Billboard>
    </group>
  );
}

// A single orbiting planet component with rotation and hover effects
function OrbitingPlanet({ radius, speed, color, size, name, url, setSelectedPlanet, hasRings = false, moons = [] }) {
  const ref = useRef();
  const meshRef = useRef();
  const ringRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const accumulatedTime = useRef(Math.random() * Math.PI * 2);

  
  useFrame(({ clock }, delta) => {
    if (!isHovered) {
      accumulatedTime.current += delta * speed;
    }
    const t = accumulatedTime.current;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.05;
    }
  });

  const orbitPoints = createOrbitPoints(radius);
  const planet_primary = new THREE.Color(color);
  const planet_atomsphere = new THREE.Color(color);
  planet_atomsphere.lerp(new THREE.Color("00FFFF"), 0.2);
  
  return (
    <>
      <Line
        points={orbitPoints}
        color="white"
        lineWidth={1}
        transparent
        opacity={0.4}
        dashed
        dashScale={10}
        dashSize={1}
        gapSize={2}
      />

      {/* Orbiting Planet Body */}
      <group ref={ref}>
        <group ref={meshRef}>
          <mesh 
            onPointerOver={(e) => {
              e.stopPropagation();
              setIsHovered(true);
              setSelectedPlanet(`Click to visit: ${name}`);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setIsHovered(false);
              setSelectedPlanet('Click a Planet to inspect');
              document.body.style.cursor = 'default';
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <sphereGeometry args={[size, 40, 32]} />
            <meshStandardMaterial 
              color={planet_primary} 
              roughness={0.5} 
              metalness={0.6}
              emissive={planet_primary}
              emissiveIntensity={isHovered ? 0.8 : 0.05}
              toneMapped={false}
            />
          </mesh>

          {hasRings && (
            <mesh ref={ringRef} rotation={[1.2, 0.3, 0]}>
              <ringGeometry args={[size * 2, size * 2.4, 64]} />
              <meshStandardMaterial 
                color={planet_atomsphere} 
                side={THREE.DoubleSide} 
                transparent={true} 
                opacity={0.7} 
                roughness={0.4}
              />
            </mesh>
          )}

          <mesh>
            <sphereGeometry args={[size + 0.1, 32, 32]} />
            <meshBasicMaterial 
              color={planet_atomsphere}
              transparent={true} 
              opacity={isHovered ? 0.4 : 0.15} 
              side={THREE.BackSide}
            />
          </mesh>
        </group>

       {moons.map((moon, index) => (
          <OrbitingMoon 
            key={index}
            moonRadius={moon.moonRadius}
            speed={moon.speed}
            color={moon.color}
            size={moon.size}
            name={moon.name}
            url={moon.url}
            setSelectedPlanet={setSelectedPlanet}
            onHover={(hovered) => setIsHovered(hovered)} // Stops planet orbit when moon is hovered
          />
        ))}

        {isHovered && (
          <EffectComposer>
            <Bloom 
              intensity={1.5} 
              luminanceThreshold={0.1} 
              luminanceSmoothing={0.9} 
            />
          </EffectComposer>
        )}
        
        <Billboard position={[0, 1, 0]}>
          <Text
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {name}
          </Text>
        </Billboard>
      </group>
    </>
  );
}

export default function App() {
  const [selectedPlanet, setSelectedPlanet] = useState('Click a Planet to inspect');
  const [menuOpen, setMenuOpen] = useState(false);

  const planets = [
    { name: 'About Me', url: 'https://github.com/Ashwashere4' },
    { name: 'Resume', url: 'Franklin_Ash_SWEN_BS-1-1.pdf'},
    { name: 'Projects', url: 'https://github.com/Ashwashere4?tab=repositories' },
    { name: 'Linkedin', url: 'https://www.linkedin.com/in/caden-f-150ba2158/' },
    { name: 'Instagram', url: 'https://www.instagram.com/highrisewuzhere?igsh=MXFiaGptOWc0Y2s0aw%3D%3D&utm_source=qr' }
  ];

  
  const asteroids = Array.from({ length: 200 }, () => ({
  radius: Math.random() * 8 + 4,            
  speed: Math.random() * 0.3 + 0.1,          
  size: Math.random() * 0.15 + 0.1           
}));

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000', position: 'relative', overflow: 'hidden' }}>
      
      {/* Hamburger Button */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 30,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
          padding: '10px 14px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1.2rem',
          backdropFilter: 'blur(5px)'
        }}
      >
        ☰
      </button>

      {/* Slide-out Sidebar Menu */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: menuOpen ? '0px' : '-280px',
        width: '260px',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        transition: 'left 0.3s ease-in-out',
        zIndex: 20,
        padding: '80px 20px 20px 20px',
        boxSizing: 'border-box',
        color: 'white'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.4rem' }}>Planets</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {planets.map((p, index) => (
            <li 
              key={index} 
              onClick={() => {
                window.open(p.url, '_blank', 'noopener,noreferrer');
                setMenuOpen(false);
              }}
              style={{
                padding: '12px 15px',
                marginBottom: '10px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              {p.name} ↗
            </li>
          ))}
        </ul>
      </div>

      {/* HUD Info Overlay */}
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 10, 
        textAlign: 'center',
        color: 'white',
        pointerEvents: 'none'
      }}>
        <h1 style={{ margin: '0 0 5px 0' }}>Ashwashere4</h1>
        <p style={{ margin: '0 0 5px 0' }}>{selectedPlanet}</p>
        <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>Hover to pause orbit • Click to open link • Drag to rotate</p>
      </div>
      <Canvas 
        style={{ width: '100%', height: '100%', background: '#000000' }}
        camera={{ position: [0, 8, 15], fov: 60 }}
      >
        {/* Starfield background */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 0, 0]} intensity={3} color="#fffaed" decay={2} />

        {/* Central Sun */}
        <group>
          <mesh>
            <sphereGeometry args={[1.5, 32, 32]} />
            <meshStandardMaterial 
              color="#ffd700" 
              emissive="#ffaa00" 
              emissiveIntensity={2.5} 
              toneMapped={false} 
            />
          </mesh>
          <EffectComposer>
            <Bloom 
              intensity={1.5} 
              luminanceThreshold={0.2} 
              luminanceSmoothing={0.9} 
            />
          </EffectComposer>
        </group>

        {/* Orbiting Planets with Hyperlinks */}
        <OrbitingPlanet 
          radius={4} 
          speed={0.6} 
          color="#c17d24" 
          size = {.20}
          name="About Me" 
          url="https://github.com/Ashwashere4"
          setSelectedPlanet={setSelectedPlanet} 
          moons = {[{ name: "Resume", moonRadius: 1, speed: 1.0, color: "#cbd5e0", size: 0.3, url: "Franklin_Ash_SWEN_BS-1-1.pdf"}]}
        />
        
        <OrbitingPlanet 
          radius={7} 
          speed={0.4} 
          color="#0a7581" 
          size = {.45}
          name="Projects" 
          url="https://github.com/Ashwashere4?tab=repositories"
          setSelectedPlanet={setSelectedPlanet} 
        />
        
        <OrbitingPlanet 
          radius={10} 
          speed={0.2} 
          color="#1318b9" 
          size = {.35}
          name="LinkedIn" 
          hasRings={true}
          url="https://www.linkedin.com/in/caden-f-150ba2158/" 
          setSelectedPlanet={setSelectedPlanet} 
          moons = {[{ name: "Instagram", moonRadius: 1.5, speed: 1.0, color: "#cbd5e0", size: 0.3, url: "https://www.instagram.com/highrisewuzhere?igsh=MXFiaGptOWc0Y2s0aw%3D%3D&utm_source=qr"}]}
        />

        {/* Render Asteroids Dynamically */}
        {asteroids.map((ast, index) => (
          <OrbitingAsteroid
            key={index}
            radius={ast.radius}
            speed={ast.speed}
            size={ast.size}
            name={ast.name}
            url={ast.url}
            setSelectedPlanet={setSelectedPlanet}
            onHover={() => {}}
          />
        ))}

        {/* Random Falling/Shooting Comets */}
        <CometShower />

        {/* Enables mouse dragging to rotate the 3D scene */}
        <OrbitControls target={[0, 0, 0]} enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}