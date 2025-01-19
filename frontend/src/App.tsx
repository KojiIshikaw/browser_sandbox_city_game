// frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import axios from 'axios';
import Hand from './components/Hand'; // Hand コンポーネントのインポート

type GameState = {
	turn: number;
	resources: number;
	field: (string | null)[];
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
			{ id: 3, name: 'Research Lab', cost: 100, effect: () => addResource(60) },
			{ id: 4, name: 'Shop', cost: 30, effect: () => addResource(15) },
			{ id: 5, name: 'Market', cost: 40, effect: () => addResource(20) },
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

	const handleCardSelect = (card: Card) => {
		if (gameState) {
			// 資源のチェック
			if (gameState.resources < card.cost) {
				setNotification('資源が足りません!');
				return;
			}

			// 空いている場所を探す
			const emptyIndex = gameState.field.findIndex(slot => slot === null);
			if (emptyIndex === -1) {
				setNotification('置ける場所がありません!');
				return;
			}

			// 建物の配置をバックエンドにリクエスト
			axios.post('/api/place-building', { index: emptyIndex, building: card.name })
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
				{gameState.field.map((building, index) => (
					building ? (
						<mesh key={index} position={[(index % 4) * 2, 0.5, Math.floor(index / 4) * 2]}>
							<boxGeometry args={[1, 1, 1]} />
							<meshStandardMaterial color={getBuildingColor(building)} />
						</mesh>
					) : (
						<mesh
							key={index}
							position={[(index % 4) * 2, 0.5, Math.floor(index / 4) * 2]}
						// onClick ハンドラーを削除
						>
							<boxGeometry args={[1, 1, 1]} />
							<meshStandardMaterial color="lightgray" opacity={0.5} transparent />
						</mesh>
					)
				))}
				<OrbitControls />
			</Canvas>
			{/* UIコンポーネント */}
			<div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '10px', background: 'rgba(255, 255, 255, 0.8)' }}>
				<p>ターン: {gameState.turn}</p>
				<p>資源: {gameState.resources}</p>
				<Hand cards={hand} onSelect={handleCardSelect} />
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
		case 'research lab':
			return 'blue';
		case 'shop':
			return 'yellow';
		case 'market':
			return 'purple';
		default:
			return 'gray';
	}
};

export default App;
