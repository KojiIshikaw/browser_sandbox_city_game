// frontend/src/components/Hand.tsx
import React from 'react';

type Card = {
	id: number;
	name: string;
	cost: number;
	effect: () => void;
};

type HandProps = {
	cards: Card[];
	onSelect: (card: Card) => void;
};

const Hand: React.FC<HandProps> = ({ cards, onSelect }) => {
	return (
		<div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
			{cards.map(card => (
				<div
					key={card.id}
					style={{
						width: '80px',
						height: '120px',
						backgroundColor: '#fff',
						border: '1px solid #000',
						borderRadius: '5px',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
					onClick={() => onSelect(card)}
				>
					{card.name}
				</div>
			))}
		</div>
	);
};

export default Hand;
