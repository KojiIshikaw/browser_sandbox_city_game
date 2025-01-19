// frontend/src/components/House.tsx
import React from 'react';
import { useGLTF } from '@react-three/drei';

type HouseProps = {
	position: [number, number, number];
};

const House: React.FC<HouseProps> = ({ position }) => {
	const { scene } = useGLTF('/models/house.glb');
	return <primitive object={scene} position={position} />;
};

export default House;
