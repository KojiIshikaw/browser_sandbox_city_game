import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import axios from 'axios';
import Hand from './components/Hand'; // Hand コンポーネントのインポート
import House from './components/House';
import Farm from './components/Farm';

type GameState = {
	turn: number;
	resources: number;
	field: (string | null)[];
	residents: number; // 住民数を追加
};

type Card = {
	id: number;
	name: string;
	cost: number;
	effect: () => void;
};

const App: React.FC = () => {
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [hand, setHand] = useState<Card[]>([]);
	const [notification, setNotification] = useState<string | null>(null);

	// ゲーム状態の取得
	useEffect(() => {
		axios.get<GameState>('/api/game-state')
			.then(response => {
				setGameState(response.data);
			})
			.catch(error => {
				console.error('Error fetching game state:', error);
				setNotification('ゲーム状態の取得に失敗しました。');
			});
	}, []);

	// 手札の生成（例として固定のカードを使用）
	useEffect(() => {
		const initialHand: Card[] = [
			{ id: 1, name: 'Farm', cost: 20, effect: () => addResource(10) },
			{ id: 2, name: 'Farm', cost: 20, effect: () => addResource(10) },
			{ id: 3, name: 'Factory', cost: 50, effect: () => addResource(30) },
			{ id: 4, name: 'House', cost: 10, effect: () => addResource(1) },
			{ id: 5, name: 'Shop', cost: 30, effect: () => addResource(15) },
			{ id: 6, name: 'Town Hall', cost: 60, effect: () => addResidents(5) }, // 新しいカード
		];
		setHand(initialHand);
	}, []);

	const addResource = (amount: number) => {
		setGameState(prevState => {
			if (!prevState) return prevState;
			const updatedResources = prevState.resources + amount;

			// バックエンドに更新を送信
			axios.post('/api/game-state', { resources: updatedResources })
				.catch(error => {
					console.error('Error updating resources:', error);
					setNotification('資源の更新に失敗しました。');
				});

			return { ...prevState, resources: updatedResources };
		});
	};

	const addResidents = (amount: number) => {
		setGameState(prevState => {
			if (!prevState) return prevState;
			const updatedResidents = prevState.residents + amount;

			// バックエンドに更新を送信
			axios.post('/api/game-state', { residents: updatedResidents })
				.catch(error => {
					console.error('Error updating residents:', error);
					setNotification('住民数の更新に失敗しました。');
				});

			return { ...prevState, residents: updatedResidents };
		});
	};

	const handleCardSelect = (card: Card) => {
		if (gameState) {
			// 資源のチェック
			if (gameState.resources < card.cost) {
				setNotification('資源が足りません!');
				return;
			}

			// 建物の配置をバックエンドにリクエスト（ランダム配置）
			axios.post('/api/place-building', { building: card.name })
				.then(response => {
					setGameState(response.data);
					// カードの効果を適用
					card.effect();
					// 手札からカードを削除
					setHand(prev => prev.filter(c => c.id !== card.id));
				})
				.catch(error => {
					console.error('Error placing building:', error);
					setNotification(error.response?.data?.error || '建物の配置に失敗しました。');
				});
		}
	};

	// 通知メッセージを一定時間後に消す
	useEffect(() => {
		if (notification) {
			const timer = setTimeout(() => setNotification(null), 3000);
			return () => clearTimeout(timer);
		}
	}, [notification]);

	if (!gameState) {
		return <div>Loading...</div>;
	}

	return (
		<div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
			<Canvas>
				{/* 背景色を空色に設定 */}
				<color attach="background" args={['skyblue']} />

				<PerspectiveCamera makeDefault position={[0, 10, 20]} />
				<ambientLight intensity={1.2} />
				<directionalLight position={[10, 10, 5]} intensity={1.5} />

				{/* 茶色の地面を追加 */}
				<mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, -0.5, 3]}>
					<planeGeometry args={[8, 8]} />
					<meshStandardMaterial color="burlywood" />
				</mesh>

				{/* フィールドのレンダリング */}
				{gameState.field.map((building, index) => {
					// 基本位置を計算
					const x = (index % 4) * 2;
					const z = Math.floor(index / 4) * 2;

					// 建物の種類に応じて y 座標を設定
					let y = 0; // デフォルトの y 座標
					if (building) {
						const buildingType = building.toLowerCase();
						if (buildingType === 'farm') {
							y = -0.4; // Farm の y 座標を -0.4 に設定
						} else if (buildingType === 'house') {
							y = 0; // House の y 座標を 0 に設定（必要に応じて調整）
						} else {
							y = 0.5; // その他の建物の y 座標を 0.5 に設定
						}
					}
					const position: [number, number, number] = [x, y, z];

					if (!building) {
						return (
							<mesh
								key={index}
								position={position}
							>
								<boxGeometry args={[1, 1, 1]} />
								<meshStandardMaterial color="lightgray" opacity={0.5} transparent />
							</mesh>
						);
					}

					switch (building.toLowerCase()) {
						case 'farm':
							return <Farm key={index} position={position} />;
						case 'house':
							return <House key={index} position={position} />;
						// 他の建物タイプを追加
						default:
							return (
								building ? (
									<mesh key={index} position={[(index % 4) * 2, 0.5, Math.floor(index / 4) * 2]}>
										<boxGeometry args={[1, 1, 1]} />
										<meshStandardMaterial color={getBuildingColor(building)} />
									</mesh>
								) : (
									<mesh
										key={index}
										position={[(index % 4) * 2, 0.5, Math.floor(index / 4) * 2]}
									>
										<boxGeometry args={[1, 1, 1]} />
										<meshStandardMaterial color="lightgray" opacity={0.5} transparent />
									</mesh>
								)
							);
					}
				})}

				<OrbitControls />
			</Canvas>

			{/* UIコンポーネント */}
			<div style={{
				position: 'absolute',
				bottom: 0,
				width: '100%',
				padding: '10px',
				background: 'rgba(255, 255, 255, 0.8)',
				display: 'flex',
				justifyContent: 'center'
			}}>
				<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
					<p style={{ color: 'black' }}>ターン: {gameState.turn}</p>
					<p style={{ color: 'black' }}>資源: {gameState.resources}</p>
					<p style={{ color: 'black' }}>住民: {gameState.residents}</p>
					<Hand cards={hand} onSelect={handleCardSelect} />
				</div>
			</div>

			{/* 通知メッセージ */}
			{notification && (
				<div style={{
					position: 'absolute',
					top: '10px',
					left: '50%',
					transform: 'translateX(-50%)',
					padding: '10px 20px',
					backgroundColor: 'rgba(255, 0, 0, 0.8)',
					color: 'white',
					borderRadius: '5px',
				}}>
					{notification}
				</div>
			)}
		</div>
	);
};

// 建物の種類に応じた色を返すヘルパー関数
const getBuildingColor = (type: string): string => {
	switch (type.toLowerCase()) {
		case 'farm':
			return 'green';
		case 'factory':
			return 'red';
		case 'house':
			return 'blue';
		case 'shop':
			return 'yellow';
		default:
			return 'gray';
	}
};

export default App;
