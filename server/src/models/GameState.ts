// server/src/models/GameState.ts

export type GameState = {
	turn: number;
	resources: number;
	field: (string | null)[];
	residents: number;
};
