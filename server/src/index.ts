// server/src/index.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import { GameState } from './models/GameState';

const app = express();
const PORT = process.env.PORT || 8000;

// ミドルウェア
app.use(cors({
	origin: 'http://localhost:3000', // フロントエンドのURL
}));
app.use(express.json());

// 静的ファイルの提供（ビルド後に有効）
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// ルートエンドポイント
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// ゲーム状態の初期化
let gameState: GameState = {
	turn: 1,
	resources: 100,
	field: Array(16).fill(null), // 4x4フィールドの初期状態
};

// ゲーム状態の取得
app.get('/api/game-state', (req, res) => {
	res.json(gameState);
});

// ゲーム状態の更新
app.post('/api/game-state', (req, res) => {
	const { turn, resources, field } = req.body;
	if (typeof turn === 'number') gameState.turn = turn;
	if (typeof resources === 'number') gameState.resources = resources;
	if (Array.isArray(field) && field.length === 16) gameState.field = field;
	res.json(gameState);
});

// 建物を配置するエンドポイント
app.post('/api/place-building', (req, res) => {
	const { index, building } = req.body;

	if (typeof index !== 'number' || index < 0 || index >= 16) {
		res.status(400).json({ error: 'Invalid index' });
		return;
	}

	if (typeof building !== 'string') {
		res.status(400).json({ error: 'Invalid building type' });
		return;
	}

	if (gameState.field[index]) {
		res.status(400).json({ error: 'Field already occupied' });
		return;
	}

	// 建物のコストをチェック
	const buildingCost = getBuildingCost(building);
	if (gameState.resources < buildingCost) {
		res.status(400).json({ error: 'Not enough resources' });
		return;
	}

	// 資源を減らす
	gameState.resources -= buildingCost;

	// 建物を配置
	gameState.field[index] = building;
	res.json(gameState);
});

// 建物のコストを定義
const getBuildingCost = (type: string): number => {
	switch (type.toLowerCase()) {
		case 'farm':
			return 20;
		case 'factory':
			return 50;
		case 'research lab':
			return 100;
		case 'shop':
			return 30;
		case 'market':
			return 40;
		default:
			return 0;
	}
};

// サーバーの起動
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
