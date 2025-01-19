import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

type FarmProps = {
	position?: [number, number, number];
};

const Farm: React.FC<FarmProps> = ({ position = [0, 0, 0] }) => {
	// Farm の GLB を読み込み
	const gltf = useLoader(GLTFLoader, '/models/farm.glb');

	// 毎回同じ参照を返すとシーン内で実体がひとつになるので clone() して複数配置できるようにする
	const clonedScene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

	return (
		<group position={position}>
			{/* clone した scene を配置する */}
			<primitive object={clonedScene} />
		</group>
	);
};

export default Farm;
