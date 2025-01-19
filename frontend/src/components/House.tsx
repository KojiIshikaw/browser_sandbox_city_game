import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

type HouseProps = {
	position?: [number, number, number];
};

const House: React.FC<HouseProps> = ({ position = [0, 0, 0] }) => {
	// House の GLB を読み込み
	const gltf = useLoader(GLTFLoader, '/models/house.glb');

	// 毎回同じ参照を返すとシーン内で実体がひとつになるので clone() して複数配置できるようにする
	const clonedScene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

	return (
		<group position={position}>
			{/* clone した scene を配置する */}
			<primitive object={clonedScene} />
		</group>
	);
};

export default House;
