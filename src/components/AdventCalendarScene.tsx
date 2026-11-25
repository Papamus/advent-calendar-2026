"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import type {
  CalendarDayListResponse,
  CalendarDayStatus,
} from "@/types/calendar";

interface AdventCalendarSceneProps {
  days: CalendarDayListResponse;
  pointerRef: RefObject<{ x: number; y: number }>;
}

const doorWidth = 0.9;
const doorHeight = 0.8;

function Door({
  status,
  position,
}: {
  status: CalendarDayStatus;
  position: [number, number];
}) {
  const hingeRef = useRef<THREE.Group>(null);
  const faceColor =
    status === "locked" ? "#0a111f" : "#0b1d16";

  useFrame((_, delta) => {
    if (hingeRef.current) {
      const target = status === "opened" ? -0.92 : 0;
      hingeRef.current.rotation.y = THREE.MathUtils.damp(
        hingeRef.current.rotation.y,
        target,
        5,
        delta,
      );
    }
  });

  return (
    <>
      <RoundedBox
        args={[doorWidth - 0.1, doorHeight - 0.1, 0.05]}
        position={[position[0], position[1], 0.43]}
        radius={0.04}
        smoothness={3}
      >
        <meshStandardMaterial
          color="#c5a059"
          metalness={0.35}
          roughness={0.38}
          emissive={status === "opened" ? "#c5a059" : "#0a111f"}
          emissiveIntensity={status === "opened" ? 0.34 : 0}
        />
      </RoundedBox>
      <RoundedBox
        args={[doorWidth - 0.15, doorHeight - 0.15, 0.08]}
        position={[position[0], position[1], 0.47]}
        radius={0.035}
        smoothness={3}
      >
        <meshStandardMaterial
          color={status === "opened" ? "#c5a059" : "#0a111f"}
          emissive={status === "opened" ? "#c5a059" : "#0a111f"}
          emissiveIntensity={status === "opened" ? 0.65 : 0}
          roughness={0.5}
        />
      </RoundedBox>
      <group ref={hingeRef} position={[position[0] - doorWidth / 2, position[1], 0.56]}>
        <RoundedBox
          args={[doorWidth - 0.1, doorHeight - 0.1, 0.11]}
          position={[doorWidth / 2, 0, 0]}
          radius={0.045}
          smoothness={4}
        >
          <meshStandardMaterial
            color={faceColor}
            roughness={0.72}
            metalness={0.08}
          />
        </RoundedBox>
        <mesh position={[doorWidth - 0.19, -0.02, 0.075]}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial
            color="#c5a059"
            metalness={0.65}
            roughness={0.28}
          />
        </mesh>
      </group>
    </>
  );
}

function Cabinet({
  days,
  pointerRef,
}: AdventCalendarSceneProps) {
  const cabinetRef = useRef<THREE.Group>(null);
  const roofGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-2.75, 0);
    shape.lineTo(0, 1.45);
    shape.lineTo(2.75, 0);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.34,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.035,
    });
  }, []);

  useFrame(({ clock }, delta) => {
    if (!cabinetRef.current) {
      return;
    }

    cabinetRef.current.rotation.y = THREE.MathUtils.damp(
      cabinetRef.current.rotation.y,
      pointerRef.current.x * 0.055,
      3,
      delta,
    );
    cabinetRef.current.rotation.x = THREE.MathUtils.damp(
      cabinetRef.current.rotation.x,
      -pointerRef.current.y * 0.025,
      3,
      delta,
    );
    cabinetRef.current.position.y = Math.sin(clock.elapsedTime * 0.55) * 0.025;
  });

  const roofPositions: [number, number, number][] = [
    [0, 2.64, -0.08],
    [0, 2.64, 0.06],
  ];

  return (
    <Float speed={0.8} rotationIntensity={0} floatIntensity={0.04}>
      <group ref={cabinetRef}>
        <ambientLight intensity={1.1} />
        <directionalLight
          color="#f5f0e6"
          intensity={2.2}
          position={[-3, 5, 6]}
        />
        <pointLight
          color="#c5a059"
          distance={9}
          intensity={5}
          position={[0, 0.2, 3]}
        />
        <RoundedBox
          args={[5.25, 6.35, 0.28]}
          position={[0, -0.34, 0]}
          radius={0.12}
          smoothness={5}
        >
          <meshStandardMaterial
            color="#c5a059"
            metalness={0.3}
            roughness={0.5}
          />
        </RoundedBox>
        <RoundedBox
          args={[5.08, 6.18, 0.31]}
          position={[0, -0.34, 0.16]}
          radius={0.1}
          smoothness={5}
        >
          <meshStandardMaterial color="#0b1d16" roughness={0.74} />
        </RoundedBox>
        <RoundedBox
          args={[4.72, 5.76, 0.08]}
          position={[0, -0.34, 0.34]}
          radius={0.08}
          smoothness={4}
        >
          <meshStandardMaterial color="#0a111f" roughness={0.88} />
        </RoundedBox>
        {roofPositions.map((position, index) => (
          <mesh
            key={position[2]}
            geometry={roofGeometry}
            position={position}
            scale={index === 0 ? 1 : 0.93}
          >
            <meshStandardMaterial
              color={index === 0 ? "#c5a059" : "#0b1d16"}
              metalness={index === 0 ? 0.36 : 0.03}
              roughness={index === 0 ? 0.42 : 0.7}
            />
          </mesh>
        ))}
        <mesh position={[0, 3.88, 0.2]}>
          <octahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial
            color="#c5a059"
            emissive="#c5a059"
            emissiveIntensity={0.22}
            metalness={0.45}
          />
        </mesh>
        {days.map((day, index) => {
          const column = index % 4;
          const row = Math.floor(index / 4);
          const x = (column - 1.5) * 1.08;
          const y = 2.12 - row * 0.93;

          return (
            <Door
              key={day.dayNumber}
              position={[x, y]}
              status={day.status}
            />
          );
        })}
      </group>
    </Float>
  );
}

export default function AdventCalendarScene({
  days,
  pointerRef,
}: AdventCalendarSceneProps) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0, 12], zoom: 52, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      orthographic
    >
      <Cabinet days={days} pointerRef={pointerRef} />
    </Canvas>
  );
}
