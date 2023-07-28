import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";
import { useControls } from "leva";
import fragmentShader from "./fragment";
import fragmentShader_transParent from "./fragment_transparent";
import vertexShader from "./vertex";

const Scene = () => {
  const { colorA, colorB, colorC, colorD, colorE, speed, spike, processing } =
    useControls({
      colorA: "#fd038d",
      colorB: "#f005fc",
      colorC: "#8c10b7",
      colorD: "#4ac1c7",
      colorE: "#f99718",
      speed: {
        value: 32,
        min: 10,
        max: 120,
        step: 1,
      },
      spike: {
        value: 0.8,
        min: 0.05,
        max: 2,
        step: 0.05,
      },
      processing: {
        value: 1,
        min: 0.6,
        max: 2.4,
        step: 0.1,
      },
    });

  const uniforms = useMemo(() => {
    return {
      u_time: {
        value: 0.0,
      },
      u_color_a: {
        value: new THREE.Color(colorA),
      },
      u_color_b: {
        value: new THREE.Color(colorB),
      },
      u_color_c: {
        value: new THREE.Color(colorC),
      },
      u_color_d: {
        value: new THREE.Color(colorD),
      },
      u_color_e: {
        value: new THREE.Color(colorE),
      },
      Ka: { value: new THREE.Vector3(1.5, 1.5, 1.5) },
      // Kd: { value: new THREE.Vector3(0.9, 0.5, 0.3) },
      Kd: { value: new THREE.Vector3(1, 1, 1) },
      // Ks: { value: new THREE.Vector3(0.8, 0.8, 0.8) },
      Ks: { value: new THREE.Vector3(1, 1, 1) },

      LightIntensity: { value: new THREE.Vector4(0.1, 0.1, 0.1, 1.0) },
      LightPosition: { value: new THREE.Vector4(0.0, 0.0, 2, 1.0) },
      Shininess: { value: 1000.0 },
    };
  }, []);

  const meshRef = useRef();
  const simplex = createNoise3D();
  const hover = useRef({ speed: 1, spike: 1, processing: 1 });
  // const [hover, setHover] = useState({ speed: 1, processing: 1 });

  useFrame(({ clock, mouse }) => {
    // let speedSlider = speed;
    let speedSlider = speed * hover.current.speed;
    let spikesSlider = spike * hover.current.spike;
    // let processingSlider = processing;
    let processingSlider = processing * hover.current.processing;

    // hoverの値を元の値から目標値に向かって滑らかに変化させる
    // speedSlider = THREE.MathUtils.lerp(speedSlider, speed * hover.speed, 0.05);
    // processingSlider = THREE.MathUtils.lerp(
    //   processingSlider,
    //   processing * hover.processing,
    //   0.05
    // );

    let time =
      performance.now() * 0.00001 * speedSlider * Math.pow(processingSlider, 3);
    let spikes = spikesSlider * processingSlider;

    const mesh = meshRef.current;
    const { geometry } = mesh;
    const { position } = geometry.attributes;
    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const p = new THREE.Vector3();
      p.fromBufferAttribute(positions, i);
      p.normalize().multiplyScalar(
        1 + 0.3 * simplex(p.x * spikes, p.y * spikes, p.z * spikes + time)
      );
      meshRef.current.geometry.attributes.position.setXYZ(i, p.x, p.y, p.z);
    }

    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      mouse.x * 0.5,
      0.1
    );
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      mouse.y * 0.5,
      0.1
    );

    meshRef.current.material.uniforms.u_time.value = clock.getElapsedTime();
    meshRef.current.material.uniforms.u_color_a.value = new THREE.Color(colorA);
    meshRef.current.material.uniforms.u_color_b.value = new THREE.Color(colorB);
    meshRef.current.material.uniforms.u_color_c.value = new THREE.Color(colorC);
    meshRef.current.material.uniforms.u_color_d.value = new THREE.Color(colorD);
    meshRef.current.material.uniforms.u_color_e.value = new THREE.Color(colorE);

    position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <>
      <mesh
        ref={meshRef}
        scale={[1.2, 1, 1]}
        onPointerMove={(e) => {
          // マウスホバー時にspeedとprocessingの値を増やす
          // hover.current.speed = 1.2; // 例として2倍に増やす
          hover.current.speed = THREE.MathUtils.lerp(1, 2, 0.1);
          hover.current.spike = THREE.MathUtils.lerp(1, 1.2, 0.05);

          // hover.current.processing = 1.3; // 例として1.5倍に増やす
          hover.current.processing = THREE.MathUtils.lerp(1, 2, 0.1);
          // setHover({ speed: 1.2, processing: 1.2 });
        }}
        onPointerOut={() => {
          // マウスがジオメトリから外れたら元の値に戻す
          hover.current.speed = THREE.MathUtils.lerp(
            hover.current.speed,
            1,
            0.1
          );
          hover.current.spike = THREE.MathUtils.lerp(
            hover.current.spike,
            1,
            0.1
          );
          hover.current.processing = THREE.MathUtils.lerp(
            hover.current.processing,
            1,
            0.1
          );
          // setHover({ speed: 1, processing: 1 });
        }}
      >
        <sphereGeometry args={[0.8, 256, 256]} />
        <shaderMaterial
          uniforms={uniforms}
          fragmentShader={fragmentShader}
          vertexShader={vertexShader}
        />
      </mesh>
    </>
  );
};

const TransparentScene = () => {
  const {
    colorA,
    colorB,
    colorC,
    colorD,
    colorE,
    clear_speed,
    clear_spike,
    clear_processing,
  } = useControls({
    colorA: "#fd038d",
    colorB: "#f005fc",
    colorC: "#8c10b7",
    colorD: "#4ac1c7",
    colorE: "#f99718",
    clear_speed: {
      value: 32,
      min: 10,
      max: 120,
      step: 1,
    },
    clear_spike: {
      value: 0.6,
      min: 0.05,
      max: 2,
      step: 0.05,
    },
    clear_processing: {
      value: 1,
      min: 0.6,
      max: 2.4,
      step: 0.1,
    },
  });

  const uniforms = useMemo(() => {
    return {
      u_time: {
        value: 0.0,
      },
      u_color_a: {
        value: new THREE.Color(colorA),
      },
      u_color_b: {
        value: new THREE.Color(colorB),
      },
      u_color_c: {
        value: new THREE.Color(colorC),
      },
      u_color_d: {
        value: new THREE.Color(colorD),
      },
      u_color_e: {
        value: new THREE.Color(colorE),
      },
    };
  }, []);

  const meshRef = useRef();
  const simplex = createNoise3D();

  useFrame(({ clock }) => {
    let speedSlider = clear_speed;
    let spikesSlider = clear_spike;
    let processingSlider = clear_processing;
    let time =
      performance.now() * 0.00001 * speedSlider * Math.pow(processingSlider, 3);
    let spikes = spikesSlider * processingSlider;

    const mesh = meshRef.current;
    const { geometry } = mesh;
    const { position } = geometry.attributes;
    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const p = new THREE.Vector3();
      p.fromBufferAttribute(positions, i);
      p.normalize().multiplyScalar(
        1 + 0.3 * simplex(p.x * spikes, p.y * spikes, p.z * spikes + time)
      );
      meshRef.current.geometry.attributes.position.setXYZ(i, p.x, p.y, p.z);
    }

    meshRef.current.material.uniforms.u_time.value = clock.getElapsedTime();
    meshRef.current.material.uniforms.u_color_a.value = new THREE.Color(colorA);
    meshRef.current.material.uniforms.u_color_b.value = new THREE.Color(colorB);
    meshRef.current.material.uniforms.u_color_c.value = new THREE.Color(colorC);
    meshRef.current.material.uniforms.u_color_d.value = new THREE.Color(colorD);
    meshRef.current.material.uniforms.u_color_e.value = new THREE.Color(colorE);

    position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <>
      <mesh ref={meshRef} position={[0, 0, -1.2]} scale={[2.2, 1.8, 2.2]}>
        <sphereGeometry args={[0.8, 256, 256]} />
        <shaderMaterial
          uniforms={uniforms}
          fragmentShader={fragmentShader_transParent}
          vertexShader={vertexShader}
          transparent={true}
        />
      </mesh>
    </>
  );
};

const App = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.5] }}
      gl={{
        powerPreference: "high-performance",
        alpha: true,
        antialias: true,
      }}
    >
      <color attach="background" args={["#fff"]} />
      <ambientLight />
      <directionalLight intensity={5} color="#ffffff" position={[0, 5, 5]} />
      <Scene />
      <TransparentScene />
    </Canvas>
  );
};

export default App;
