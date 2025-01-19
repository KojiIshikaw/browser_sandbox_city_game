// frontend/src/components/Farm.tsx
import React from 'react';
import { useGLTF } from '@react-three/drei';

type FarmProps = {
	position: [number, number, number];
};

const Farm: React.FC<FarmProps> = ({ position }) => {
	const { scene } = useGLTF('/models/farm.glb');
	return <primitive object={scene} position={position} />;
};

export default Farm;
