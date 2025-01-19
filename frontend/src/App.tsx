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
			{ id: 2, name: 'Factory', cost: 50, effect: () => addResource(30) },
			{ id: 3, name: 'House', cost: 10, effect: () => addResource(1) },
			{ id: 4, name: 'Shop', cost: 30, effect: () => addResource(15) },
			{ id: 5, name: 'Town Hall', cost: 60, effect: () => addResidents(5) }, // 新しいカード
		];
		setHand(initialHand);
	}, []);

	const addResource = (amount: number) => {
		if (gameState) {
			const updatedResources = gameState.resources + amount;
			setGameState({ ...gameState, resources: updatedResources });
			// バックエンドに更新を送信
			axios.post('/api/game-state', { resources: updatedResources })
				.catch(error => {
					console.error('Error updating resources:', error);
					setNotification('資源の更新に失敗しました。');
				});
		}
	};

	const addResidents = (amount: number) => {
		if (gameState) {
			const updatedResidents = gameState.residents + amount;
			setGameState({ ...gameState, residents: updatedResidents });
			// バックエンドに更新を送信
			axios.post('/api/game-state', { residents: updatedResidents })
				.catch(error => {
					console.error('Error updating residents:', error);
					setNotification('住民数の更新に失敗しました。');
				});
		}
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
				<PerspectiveCamera makeDefault position={[0, 10, 20]} />
				<ambientLight intensity={0.5} />
				<directionalLight position={[10, 10, 5]} intensity={1} />
				{/* フィールドのレンダリング */}
				{gameState.field.map((building, index) => {
					const position: [number, number, number] = [
						(index % 4) * 2, // X座標
						0,               // Y座標（モデルによって調整）
						Math.floor(index / 4) * 2 // Z座標
					];

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
