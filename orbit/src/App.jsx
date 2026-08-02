import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Billboard, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import './App.css';

// Helper function to generate points for a circular orbit line in the XZ plane
function createOrbitPoints(radius, pointsCount = 128) {
  const points = [];
  for (let i = 0; i <= pointsCount; i++) {
    const theta = (i / pointsCount) * Math.PI * 2;
    points.push([Math.cos(theta) * radius, 0, Math.sin(theta) * radius]);
  }
  return points;
}

// A single orbiting planet component with rotation and hover effects
function OrbitingPlanet({ radius, speed, color, name, url, setSelectedPlanet }) {
  const ref = useRef();
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const accumulatedTime = useRef(0);

  // Animate orbit path and self-rotation, freezing orbit time when hovered
  useFrame(({ clock }, delta) => {
    if (!isHovered) {
      accumulatedTime.current += delta * speed;
    }
    const t = accumulatedTime.current;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;

    // Self-rotation of the planet
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const orbitPoints = createOrbitPoints(radius);

  return (
    <>
      {/* Dotted Orbit Path */}
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
          {/* Main Planet Surface */}
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
            <sphereGeometry args={[0.6, 32, 32]} />
            <meshStandardMaterial 
              color={color} 
              roughness={0.4} 
              metalness={0.1}
              emissive={color}
              emissiveIntensity={isHovered ? 0.8 : 0.05}
              toneMapped={false}
            />
          </mesh>

          {/* Atmospheric Rim / Outer Glow Shell */}
          <mesh>
            <sphereGeometry args={[0.65, 32, 32]} />
            <meshBasicMaterial 
              color={color} 
              transparent={true} 
              opacity={isHovered ? 0.4 : 0.15} 
              side={THREE.BackSide}
            />
          </mesh>
        </group>

        {/* Individual Planet Bloom Effect on Hover */}
        {isHovered && (
          <EffectComposer>
            <Bloom 
              intensity={1.5} 
              luminanceThreshold={0.1} 
              luminanceSmoothing={0.9} 
            />
          </EffectComposer>
        )}
        
        {/* Billboarded Text (Always faces the camera) */}
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
    { name: 'Projects', url: 'https://github.com/Ashwashere4?tab=repositories' },
    { name: 'Linkedin', url: 'https://linkedin.com' }
  ];

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
        <h1 style={{ margin: '0 0 5px 0' }}>Ashwuzhere4</h1>
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
          speed={0.3} 
          color="#c17d24" 
          name="About Me" 
          url="https://github.com/Ashwashere4"
          setSelectedPlanet={setSelectedPlanet} 
        />
        
        <OrbitingPlanet 
          radius={7} 
          speed={0.2} 
          color="#0a7581" 
          name="Projects" 
          url="https://github.com/Ashwashere4?tab=repositories"
          setSelectedPlanet={setSelectedPlanet} 
        />
        
        <OrbitingPlanet 
          radius={10} 
          speed={0.1} 
          color="#1318b9" 
          name="Linkedin" 
          url="https://linkedin.com" 
          setSelectedPlanet={setSelectedPlanet} 
        />

        {/* Enables mouse dragging to rotate the 3D scene */}
        <OrbitControls target={[0, 0, 0]} enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
}